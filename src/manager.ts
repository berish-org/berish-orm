import LINQ from '@berish/linq';
import { Entity, FileEntity } from './entity';
import { IQueryData, Query } from './query';
import { Emitter } from './utils';
import { BaseDBAdapter, IBaseDBItem } from './baseDBAdapter';
import { BaseFileAdapter, IBaseFileItem } from './baseFileAdapter';
import {
  SYMBOL_SERBER_ENTITY_CLASSNAME,
  SYMBOL_SERBER_FILES,
  SYMBOL_SERBER_CACHE_FILE_ENTITIES,
  SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES,
  SYMBOL_SERBER_CACHE_ENTITIES,
  SYMBOL_SERBER_FOR_LOAD_ENTITIES,
  serberFileEntityToDB,
  serberEntityToDB,
  serberUndefinedLabel,
  SYMBOL_SERBER_UNDEFINED_DB_LITERAL,
  SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS,
} from './serber';

export class Manager {
  private _dbAdapter: BaseDBAdapter<any> = null;
  private _fileAdapter: BaseFileAdapter<any> = null;
  private _emitter: Emitter = null;

  /**
   * Emitter для работы с событиями внутри менеджера
   */
  public get emitter() {
    if (!this._emitter) this._emitter = new Emitter();
    return this._emitter;
  }

  /**
   * Объект для работы с dbAdapter.
   * Все методы имеют непрямой доступ к адаптеру, используют проверку разрешений и оптимизацию перед реальными запросами.
   * Данные методы не стоит использовать для работы с базой данных, так как все аргементы и ответы реализованы с использованием примитивов.
   * Необходимо использовать в качестве вспомогательных методов через функции обработчики (с использованием типов ORM)
   */
  public get db() {
    return {
      create: this._db_create,
      update: this._db_update,
      index: this._db_index,
      get: this._db_get,
      delete: this._db_delete,
      find: this._db_find,
      subscribe: this._db_subscribe,
    };
  }

  /**
   * Объект для работы с fileAdapter.
   * Все методы имеют непрямой доступ к адаптеру, используют проверку разрешений и оптимизацию перед реальными запросами.
   * Данные методы не стоит использовать для работы с базой данных, так как все аргементы и ответы реализованы с использованием примитивов.
   * Необходимо использовать в качестве вспомогательных методов через функции обработчики (с использованием типов ORM)
   */
  public get file() {
    return {
      create: this._file_create,
      get: this._file_get,
      delete: this._file_delete,
    };
  }

  /**
   * Инициализация DB Adapter для работы с базой даннных
   * @param dbAdapter Адаптер базы данных
   * @param params Параметры для инициализации адаптера базы данных
   */
  public async initDbAdapter<T extends new () => BaseDBAdapter<any>>(dbAdapter: T, params: InstanceType<T>['params']) {
    if (!dbAdapter) throw new Error(`dbAdapter is undefined`);
    this._dbAdapter = new dbAdapter();
    await this._dbAdapter.initialize(params);
  }

  /**
   * Инициализация File Adapter для работы с базой данных
   * @param fileAdapter Адаптер работы с файлами
   * @param params Параметры для инициализации файлового адаптера
   */
  public async initFileAdapter<T extends new () => BaseFileAdapter<any>>(
    fileAdapter: T,
    params: InstanceType<T>['params']
  ) {
    if (!fileAdapter) throw new Error(`fileAdapter is undefined`);
    this._fileAdapter = new fileAdapter();
    await this._fileAdapter.initialize(params);
  }

  async convertDBItemsToEntities<T extends Entity>(
    className: string,
    items: IBaseDBItem[],
    deep?: number,
    cacheIgnoreIds?: string[]
  ) {
    const cacheEntities: Entity[] = [];
    const cacheFiles: FileEntity[] = [];
    let initialEntities: T[] = null;

    const fetch = async (className: string, items: IBaseDBItem[], deep: number) => {
      const forLoadEntities: Entity[] = [];
      const forLoadFiles: FileEntity[] = [];

      const deserialized: Entity[] = serberEntityToDB.deserialize(items, {
        [SYMBOL_SERBER_ENTITY_CLASSNAME]: className,
        [SYMBOL_SERBER_CACHE_ENTITIES]: cacheEntities,
        [SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS]: cacheIgnoreIds,
        [SYMBOL_SERBER_FOR_LOAD_ENTITIES]: forLoadEntities,
        [SYMBOL_SERBER_CACHE_FILE_ENTITIES]: cacheFiles,
        [SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES]: forLoadFiles,
      });

      if (!initialEntities) initialEntities = deserialized as T[];

      if (deep > 0) {
        const groupBy = LINQ.from(forLoadEntities).groupBy(m => m.className);

        await Promise.all(
          groupBy.map(async m => {
            const className = m[0];
            const entities = m[1];
            const queryData = new Query(className).ids(entities.map(m => m.id)).json;
            const items = await this.db.find(queryData);
            await fetch(className, items, deep - 1);
          })
        );

        await Promise.all(forLoadFiles.map(m => this.getFile(m)));
      }
    };

    await fetch(className, items, typeof deep === 'number' ? deep : 1);
    return initialEntities;
  }

  /**
   *
   * @param items
   * @param deep
   */
  async getAll<T extends Entity>(items: { id: string; className: string }[], deep?: number) {
    const groupBy = LINQ.from(LINQ.from(items).groupBy(m => m.className));
    const data = await Promise.all(
      groupBy.select(async m => {
        const items = await new Query<T>(m[0]).ids(m[1].map(m => m.id)).find(this, deep || 0);
        return {
          className: m[0],
          items,
        };
      })
    );
    return LINQ.from(data).reduce<{ [className: string]: T[] }>(
      (prev, current) => ({ ...prev, [current.className]: current.items }),
      {}
    );
  }

