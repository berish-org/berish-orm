import { QueryData, QueryDataSchema } from './query';

export class QueryBuilder<TQueryDataSchema extends { [key: string]: any }> {
  private _data: QueryData<TQueryDataSchema> = [];

  static from<TQueryDataSchema extends { [key: string]: any }>(queryBuilder: QueryBuilder<TQueryDataSchema>) {
    return queryBuilder && QueryBuilder.fromJSON<TQueryDataSchema>(queryBuilder._data);
  }

  static fromJSON<TQueryDataSchema extends { [key: string]: any }>(queryData: QueryData<TQueryDataSchema>) {
    const newBuilder = new QueryBuilder<TQueryDataSchema>();

    newBuilder._data = [...queryData];

    return newBuilder;
  }

  public append<TKey extends keyof TQueryDataSchema>(key: TKey, value: TQueryDataSchema[TKey]) {
    this._data.push({ key, value });
  }

  public replace<TKey extends keyof TQueryDataSchema>(key: TKey, value: TQueryDataSchema[TKey]) {
    this.clear(key);
    this._data.push({ key, value });
  }

  public clear<TKey extends keyof TQueryDataSchema>(key: TKey) {
    this._data = this._data.filter((m) => m.key !== key);
  }

  public get<TKey extends keyof TQueryDataSchema>(key: TKey) {
    return this._data.filter((m) => m.key === key).map((m) => m.value);
  }

  public toJSON() {
    return this._data;
  }
}
