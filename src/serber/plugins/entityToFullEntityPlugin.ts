import { ISerberPlugin } from '@berish/serber';

import { Entity } from '../../entity';
import { IRaw, RawTypeEnum, isRaw } from '../abstract';
import { createEntity } from '../../registrator';
import { setIsFetched } from '../../entity/methods';
import { serberInstances } from '../instances';
import { getDate, getTimestamp } from '../../utils';

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
    const serialized = serberInstances.serberFullRaw.serialize(attributes);
    const out: IFullEntity = {
      __type__: RawTypeEnum.fullEntity,
      id,
      className,
      createdAt: getTimestamp(createdAt),
      updatedAt: getTimestamp(updatedAt),
      ...serialized,
    };
    return out;
  },
  deserialize: (obj, options) => {
    const { id, className, createdAt, updatedAt, __type__, ...attributes } = obj;
    const deserialized = serberInstances.serberFullRaw.deserialize(attributes);
    const entity = createEntity(className, {
      id,
      createdAt: getDate(createdAt),
      updatedAt: getDate(updatedAt),
      ...deserialized,
    });
    setIsFetched(entity, true);
    return entity;
  },
};
