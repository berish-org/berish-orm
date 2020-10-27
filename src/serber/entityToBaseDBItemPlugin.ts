import { ISerberPlugin, SERBER_KEY_SYMBOL, SERBER_PARENT_OBJECT_SYMBOL, SERBER_PATH_SYMBOL } from '@berish/serber';
import { Entity, FileEntity } from '../entity';
import { IBaseDBItem } from '../baseDBAdapter';
import { createEntity } from '../registrator';
import { serberEntitiesToPointer } from './instances';
import {
  SYMBOL_SERBER_CACHE_ENTITIES,
  SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS,
  SYMBOL_SERBER_FOR_LOAD_ENTITIES,
} from './entityToEntityPointerPlugin';
import {
  SYMBOL_SERBER_CACHE_FILE_ENTITIES,
  SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES,
} from './fileEntityToFileEntityPointerPlugin';

/**
 * Параметр, который указывает className. Только при десериализации (любой)
 */
export const SYMBOL_SERBER_ENTITY_CLASSNAME = Symbol('serberEntityClassname');

export interface IEntityToBaseDBItemPluginOptions {
  [SYMBOL_SERBER_ENTITY_CLASSNAME]?: string;
  [SYMBOL_SERBER_CACHE_ENTITIES]?: Entity[];
  [SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS]?: string[];
  [SYMBOL_SERBER_CACHE_FILE_ENTITIES]?: FileEntity[];
  [SYMBOL_SERBER_FOR_LOAD_ENTITIES]?: Entity[];
  [SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES]?: FileEntity[];
}

/**
 * При сериализации используется синхронная сереализация.
 * При десериализации использовать строго асинхронный метод и передать параметры
 */
export const entityToBaseDBItemPlugin: ISerberPlugin<Entity, IBaseDBItem, IEntityToBaseDBItemPluginOptions> = {
  isForSerialize: obj => obj instanceof Entity,
  isForDeserialize: (obj, options) => obj && typeof obj === 'object' && !!options[SYMBOL_SERBER_ENTITY_CLASSNAME],
  isAlreadySerialized: obj => obj && typeof obj === 'object' && 'id' in obj && !(obj instanceof Entity),
  isAlreadyDeserialized: obj => obj instanceof Entity,
  serialize: (obj, options) => {
    const { id, ...attributes } = obj.attributes;
    /**
     * TODO: Здесь не хватает дополнительной обработки createdAt, updatedAt, deletedAt
     */
    const out: IBaseDBItem = { id };
    const entries = Object.entries(attributes);
    for (const [key, value] of entries) {
      const serialized = serberEntitiesToPointer.serialize(value, {
        ...options,
        [SERBER_KEY_SYMBOL]: key,
        [SERBER_PARENT_OBJECT_SYMBOL]: obj,
        [SERBER_PATH_SYMBOL]: options[SERBER_PATH_SYMBOL].concat(key),
      });
      out[key] = serialized;
    }
    return out;
  },
  deserialize: (obj, options) => {
    const className = options[SYMBOL_SERBER_ENTITY_CLASSNAME];
    const cacheEntities = options[SYMBOL_SERBER_CACHE_ENTITIES];
    const cacheEntitiesIgnoreIds = options[SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS];
    const forLoadEntities = options[SYMBOL_SERBER_FOR_LOAD_ENTITIES];

    if (!className) return null;
    /**
     * TODO: обработка для createdAt, updatedAt, deletedAt
     */
    const { id, ...attributes } = obj;
    const entries = Object.entries(attributes);

    const cachedEntity = cacheEntities?.filter(m => m.id === id && m.className === className)[0];

    if (cachedEntity) {
      if (cachedEntity.isFetched) return cachedEntity;
    }

    const entity = cachedEntity || createEntity(className, { id });

    for (const [key, value] of entries) {
      const deserialized = serberEntitiesToPointer.deserialize(value, {
        ...options,
        [SYMBOL_SERBER_CACHE_ENTITIES]: cacheEntities,
        [SYMBOL_SERBER_CACHE_ENTITIES_IGNORE_IDS]: cacheEntitiesIgnoreIds,
        [SYMBOL_SERBER_CACHE_FILE_ENTITIES]: options[SYMBOL_SERBER_CACHE_FILE_ENTITIES],
        [SYMBOL_SERBER_FOR_LOAD_ENTITIES]: forLoadEntities,
        [SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES]: options[SYMBOL_SERBER_FOR_LOAD_FILE_ENTITIES],
        [SERBER_KEY_SYMBOL]: key,
        [SERBER_PARENT_OBJECT_SYMBOL]: obj,
        [SERBER_PATH_SYMBOL]: options[SERBER_PATH_SYMBOL].concat(key),
      });

      entity.set(key, deserialized);
    }
    Entity._setIsFetched(entity, true);
    if (!cachedEntity && !cacheEntitiesIgnoreIds?.includes(entity.id)) cacheEntities.push(entity);

    return entity;
  },
};
