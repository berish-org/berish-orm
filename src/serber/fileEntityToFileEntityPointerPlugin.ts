import { ISerberPlugin } from '@berish/serber';
import { FileEntity } from '../entity';
import { isRaw, IRaw, RawTypeEnum, SYMBOL_SERBER_MANAGER_INSTANCE } from './abstract';
import { Manager } from '../manager';

/**
 * Параметр, в котором мы указываем пустой массив на входе.
 * В него будут подгружены все FileEntity в момент десериализации.
 * Они будут пустые, но ссылочными.
 * Нужно, чтобы мы в одном месте смогли разом подгрузить всю информацию для них.
 * Если параметр не указан, но указан менеджер, при асинхронной десериализации каждый объект самостоятельно подгрузиться
 * (Подгрузка только name, data мы можем подгрузить только конкретно)
 */
export const SYMBOL_SERBER_CACHE_FILE_ENTITIES = Symbol('serberCacheFileEntities');

export const SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES = Symbol('serberForLoadFileEntities');

export interface IFilePointer extends IRaw<RawTypeEnum.fileEntityPointer> {
  /** Ссылка на оригинальный объект, имеет следующий вид '${id:string}' */
  link: string;
}

export interface IFileEntityToFilePointerPluginOptions {
  [SYMBOL_SERBER_CACHE_FILE_ENTITIES]?: FileEntity[];
  [SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES]?: FileEntity[];
}

export const fileEntityToFileEntityPointerPlugin: ISerberPlugin<
  FileEntity,
  IFilePointer,
  IFileEntityToFilePointerPluginOptions
> = {
  isForSerialize: (obj, options) => obj instanceof FileEntity,
  isForDeserialize: obj => isRaw(obj) && obj.__type__ === RawTypeEnum.fileEntityPointer,
  isAlreadySerialized: (obj, options) => fileEntityToFileEntityPointerPlugin.isForDeserialize(obj as IFilePointer),
  isAlreadyDeserialized: (obj, options) =>
    fileEntityToFileEntityPointerPlugin.isForSerialize(obj as FileEntity, options),
  serialize: obj => ({ __type__: RawTypeEnum.fileEntityPointer, link: obj.id }),
  deserialize: (obj, options) => {
    const link = obj.link;
    if (!link) return null;

    const cacheFiles = options[SYMBOL_SERBER_CACHE_FILE_ENTITIES];
    const forLoadFiles = options[SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES];

    if (cacheFiles) {
      const cache = options[SYMBOL_SERBER_CACHE_FILE_ENTITIES].filter(m => m.id === link)[0];
      if (cache) return cache;
    }

    const fileEntity = new FileEntity();
    fileEntity.setId(link);

    if (cacheFiles) cacheFiles.push(fileEntity);
    if (forLoadFiles) forLoadFiles.push(fileEntity);

    return fileEntity;
  },
};
