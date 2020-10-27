import { ISerberPlugin } from '@berish/serber';
import { Entity } from '../entity';
import { IRaw, RawTypeEnum, isRaw } from './abstract';
import { createEntity } from '../registrator';

/**
 * Параметр, в котором мы указываем пустой массив на входе.
 * В него будут подгружены все Entities в момент десериализации.
 * Они будут пустые, но ссылочными.
 * Нужно, чтобы мы в одном месте смогли разом подгрузить всю информацию для них.
 * Если параметр не указан, но указан менеджер, при асинхронной десериализации каждый объект самостоятельно подгрузиться
 * (Подгрузка только name, data мы можем подгрузить только конкретно)
 */
export const SYMBOL_SERBER_CACHE_ENTITIES = Symbol('serberCacheEntities');

/**
 * Параметр, в который мы указываем массив String значений
 * Показывает, при каких id не нужно добавлять в кеш значение
 */
export const SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS = Symbol('serberCacheEntitiesIgnoreIds');

export const SYMBOL_SERBER_FOR_LOAD_ENTITIES = Symbol('serberForLoadEntities');

export interface IEntityPointer extends IRaw<RawTypeEnum.entityPointer> {
  /**
   * Ссылка на оригинальный объект, имеет следующий вид '${id:string}:${className:string}'
   */
  link: string;
}

export interface IEntityToEntityPointerPluginOptions {
  [SYMBOL_SERBER_CACHE_ENTITIES]?: Entity[];
  [SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS]?: string[];
  [SYMBOL_SERBER_FOR_LOAD_ENTITIES]?: Entity[];
}

export const entityToEntityPointerPlugin: ISerberPlugin<Entity, IEntityPointer, IEntityToEntityPointerPluginOptions> = {
  isForSerialize: obj => obj instanceof Entity,
  isForDeserialize: obj => isRaw(obj) && obj.__type__ === RawTypeEnum.entityPointer,
  isAlreadySerialized: obj => entityToEntityPointerPlugin.isForDeserialize(obj as IEntityPointer),
  isAlreadyDeserialized: obj => entityToEntityPointerPlugin.isForSerialize(obj as Entity),
  serialize: obj => {
    const out: IEntityPointer = { __type__: RawTypeEnum.entityPointer, link: `${obj.id}:${obj.className}` };
    return out;
  },
  deserialize: (obj, options) => {
    const [id, className] = obj.link.split(':');
    if (!id || !className) return null;

    const cacheEntities = options[SYMBOL_SERBER_CACHE_ENTITIES];
    const cacheEntitiesIgnoreIds = options[SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS];
    const forLoadEntities = options[SYMBOL_SERBER_FOR_LOAD_ENTITIES];

    if (cacheEntities) {
      const cache = cacheEntities.filter(m => m.id === id && m.className === className)[0];
      if (cache) return cache;
    }

    const entity = createEntity(className, { id });

    if (cacheEntities && !cacheEntitiesIgnoreIds?.includes(entity.id)) cacheEntities.push(entity);
    if (forLoadEntities) forLoadEntities.push(entity);

    return entity;
  },
};
