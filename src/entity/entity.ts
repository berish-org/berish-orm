import { SYMBOL_ATTRIBUTES, SYMBOL_SYSTEM_ATTRIBUTES } from '../const';
import * as Decorators from './decorators';
import { Edge } from '../edge';
import { Manager } from '../manager';
import { Plain } from '../plain';
import { generateId } from '../utils/generateId';
import { serberFullRaw } from '../serber/instances';
import { Query } from '../query';

export interface IAttributes {
  id: string;
  [key: string]: any;
}

export interface ISystemAttributes {
  [key: string]: any;
}

export class Entity {
  public static Register = Decorators.Register;
  public static Field = Decorators.Field;
  public static Edge = Decorators.Edge;
  public static className: string = null;
  public static fields: string[] = null;

  public static _setIsFetched(entity: Entity, isFetched: boolean) {
    if (entity) entity.setSystem('isFetched', !!isFetched);
  }

  public static fromJSON(json: { [key: string]: any }) {
    return serberFullRaw.deserialize(json);
  }

  constructor() {
    this.set('id', generateId());
  }

  get attributes(): IAttributes {
    this[SYMBOL_ATTRIBUTES] = this[SYMBOL_ATTRIBUTES] || {};
    return this[SYMBOL_ATTRIBUTES];
  }

  get(key: string) {
    return this.attributes[key];
  }

  set(key: string, value: any) {
    if (typeof value === 'undefined') return this.unset(key);
    this.attributes[key] = value;
  }

  unset(key: string) {
    this.attributes[key] = undefined;
    // delete this.attributes[key];
    // if (!this.getSystem('unset')) this.setSystem('unset', []);
    // const arr: string[] = this.getSystem('unset');
    // arr.push(key);
  }

  private get systemAttributes(): ISystemAttributes {
    this[SYMBOL_SYSTEM_ATTRIBUTES] = this[SYMBOL_SYSTEM_ATTRIBUTES] || {};
    return this[SYMBOL_SYSTEM_ATTRIBUTES];
  }

  getSystem(key: string) {
    return this.systemAttributes[key];
  }

  setSystem(key: string, value: any) {
    this.systemAttributes[key] = value;
  }

  public get className(): string {
    return (this.constructor && (this.constructor['className'] as string)) || this.get('className');
  }

  public get id() {
    return this.get('id') as string;
  }

  public get isFetched() {
    return !!this.getSystem('isFetched');
  }

  getEdge<Dst extends Entity = Entity>(edgeName: string, dstClassName: string | (new () => Dst)) {
    const systemName = `edge_src_${edgeName}`;
    if (!this.getSystem(systemName))
      this.setSystem(
        systemName,
        Edge.create(this.className, edgeName, dstClassName, () => this.id)
      );
    return this.getSystem(systemName) as Edge<this, Dst>;
  }

  getEdgeDst<Src extends Entity = Entity>(edgeName: string, srcClassName: string | (new () => Src)) {
    const systemName = `edge_dst_${edgeName}`;
    if (!this.getSystem(systemName))
      this.setSystem(
        systemName,
        Edge.createFromDst(srcClassName, edgeName, this.className, () => this.id)
      );
    return this.getSystem(systemName) as Edge<this, Src>;
  }

  getEdgeDstSingle<Src extends Entity = Entity>(edgeName: string, srcClassName: string | (new () => Src)) {
    const edge = this.getEdgeDst(edgeName, srcClassName);
    return async (manager: Manager, deep?: number) => {
      const data = await edge.query.find(manager, deep);
      return data && data[0];
    };
  }

  getPlain(plainName: string) {
    const systemName = `plain_src_${plainName}`;
    if (!this.getSystem(systemName))
      this.setSystem(
        systemName,
        Plain.create(this.className, plainName, () => this.id)
      );
    return this.getSystem(systemName) as Plain<this>;
  }

  toJSON() {
    return serberFullRaw.serialize(this);
  }

  toQuery() {
    return new Query(this.className).ids([this.id]);
  }
}
