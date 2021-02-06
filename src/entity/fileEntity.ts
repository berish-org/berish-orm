import { generateId } from '../utils';
import { Manager } from '../manager';
import * as methods from './methods';

export class FileEntity {
  private _cacheData: Buffer = null;

  public static fromJSON(json: { [key: string]: any }) {
    return methods.fromJSON<FileEntity>(json);
  }

  constructor() {
    this.attributes.id = generateId();
  }

  public get attributes() {
    return methods.getAttributes(this);
  }

  public get(key: string) {
    return this.attributes[key];
  }

  public set(key: string, value: any) {
    this.attributes[key] = value;
  }

  public get id() {
    return methods.getId(this);
  }

  public get name() {
    return methods.getFileName(this);
  }

  public get createdAt() {
    return methods.getCreatedAt(this);
  }

  public setName(name: string) {
    methods.setFileName(this, name);
  }

  public get cacheData(): Buffer {
    return this._cacheData;
  }

  public async getData(manager: Manager) {
    if (this.cacheData) return this.cacheData;
    await manager.getFile(this, true);
    return this.cacheData;
  }

  public setData(data: Buffer) {
    this._cacheData = data;
  }

  public toJSON() {
    return methods.toJSON(this);
  }
}
