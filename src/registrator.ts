import LINQ from '@berish/linq';
import type from '@berish/typeof';
import { Registrator } from '@berish/class';
import { Entity, methods } from './entity';

const registrator = new Registrator();

/**
 * Регистрация класса сущности по названию сущности
 */
export function register(className: string, cls: (new () => Entity) | typeof Entity) {
  if (registrator.isRegisteredName(className)) throw new Error('Entity already registered with same className');
  if (registrator.isRegisteredClass(cls)) throw new Error('Entity already registered with same class');
  registrator.register(className, cls);
}

/**
 * Получение название сущности по классу сущности
 */
export function getClassNameByClass(cls: new () => Entity) {
  return registrator.getNamesByClass(cls)[0];
}

/**
 * Получение класса сущности по названию сущности
 */
export function getClassByClassName(className: string): (new () => Entity) & typeof Entity {
  return (registrator.getClassesByClassName(className)[0] as typeof Entity) || Entity;
}

/**
 * Получение класса сущности по названию сущности или по зарегистрированному классу сущности.
 * Если сущность не зарегистрирована, возвращает базовый класс сущности
 */
export function getClassByClassOrClassName(
  cls: (new () => Entity) | typeof Entity | string,
): (new () => Entity) & typeof Entity {
  const className = getClassNameByClassOrClassName(cls);
  if (!className || !registrator.isRegisteredName(className)) return Entity;
  return getClassByClassName(className);
}

/**
 * Получение названия сущности по названию сущности или по зарегистрированному классу сущности.
 * Если сущность не зарегистрирована, возвращает null
 */
export function getClassNameByClassOrClassName(cls: (new () => Entity) | typeof Entity | string) {
  if (type(cls) !== 'string' && type(cls) !== 'function') return null;
  if (type(cls) === 'string') return cls as string;
  return getClassNameByClass(cls as (new () => Entity) & typeof Entity);
}

/**
 * Создает instance сущности по названию сущности.
 * Если класс сущности не найден, создает instance на основе базового класса сущности
 */
export function createEntity(className: string, attributes?: methods.IAttributes): Entity;
export function createEntity(className: string, attributes?: methods.IAttributes[]): Entity[];
export function createEntity(className: string, attributes?: methods.IAttributes | methods.IAttributes[]) {
  const cls = getClassByClassName(className);
  const arrayAttributes = Array.isArray(attributes) ? attributes : [attributes];
  const entities = LINQ.from(arrayAttributes).select((m) => {
    const entity = new cls();
    if (cls.fields) {
      for (const key of cls.fields) {
        entity.set(key, void 0);
      }
    }
    if (m) {
      const entries = Object.entries(m);
      for (const [key, value] of entries) {
        entity.set(key, value);
      }
    }
    return entity;
  });
  return Array.isArray(attributes) ? (entities as Entity[]) : entities.first();
}
