import { QueryData, QueryDataSchema } from './query';

export interface IBaseDBItem {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export const baseDBMethods: string[] = ['count', 'get', 'create', 'update', 'delete', 'index', 'find', 'subscribe'];

export abstract class BaseDBAdapter<IInitializeParams> {
  params: IInitializeParams;
  public abstract initialize(params: IInitializeParams): Promise<void>;
  public abstract close(): Promise<void>;
  public abstract create(table: string, items: IBaseDBItem[]): Promise<void>;
  public abstract update(table: string, items: IBaseDBItem[]): Promise<void>;
  public abstract index(table: string, indexName: string, keys?: string[]): void;
  public abstract count(data: QueryData<QueryDataSchema>): Promise<number>;
  public abstract get(data: QueryData<QueryDataSchema>): Promise<IBaseDBItem>;
  public abstract delete(data: QueryData<QueryDataSchema>): Promise<void>;
  public abstract find(data: QueryData<QueryDataSchema>): Promise<IBaseDBItem[]>;
  public abstract subscribe(
    data: QueryData<QueryDataSchema>,
    callback: (oldValue: IBaseDBItem, newValue: IBaseDBItem) => any,
    onError: (reason: any) => any,
  ): (() => any) | Promise<() => any>;
}
