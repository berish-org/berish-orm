import { IQueryData } from './query';

export interface IBaseDBItem {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export const baseDBMethods: string[] = ['get', 'create', 'update', 'delete', 'index', 'find', 'subscribe'];

export abstract class BaseDBAdapter<IInitializeParams> {
  params: IInitializeParams;
  deepFetch?: boolean;
  public abstract initialize(params: IInitializeParams): Promise<void>;
  public abstract create(table: string, items: IBaseDBItem[]): Promise<void>;
  public abstract update(table: string, items: IBaseDBItem[]): Promise<void>;
  public abstract index(table: string, indexName: string, keys?: string[]): void;
  public abstract get(data: IQueryData): Promise<IBaseDBItem>;
  public abstract delete(data: IQueryData): Promise<void>;
  public abstract find(data: IQueryData): Promise<IBaseDBItem[]>;
  public abstract subscribe(
    data: IQueryData,
    callback: (oldValue: IBaseDBItem, newValue: IBaseDBItem) => any,
  ): () => any;
  public abstract emptyFieldLiteral?(): any;
}