  async save(items: Entity[]) {
    await Promise.all(
      LINQ.from(items)
        .groupBy(m => m.className)
        .map(async m => {
          const serialized: IBaseDBItem[] = serberEntityToDB.serialize(m[1]);
          await this.db.update(m[0], serialized);
        })
    );
  }

  async remove(items: Entity[]) {
    await Promise.all(
      LINQ.from(items)
        .groupBy(m => m.className)
        .map(m => this._dbAdapter.delete(new Query(m[0]).ids(m[1].map(k => k.id)).json))
    );
  }

  /**
   * Главный метод для получения файлов
   * @param single ID файла или существующий FileEntity
   * @param array ID файлов или существующие FileEntity
   * @param fetchData Если true то указываем, что необходимо получить контент файлов. Если false то получает только мета-информацию по файлам. По-умолчанию false
   */
  public async getFile(single: string | FileEntity, fetchData?: boolean): Promise<FileEntity>;
  public async getFile(array: (string | FileEntity)[], fetchData?: boolean): Promise<FileEntity[]>;
  public async getFile(
    arg: string | FileEntity | (string | FileEntity)[],
    fetchData?: boolean
  ): Promise<FileEntity | FileEntity[]> {
    const arr = Array.isArray(arg) ? arg : [arg];
    if (arr.some(m => !(m instanceof FileEntity) && typeof m !== 'string'))
      throw new Error('ORM: argument to removeFile is not FileEntity or string');
    const files = arr.map(m => {
      if (m instanceof FileEntity) return m;
      const fileEntity = new FileEntity();
      fileEntity.setId(m);
      return fileEntity;
    });
    const items = await this.file.get(
      files.map(m => m.id),
      fetchData
    );
    const deserialized: FileEntity[] = serberFileEntityToDB.deserialize(items, { [SYMBOL_SERBER_FILES]: files });
    return Array.isArray(arg) ? deserialized : deserialized[0];
  }

  public async saveFile(files: FileEntity | FileEntity[]): Promise<void> {
    const arr = Array.isArray(files) ? files : [files];
    if (arr.some(m => !(m instanceof FileEntity))) throw new Error('ORM: argument to saveFile is not FileEntity');
    const serialized: IBaseFileItem[] = serberFileEntityToDB.serialize(arr);
    await this.file.create(serialized);
  }

  public async deleteFile(files: string | string[] | FileEntity | FileEntity[]): Promise<void> {
    const arr = Array.isArray(files) ? files : [files];
    if (arr.some(m => !(m instanceof FileEntity) && typeof m !== 'string'))
      throw new Error('ORM: argument to removeFile is not FileEntity or string');
    const ids = arr.map(m => (m instanceof FileEntity ? m.id : m));
    await this.file.delete(ids);
  }

  private _db_create = (table: string, items: IBaseDBItem[]): Promise<void> => {
    return this._dbAdapter.create(table, items);
  };

  private _db_update = async (table: string, items: IBaseDBItem[]): Promise<void> => {
    // const deserialized = await serberInstance.serializeAsync(items, {
    //   [SYMBOL_SERBER_UNDEFINED_DB_LITERAL]: this._dbAdapter.emptyFieldLiteral,
    // });
    const deserialized: IBaseDBItem[] = serberUndefinedLabel.serialize(items, {
      [SYMBOL_SERBER_UNDEFINED_DB_LITERAL]: this._dbAdapter.emptyFieldLiteral,
    });
    return this._dbAdapter.update(table, deserialized);
  };

  private _db_index = (table: string, indexName: string, keys?: string[]): void => {
    return this._dbAdapter.index(table, indexName, keys);
  };

  private _db_get = (data: IQueryData): Promise<IBaseDBItem> => {
    const query = Query.fromJSON(data);
    const hash = query.hash;
    return this.emitter.cacheCall(hash, () => this._dbAdapter.get(data));
  };

  private _db_delete = (data: IQueryData): Promise<void> => {
    const query = Query.fromJSON(data);
    const hash = query.hash;
    return this.emitter.cacheCall(hash, () => this._dbAdapter.delete(data));
  };

  private _db_find = (data: IQueryData): Promise<IBaseDBItem[]> => {
    const query = Query.fromJSON(data);
    const hash = query.hash;
    return this.emitter.cacheCall(hash, () => this._dbAdapter.find(data));
  };

  private _db_subscribe = (
    data: IQueryData,
    callback: (oldValue: IBaseDBItem, newValue: IBaseDBItem) => any
  ): (() => any) => {
    const query = Query.fromJSON(data);
    const hash = query.hash;
    return this.emitter.cacheSubscribe(
      hash,
      eventName =>
        this._dbAdapter.subscribe(data, (oldValue, newValue) => {
          this.emitter.emit(eventName, { oldValue, newValue });
        }),
      ({ oldValue, newValue }) => callback(oldValue, newValue)
    );
  };

  private _file_create = (items: IBaseFileItem[]): Promise<void> => {
    return this._fileAdapter.create(items);
  };

  private _file_get = (ids: string[], fetchData: boolean): Promise<IBaseFileItem[]> => {
    return this._fileAdapter.get(ids, fetchData);
  };

  private _file_delete = (ids: string[]): Promise<void> => {
    return this._fileAdapter.delete(ids);
  };
}
