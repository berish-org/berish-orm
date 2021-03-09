import LINQ from '@berish/linq';
import { CacheEmitter } from '@berish/emitter';
import { Entity, FileEntity } from '../entity';
import { QueryData, QueryDataSchema, Query } from '../query';
import { BaseDBAdapter, IBaseDBItem } from '../baseDBAdapter';
import { BaseFileAdapter, IBaseFileItem } from '../baseFileAdapter';
import * as methods from './methods';

export class Manager {
  private _dbAdapter: BaseDBAdapter<any> = null;
  private _fileAdapter: BaseFileAdapter<any> = null;
  private _cacheEmitter: CacheEmitter = null;

  /**
   * Emitter для работы с событиями внутри менеджера
   */
  public get cacheEmitter() {
    if (!this._cacheEmitter) this._cacheEmitter = new CacheEmitter();
    return this._cacheEmitter;
  }

  public get isInitializedDbAdapter() {
    return !!this._dbAdapter;
  }

  public get isInitializedFileAdapter() {
    return !!this._fileAdapter;
  }

  /**
   * Объект для работы с dbAdapter.
   * Все методы имеют непрямой доступ к адаптеру, используют проверку разрешений и оптимизацию перед реальными запросами.
   * Данные методы не стоит использовать для работы с базой данных, так как все аргументы и ответы реализованы с использованием примитивов.
   * Необходимо использовать в качестве вспомогательных методов через функции обработчики (с использованием типов ORM)
   */
  public get db() {
    return {
      create: this._db_create,
      update: this._db_update,
      index: this._db_index,
      get: this._db_get,
      count: this._db_count,
      delete: this._db_delete,
      find: this._db_find,
      subscribe: this._db_subscribe,
    };
  }

  /**
   * Объект для работы с fileAdapter.
   * Все методы имеют непрямой доступ к адаптеру, используют проверку разрешений и оптимизацию перед реальными запросами.
   * Данные методы не стоит использовать для работы с базой данных, так как все аргументы и ответы реализованы с использованием примитивов.
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
    params: InstanceType<T>['params'],
  ) {
    if (!fileAdapter) throw new Error(`fileAdapter is undefined`);
    this._fileAdapter = new fileAdapter();
    await this._fileAdapter.initialize(params);
  }

  public async closeDbAdapter() {
    if (this.isInitializedDbAdapter) {
      await this._dbAdapter.close();
      this._dbAdapter = null;
    }
  }

  public async closeFileAdapter() {
    if (this.isInitializedFileAdapter) {
      await this._fileAdapter.close();
      this._fileAdapter = null;
    }
  }

  /**
   *
   * @param items
   * @param deep
   */
  async getAll<T extends Entity>(items: { id: string; className: string }[], deep?: number) {
    const groupBy = LINQ.from(LINQ.from(items).groupBy((m) => m.className));
    const data = await Promise.all(
      groupBy.select(async (m) => {
        const items = await new Query<T>(m[0]).ids(m[1].map((m) => m.id)).find(this, deep || 0);
        return {
          className: m[0],
          items,
        };
      }),
    );
    return LINQ.from(data).reduce<{ [className: string]: T[] }>(
      (prev, current) => ({ ...prev, [current.className]: current.items }),
      {},
    );
  }

  async save(items: Entity[]) {
    await methods.saveEntity(this, items);
  }

  async remove(items: Entity[]) {
    await methods.removeEntity(this, items);
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
    fetchData?: boolean,
  ): Promise<FileEntity | FileEntity[]> {
    const arr = Array.isArray(arg) ? arg : [arg];
    const deserialized = await methods.getFile(this, arr);
    return Array.isArray(arg) ? deserialized : deserialized[0];
  }

  /**
   * Метод для сохранения файлов
   * @param files FileEntity или массив FileEntity
   */
  public async saveFile(files: FileEntity | FileEntity[]): Promise<void> {
    await methods.saveFile(this, files);
  }

  /**
   * Метод для удаления файлов
   * @param files FileEntity или массив FileEntity
   */
  public async removeFile(files: string | string[] | FileEntity | FileEntity[]): Promise<void> {
    await methods.removeFile(this, files);
  }

  // ВНУТРЕННИЕ МЕТОДЫ

  private _db_create = (table: string, items: IBaseDBItem[]): Promise<void> => {
    return this._dbAdapter.create(table, items);
  };

  private _db_update = async (table: string, items: IBaseDBItem[]): Promise<void> => {
    return this._dbAdapter.update(table, items);
  };

  private _db_index = (table: string, indexName: string, keys?: string[]): void => {
    return this._dbAdapter.index(table, indexName, keys);
  };

  private _db_get = (data: QueryData<QueryDataSchema>): Promise<IBaseDBItem> => {
    const query = Query.fromJSON(data);
    const methodName = 'get';
    const eventName = `${query.hash}_${methodName}`;
    return this.cacheEmitter.call(eventName, () => this._dbAdapter.get(data));
  };

  private _db_count = (data: QueryData<QueryDataSchema>): Promise<number> => {
    const query = Query.fromJSON(data);
    const methodName = 'count';
    const eventName = `${query.hash}_${methodName}`;
    return this.cacheEmitter.call(eventName, () => this._dbAdapter.count(data));
  };

  private _db_delete = (data: QueryData<QueryDataSchema>): Promise<void> => {
    const query = Query.fromJSON(data);
    const methodName = 'delete';
    const eventName = `${query.hash}_${methodName}`;
    return this.cacheEmitter.call(eventName, () => this._dbAdapter.delete(data));
  };

  private _db_find = (data: QueryData<QueryDataSchema>): Promise<IBaseDBItem[]> => {
    const query = Query.fromJSON(data);
    const methodName = 'find';
    const eventName = `${query.hash}_${methodName}`;
    return this.cacheEmitter.call(eventName, () => this._dbAdapter.find(data));
  };

  private _db_subscribe = (
    data: QueryData<QueryDataSchema>,
    callback: (oldValue: IBaseDBItem, newValue: IBaseDBItem, newValueIndex?: number) => any,
    onError?: (reason: any) => any,
  ): (() => any) => {
    const hash = Query.getHash(data);
    const methodName = 'subscribe';
    const eventName = `${hash}_${methodName}`;

    const eventHash = this.cacheEmitter.subscribe<{
      oldValue: IBaseDBItem;
      newValue: IBaseDBItem;
      newValueIndex?: number;
    }>(
      eventName,
      (callback) => {
        const onDisconnect = this._dbAdapter.subscribe(
          data,
          async (oldValue, newValue) => {
            if (!oldValue && newValue) {
              const items = await this.db.find(Query.fromJSON(data).pluck('id').json);
              const valueIndex = (items || []).map((m) => m && m.id).indexOf(newValue.id);
              const newValueIndex = valueIndex === -1 ? undefined : valueIndex;

              callback({ oldValue, newValue, newValueIndex });
            } else {
              callback({ oldValue, newValue });
            }
          },
          (reason) => onError && onError(reason),
        );

        return () => onDisconnect && onDisconnect();
      },
      ({ oldValue, newValue, newValueIndex }) => callback(oldValue, newValue, newValueIndex),
    );
    return () => this.cacheEmitter.unsubscribe(eventHash);
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
