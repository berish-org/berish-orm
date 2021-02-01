import { ISerberPlugin, SERBER_KEY_SYMBOL, SERBER_PARENT_OBJECT_SYMBOL, SERBER_PATH_SYMBOL } from '@berish/serber';
import { Entity } from '../entity';
import { IRaw, RawTypeEnum, isRaw } from './abstract';
import { serberFullRaw } from './instances';
import { createEntity } from '../registrator';
import { setIsFetched } from '../entity/methods';

export interface IFullEntity extends IRaw<RawTypeEnum.fullEntity> {
  id: string;
  className: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any;
}

export const entityToFullEntityPlugin: ISerberPlugin<Entity, IFullEntity, {}> = {
  isForSerialize: (obj) => obj instanceof Entity,
  isForDeserialize: (obj) => isRaw(obj) && obj.__type__ === RawTypeEnum.fullEntity,
  isAlreadySerialized: (obj) => entityToFullEntityPlugin.isForDeserialize(obj as IFullEntity),
  isAlreadyDeserialized: (obj) => entityToFullEntityPlugin.isForSerialize(obj as Entity),
  serialize: (obj, options) => {
    const className = obj.className;
    const { id, createdAt, updatedAt, ...attributes } = obj.attributes;
    const serialized = serberFullRaw.serialize(attributes);
    const out: IFullEntity = {
      __type__: RawTypeEnum.fullEntity,
      id,
      className,
      createdAt: createdAt && +createdAt,
      updatedAt: updatedAt && +updatedAt,
      ...serialized,
    };
    return out;
  },
  deserialize: (obj, options) => {
    const { id, className, createdAt, updatedAt, __type__, ...attributes } = obj;
    const deserialized = serberFullRaw.deserialize(attributes);
    const entity = createEntity(className, {
      id,
      createdAt: createdAt && new Date(createdAt),
      updatedAt: updatedAt && new Date(updatedAt),
      ...deserialized,
    });
    setIsFetched(entity, true);
    return entity;
  },
};
