import { SYMBOL_ATTRIBUTES } from '../const';
import { generateId } from '../utils';
import { Manager } from '../manager';
import { serberFullRaw } from '../serber/instances';

export class FileEntity {
  private [SYMBOL_ATTRIBUTES]: { [key: string]: any } = null;
  private _cacheData: Buffer = null;

  public static fromJSON(json: { [key: string]: any }) {
    return serberFullRaw.deserialize(json);
  }

  constructor() {
    this.setId(generateId());
  }

  public get id() {
    return this.get('id');
  }

  public get name() {
    return this.get('name');
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

  public setName(name: string) {
    this.set('name', name);
  }

  public setId(id: string) {
    this.set('id', id);
  }

  get attributes() {
    if (!this[SYMBOL_ATTRIBUTES]) this[SYMBOL_ATTRIBUTES] = {};
    return this[SYMBOL_ATTRIBUTES];
  }

  private get(key: string) {
    return this.attributes[key];
  }

  private set(key: string, value: any) {
    this.attributes[key] = value;
  }

  toJSON() {
    return serberFullRaw.serialize(this);
  }
}
