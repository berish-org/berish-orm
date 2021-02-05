import type { Manager } from '../manager';
import * as Decorators from './decorators';
import { generateId } from '../utils/generateId';
import * as methods from './methods';

export class Entity {
  public static Register = Decorators.Register;
  public static Field = Decorators.Field;
  public static Edge = Decorators.Edge;

  public static className: string = null;
  public static fields: string[] = null;

  public static fromJSON<TEntity extends Entity>(this: TEntity, json: { [key: string]: any }) {
    return methods.fromJSON<TEntity>(json);
  }

  public constructor() {
    this.attributes.id = generateId();
  }

  public get attributes() {
    return methods.getAttributes(this);
  }

  public get systemAttributes() {
    return methods.getSystemAttributes(this);
  }

  public get(key: string) {
    return this.attributes[key];
  }

  public set(key: string, value: any) {
    if (typeof value === 'undefined') return this.unset(key);
    this.attributes[key] = value;
  }

  public unset(key: string) {
    this.attributes[key] = null;
  }

  public getSystem(key: string) {
    return this.systemAttributes[key];
  }

  public setSystem(key: string, value: any) {
    this.systemAttributes[key] = value;
  }

  public get className() {
    return methods.getClassName(this);
  }

  public get id() {
    return methods.getId(this);
  }

  public get isFetched() {
    return methods.getIsFetched(this);
  }

  public get createdAt() {
    return methods.getCreatedAt(this);
  }

  public get updatedAt() {
    return methods.getUpdatedAt(this);
  }

  public getEdge<Dst extends Entity = Entity>(edgeName: string, dstClassName: string | (new () => Dst)) {
    return methods.getEdge<Dst>(this, edgeName, dstClassName);
  }

  public getEdgeDst<Src extends Entity = Entity>(edgeName: string, srcClassName: string | (new () => Src)) {
    return methods.getEdgeDst<Src>(this, edgeName, srcClassName);
  }

  public getEdgeSingle<Dst extends Entity = Entity>(edgeName: string, srcClassName: string | (new () => Dst)) {
    return methods.getEdgeSingle<Dst>(this, edgeName, srcClassName);
  }

  public getEdgeDstSingle<Src extends Entity = Entity>(edgeName: string, srcClassName: string | (new () => Src)) {
    return methods.getEdgeDstSingle<Src>(this, edgeName, srcClassName);
  }

  public getPlain(plainName: string) {
    return methods.getPlain(this, plainName);
  }

  public toJSON() {
    return methods.toJSON(this);
  }

  public toQuery() {
    return methods.toQuery(this);
  }

  public async fetch(manager: Manager, deep?: number) {
    await methods.fetch(this, manager, deep);
    return this;
  }

  public subscribe(manager: Manager, callback: (oldValue: this, newValue: this) => any, deep?: number) {
    return methods.subscribe(this, manager, callback, deep);
  }
}
