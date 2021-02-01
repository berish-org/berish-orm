import { ISerberPlugin } from '@berish/serber';

import { FileEntity } from '../../entity';
import { getDate, getTimestamp } from '../../utils';
import { isRaw, RawTypeEnum, IRaw } from '../abstract';

export interface IFullFileEntity extends IRaw<RawTypeEnum.fullFileEntity> {
  id: string;
  name: string;
  createdAt: number;
}

export const fileEntityToFullFileEntityPlugin: ISerberPlugin<FileEntity, IFullFileEntity, {}> = {
  isForSerialize: (obj, options) => obj instanceof FileEntity,
  isForDeserialize: (obj) => isRaw(obj) && obj.__type__ === RawTypeEnum.fullFileEntity,
  isAlreadySerialized: (obj) => fileEntityToFullFileEntityPlugin.isForDeserialize(obj as IFullFileEntity),
  isAlreadyDeserialized: (obj) => fileEntityToFullFileEntityPlugin.isForSerialize(obj as FileEntity),
  serialize: (obj) => {
    const { id, name, createdAt } = obj;
    const out: IFullFileEntity = {
      id: obj.id,
      name: obj.name,
      __type__: RawTypeEnum.fullFileEntity,
      createdAt: getTimestamp(createdAt),
    };
    return out;
  },
  deserialize: (obj) => {
    const out = new FileEntity();
    out.attributes.id = obj.name;
    out.attributes.createdAt = getDate(obj.createdAt);

    out.setName(obj.name);
    return out;
  },
};
