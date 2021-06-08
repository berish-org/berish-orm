import { Entity, FileEntity } from '../entity';
import { getClassNameByClassOrClassName } from '../registrator';
import { convertDBItemsToEntities, Manager } from '../manager';
import { Edge } from '../edge';
import { serberInstances } from '../serber';
import { getHash } from '../utils';
import { QueryBuilder } from './builder';

export interface QueryDataSchema {
  where?: { [key: string]: any };
  subQueries?: { [key: string]: { query: QueryData; key: string } };
  ids?: string[];
  contains?: { [key: string]: any[] };
  limit?: number;
  skip?: number;
  className?: string;
  less?: { [key: string]: any };
  lessOrEqual?: { [key: string]: any };
  greater?: { [key: string]: any };
  greaterOrEqual?: { [key: string]: any };
  pluck?: string[];
}

export type QueryData<TSchema extends { [key: string]: any } = QueryDataSchema> = {
  key: keyof TSchema;
  value: any;
}[];

const DONT_USE_CLASSNAME = 'DONT_USE_CLASSNAME';

export class Query<T extends Entity> {
  private _builder: QueryBuilder<QueryDataSchema> = new QueryBuilder();
  private _className: string = null;

  public static clone<TQuery extends Query<any>>(query: TQuery): TQuery {
    const newQuery = new Query(query.className) as TQuery;
    newQuery._builder = QueryBuilder.from(query._builder);
    return newQuery;
  }

  public static fromJSON<T extends Entity = Entity>(queryData: QueryData<QueryDataSchema>) {
    const query = new Query<T>(DONT_USE_CLASSNAME);
    query._builder = QueryBuilder.fromJSON(queryData);
    return query;
  }

  public static getHash(queryData: QueryData<QueryDataSchema>) {
    return getHash(queryData);
  }

  public constructor(ctor: string | (new () => T)) {
    if (ctor !== DONT_USE_CLASSNAME) {
      const className = getClassNameByClassOrClassName(ctor);
      if (typeof className === 'undefined' || className === null || className === '')
        throw new Error('ORM: Query cant found className');

      this._builder.replace('className', className);
      this._className = className;
    }
  }

  public get json() {
    return this._builder.toJSON();
  }

  public get hash() {
    return Query.getHash(this.json);
  }

  public get className() {
    if (!this._className) this._className = this._builder.get('className')[0];
    return this._className;
  }

  public append<TKey extends keyof QueryDataSchema>(key: TKey, value: QueryDataSchema[TKey]) {
    const query: this = Query.clone(this);
    query._builder.append(key, value);
    return query;
  }

  public replace<TKey extends keyof QueryDataSchema>(key: TKey, value: QueryDataSchema[TKey]) {
    const query: this = Query.clone(this);
    query._builder.replace(key, value);
    return query;
  }

  public clear<TKey extends keyof QueryDataSchema>(key: TKey) {
    const query: this = Query.clone(this);
    query._builder.clear(key);
    return query;
  }

  public equalTo(key: string, value: any): this {
    if (value instanceof Entity || value instanceof FileEntity) {
      const pointer = serberInstances.serberEntitiesToPointer.serialize(value);
      return this.append('where', { [key]: pointer });
    } else if (value instanceof Query) {
      return this.matchesQuery(key, value);
    }

    return this.append('where', { [key]: value });
  }

  public contains(key: string, value: any[]) {
    const raw = serberInstances.serberEntitiesToPointer.serialize(value);
    return this.append('contains', { [key]: raw });
  }

  public limit(limit: number): this {
    return this.append('limit', limit);
  }

  public skip(skip: number): this {
    return this.append('skip', skip);
  }

  public matchesQuery(key: string, query: Query<any>): this {
    return this.matchesKeyInQuery(key, null, query);
  }

  public matchesKeyInQuery(key: string, keyInQuery: string, subQuery: Query<any>): this {
    return this.append('subQueries', { [key]: { query: subQuery._builder.toJSON(), key: keyInQuery } });
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

  public ids(ids: string[]): this {
    if (ids.length <= 0 || ids.every((m) => typeof m === 'string' && !!m) === false)
      // TODO Исправить передачу ошибок
      throw new Error(`FP-ORM: Query.ids arguments has no String values or is empty. Classname: ${this.className}`);

    return this.replace('ids', ids || []);
  }

  public less(key: string, value: any): this {
    return this.append('less', { [key]: value });
  }

  public lessOrEqual(key: string, value: any): this {
    return this.append('lessOrEqual', { [key]: value });
  }

  public greater(key: string, value: any): this {
    return this.append('greater', { [key]: value });
  }

  public greaterOrEqual(key: string, value: any): this {
    return this.append('greaterOrEqual', { [key]: value });
  }

  public pluck(...keys: string[]) {
    return this.append('pluck', keys);
  }

  // METHODS

  public async count(manager: Manager) {
    const count = await manager.db.count(this.json);
    return count;
  }

  public async get(id: string, manager: Manager, deep?: number): Promise<T> {
    const idsQuery = this.ids([id]);

    const baseItem = await manager.db.get(idsQuery.json);
    const entities = await convertDBItemsToEntities(manager, this.className, [baseItem], deep);
    return entities[0] as T;
  }

  public async find(manager: Manager, deep?: number): Promise<T[]> {
    const baseItems = await manager.db.find(this.json);
    const response = await convertDBItemsToEntities(manager, this.className, baseItems, deep);
    return response as T[];
  }

  public async first(manager: Manager, deep?: number): Promise<T> {
    const items = await this.limit(1).find(manager, deep);

    return items && items[0];
  }

  public async delete(manager: Manager) {
    return manager.db.delete(this.json);
  }

  public subscribe(manager: Manager, cb: (oldValues: T, newValues: T, newValueIndex?: number) => any, deep?: number) {
    return manager.db.subscribe(this.json, async (oldValue, newValue, newValueIndex) => {
      if (cb) {
        const rawArray = [oldValue, newValue];
        const [oldValueDes, newValueDes] = await convertDBItemsToEntities<T>(
          manager,
          this.className,
          rawArray,
          deep,
          rawArray.map((m) => m && m.id).filter(Boolean),
        );
        cb(oldValueDes, newValueDes, newValueIndex);
      }
    });
  }
}
