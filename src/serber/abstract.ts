export enum RawTypeEnum {
  entityPointer = 'ep',
  fileEntityPointer = 'fep',
  fullEntity = 'fe',
  fullFileEntity = 'ffe',
}

/**
 * Параметр, в котором указывваем менеджер для Serber
 */
export const SYMBOL_SERBER_MANAGER_INSTANCE = Symbol('serberManagerInstance');

export interface IRaw<T extends RawTypeEnum> {
  /** Тип внутренней сущности */
  __type__: T;
}

export interface IEntityRaw {
  id?: string;
  [key: string]: any;
}

export function isRaw(obj: any): obj is IRaw<any> {
  if (obj && typeof obj === 'object' && '__type__' in obj) return true;
  return false;
}
