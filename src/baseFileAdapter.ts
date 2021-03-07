export interface IBaseFileItem {
  id: string;
  createdAt: number;
  data: Buffer;
  name: string;
}

export const baseFileMethods: string[] = ['get', 'create', 'delete'];

export abstract class BaseFileAdapter<IInitializeParams> {
  params: IInitializeParams;
  public abstract initialize(params: IInitializeParams): Promise<void>;
  public abstract close(): Promise<void>;
  public abstract get(ids: string[], fetchData: boolean): Promise<IBaseFileItem[]>;
  public abstract create(items: IBaseFileItem[]): Promise<void>;
  public abstract delete(ids: string[]): Promise<void>;
}
