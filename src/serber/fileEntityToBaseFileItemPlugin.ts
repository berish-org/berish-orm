import { ISerberPlugin } from '@berish/serber';
import { FileEntity } from '../entity';
import { IBaseFileItem } from '../baseFileAdapter';

/**
 * Параметр,в который передают пустые fileEntities.
 * При передаче параметра при десериализации вместо создания новых fileEntity, передаются ссылки на уже существующие
 */
export const SYMBOL_SERBER_FILES = Symbol('serberFiles');

export interface IFileEntityToBaseFileItemPluginOptions {
  [SYMBOL_SERBER_FILES]?: FileEntity[];
}

export const fileEntityToBaseFileItemPlugin: ISerberPlugin<
  FileEntity,
  IBaseFileItem,
  IFileEntityToBaseFileItemPluginOptions
> = {
  isForSerialize: (obj) => obj instanceof FileEntity,
  isForDeserialize: (obj) => obj && typeof obj === 'object' && 'id' in obj && 'name' in obj,
  isAlreadySerialized: (obj) =>
    !(obj instanceof FileEntity) && fileEntityToBaseFileItemPlugin.isForDeserialize(obj as IBaseFileItem),
  isAlreadyDeserialized: (obj) => fileEntityToBaseFileItemPlugin.isForSerialize(obj as FileEntity),
  serialize: (obj) => {
    const { id, name, cacheData } = obj;
    const baseFile: IBaseFileItem = { id, name, data: cacheData };
    return baseFile;
  },
  deserialize: (obj, options) => {
    const { id, name, data } = obj;
    const fileEntity = options[SYMBOL_SERBER_FILES]
      ? options[SYMBOL_SERBER_FILES].filter((m) => m.id === id)[0]
      : new FileEntity();
    fileEntity.setId(id);
    fileEntity.setName(name);
    fileEntity.setData(data);
    return fileEntity;
  },
};
