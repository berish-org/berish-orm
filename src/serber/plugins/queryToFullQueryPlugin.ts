import { ISerberPlugin } from '@berish/serber';

import { Entity } from '../../entity';
import { IRaw, RawTypeEnum, isRaw } from '../abstract';
import { serberInstances } from '../instances';
import { Query } from '../../query';

export interface IFullQuery extends IRaw<RawTypeEnum.fullQuery> {
  data: any[];
}

export const queryToFullQueryPlugin: ISerberPlugin<Query<Entity>, IFullQuery, {}> = {
  isForSerialize: (obj) => obj instanceof Query,
  isForDeserialize: (obj) => isRaw(obj) && obj.__type__ === RawTypeEnum.fullQuery,
  isAlreadySerialized: (obj) => queryToFullQueryPlugin.isForDeserialize(obj as IFullQuery),
  isAlreadyDeserialized: (obj) => queryToFullQueryPlugin.isForSerialize(obj as Query<Entity>),
  serialize: (obj, options) => {
    const data = serberInstances.serberFullRaw.serialize(obj.json);

    const out: IFullQuery = {
      __type__: RawTypeEnum.fullQuery,
      data,
    };
    return out;
  },
  deserialize: (obj, options) => {
    const { data } = obj;
    const json = serberInstances.serberFullRaw.deserialize(data);
    const query = Query.fromJSON(json);

    return query;
  },
};
