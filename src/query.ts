import * as crypto from 'crypto-js';
import { Entity, FileEntity } from './entity';
import { getClassNameByClassOrClassName } from './registrator';
import { Manager } from './manager';
import { Edge } from './edge';
import { serberEntitiesToPointer } from './serber/instances';

export interface IQueryData {
  where?: { [key: string]: any };
  subQueries?: { [key: string]: { query: IQueryData; key: string } };
  ids?: string[];
  contains?: { [key: string]: any[] };
  limit?: number;
  skip?: number;
  className?: string;
  withACL?: any;
  less?: { [key: string]: any };
  lessOrEqual?: { [key: string]: any };
  greater?: { [key: string]: any };
  greaterOrEqual?: { [key: string]: any };
}

export class Query<T extends Entity> {
  constructor(ctor: string | (new () => T)) {
    const className = getClassNameByClassOrClassName(ctor);
    if (className === null) throw new Error('ORM: Query cant found className');
    if (className !== '') this._data = Query.append(this, 'className', className).json;
  }

  public static createByQuery<T extends Entity>(query: Query<T>) {
    return this.and<T>(query);
  }

  public static and<T extends Entity>(...queries: Query<T>[]) {
    if (queries.length <= 0) throw new Error('Query.and needs one or more queries in params');
    if (queries.some(m => m.className !== queries[0].className))
      throw new Error('Query.and needs every className equals');
    let main = new Query<T>(queries[0].className);
    for (const query of queries) {
      const entries = Object.entries(query._data);
      for (const [filterName, filterValue] of entries) {
        main = Query.append(main, filterName as any, filterValue);
      }
    }
    return main;
  }

  public static append<TQuery extends Query<any>, T extends keyof IQueryData>(
    data: TQuery,
    filterName: T,
    value: IQueryData[T]
  ): TQuery {
    if (!data) return null;
    const oldJSON = data.json;
    const oldValue = oldJSON[filterName];
    const newJSON: IQueryData = Object.assign({}, oldJSON || {});
    if (value && Array.isArray(value)) {
      newJSON[filterName] = (Array.isArray(oldValue)
        ? [...(oldValue as any), ...(value as any)]
        : [...(value as any)]) as any;
    } else if (value && typeof value === 'object') {
      newJSON[filterName] = oldValue ? Object.assign({}, oldValue, value) : Object.assign({}, value);
    } else {
      newJSON[filterName] = value;
    }
    return Query.fromJSON(newJSON) as TQuery;
  }

  public static clear<TQuery extends Query<any>, T extends keyof IQueryData>(data: TQuery, filterName: T): TQuery {
    if (!data) return null;
    const newJSON: IQueryData = Object.assign({}, data.json || {});
    if (newJSON[filterName]) delete newJSON[filterName];
    return Query.fromJSON(newJSON) as TQuery;
  }

  public static fromJSON<T extends Entity = Entity>(queryData: IQueryData) {
    const query = new Query<T>('');
    query._data = Object.assign({}, queryData);
    return query;
  }

  public static getHash(queryData: IQueryData) {
    const strJSON = JSON.stringify(queryData);
    const words = crypto.SHA256(strJSON, strJSON);
    return words.toString();
  }

  private _data: IQueryData = {};

  public get json() {
    return this._data || {};
  }

  public get hash() {
    return Query.getHash(this.json);
  }

  public get className() {
    return this._data.className;
  }

  public _concat(...datas: IQueryData[]) {
    for (const data of datas) {
      const entries = Object.entries(data);
      for (const [filterName, value] of entries) {
        const oldValue = this._data[filterName];
      }
    }
  }

  public equalTo(key: string, value: any): this {
    if (value instanceof Entity || value instanceof FileEntity) {
      const pointer = serberEntitiesToPointer.serialize(value);
      return Query.append(this, 'where', { [key]: pointer });
    } else if (value instanceof Query) {
      return this.matchesQuery(key, value);
    }
    return Query.append(this, 'where', { [key]: value });
  }

  public contains(key: string, value: any[]): this {
    const raw = serberEntitiesToPointer.serialize(value);
    return Query.append(this, 'contains', { [key]: raw });
  }

  public limit(limit: number): this {
    return Query.append(this, 'limit', limit);
  }

  public skip(skip: number): this {
    return Query.append(this, 'skip', skip);
  }

  public matchesQuery(key: string, query: Query<any>): this {
    return this.matchesKeyInQuery(key, null, query);
  }

  public matchesKeyInQuery(key: string, keyInQuery: string, query: Query<any>): this {
    return Query.append(this, 'subQueries', { [key]: { query: query.json, key: keyInQuery } });
  }

  public matchesEdgeQuery(edgeName: string, query: Query<any>): this {
    const fullEdgeName = Edge.generateFullEdgeName(this.className, edgeName, query.className);
    const edgeQuery = Edge.generateQuery(fullEdgeName).matchesKeyInQuery('dst', 'id', query);
    return this.matchesKeyInQuery('id', 'src', edgeQuery);
  }

  public matchesEdgeDstQuery(edgeName: string, query: Query<any>): this {
    const fullEdgeName = Edge.generateFullEdgeName(this.className, edgeName, query.className);
    const edgeQuery = Edge.generateQuery(fullEdgeName).matchesKeyInQuery('src', 'id', query);
    return this.matchesKeyInQuery('id', 'dst', edgeQuery);
  }

  public withACL(acl: any): this {
    return Query.append(this, 'withACL', acl);
  }

  public ids(ids: string[]): this {
    if (ids.length <= 0 || ids.every(m => typeof m === 'string' && !!m) === false)
      throw new Error(`FP-ORM: Query.ids arguments has no String values or is empty. Classname: ${this.className}`);
    return Query.append(this, 'ids', ids || []);
  }

  public less(key: string, value: any): this {
    return Query.append(this, 'less', { [key]: value });
  }

  public lessOrEqual(key: string, value: any): this {
    return Query.append(this, 'lessOrEqual', { [key]: value });
  }

  public greater(key: string, value: any): this {
    return Query.append(this, 'greater', { [key]: value });
  }

  public greaterOrEqual(key: string, value: any): this {
    return Query.append(this, 'greaterOrEqual', { [key]: value });
  }

  public async get(id: string, manager: Manager, deep?: number): Promise<T> {
    const self = Query.clear(this, 'ids').ids([id]);
    const baseItem = await manager.db.get(self.json);
    const entities = await manager.convertDBItemsToEntities(this.className, [baseItem], deep);
    return entities[0] as T;
  }

  public async find(manager: Manager, deep?: number): Promise<T[]> {
    const baseItems = await manager.db.find(this.json);
    const response = await manager.convertDBItemsToEntities(this.className, baseItems, deep);
    return response as T[];
  }

  public async delete(manager: Manager) {
    return manager.db.delete(this.json);
  }

  public subscribe(manager: Manager, cb: (oldValues: T, newValues: T) => any, deep?: number) {
    return manager.db.subscribe(this.json, async (oldValue, newValue) => {
      if (cb) {
        const rawArray = [oldValue, newValue];
        const [oldValueDes, newValueDes] = await manager.convertDBItemsToEntities(
          this.className,
          rawArray,
          deep,
          rawArray.map(m => m && m.id).filter(Boolean)
        );
        cb(oldValueDes, newValueDes);
      }
    });
  }
}
