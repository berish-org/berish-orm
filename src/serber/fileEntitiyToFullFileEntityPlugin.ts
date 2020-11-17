import { ISerberPlugin } from '@berish/serber';
import { FileEntity } from '../entity';
import { isRaw, RawTypeEnum, IRaw } from './abstract';

export interface IFullFileEntity extends IRaw<RawTypeEnum.fullFileEntity> {
  id: string;
  name: string;
}

export const fileEntityToFullFileEntityPlugin: ISerberPlugin<FileEntity, IFullFileEntity, {}> = {
  isForSerialize: (obj, options) => obj instanceof FileEntity,
  isForDeserialize: (obj) => isRaw(obj) && obj.__type__ === RawTypeEnum.fullFileEntity,
  isAlreadySerialized: (obj) => fileEntityToFullFileEntityPlugin.isForDeserialize(obj as IFullFileEntity),
  isAlreadyDeserialized: (obj) => fileEntityToFullFileEntityPlugin.isForSerialize(obj as FileEntity),
  serialize: (obj) => {
    const out: IFullFileEntity = { id: obj.id, name: obj.name, __type__: RawTypeEnum.fullFileEntity };
    return out;
  },
  deserialize: (obj) => {
    const out = new FileEntity();
    out.setId(obj.id);
    out.setName(obj.name);
    return out;
  },
};
