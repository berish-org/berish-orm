import { Entity } from '../entity';
import { getClassNameByClass } from '../registrator';
import { Queue } from '../utils';
import * as QueueActions from './queueActions';
import { Manager } from '../manager';
import { Query } from '../query';
import LINQ from '@berish/linq';

export interface IPlainQueueActionData {
  manager: Manager;
  plain: Plain<any>;
  srcAdded: LINQ<string>;
  dstAdded: LINQ<string>;
  srcRemoved: LINQ<string>;
  dstRemoved: LINQ<string>;
}

export interface IPlainRaw {
  id: string;
  src: string;
  dst: string;
  parent: string;
  level: number;
}

export class Plain<Current extends Entity> {
  static create<Current extends Entity>(ctor: string | (new () => Current), plainName: string, entityId: () => string) {
    const plain = new Plain<Current>(ctor, plainName, 'src', entityId);
    return plain;
  }

  static createFromDst<Current extends Entity>(
    ctor: string | (new () => Current),
    plainName: string,
    entityId: () => string
  ) {
    const plain = new Plain<Current>(ctor, plainName, 'dst', entityId);
    return plain;
  }

  private _className: string = null;
  private _plainName: string = null;
  private _mode: 'src' | 'dst' = null;
  private _entityId: () => string = null;
  private _queue = new Queue<IPlainQueueActionData>().action(QueueActions.saveAction).action(QueueActions.removeAction);

  private initQueueData() {
    this.queue.data({ plain: this });
  }

  constructor(ctor: string | (new () => Entity), plainName: string, mode: 'src' | 'dst', entityId: () => string) {
    this._className = typeof ctor === 'string' ? ctor : getClassNameByClass(ctor);
    this._plainName = plainName;
    this._mode = mode;
    this._entityId = entityId;
    this.initQueueData();
  }

  get entityId() {
    return this._entityId && this._entityId();
  }

  get queue() {
    return this._queue;
  }

  get plainName() {
    return this._plainName;
  }

  get className() {
    return this._className;
  }

  get fullPlainName() {
    return `${this.className}_${this.plainName}`;
  }

  get queryChildsNearly() {
    const query = new Query<Current>(this.className);
    const plainQuery = new Query<Entity>(this.fullPlainName).equalTo(this._mode, this.entityId).equalTo('level', 0);
    return query.matchesKeyInQuery('id', this._mode === 'src' ? 'dst' : 'src', plainQuery);
  }

  get queryChilds() {
    const query = new Query<Current>(this.className);
    const plainQuery = new Query<Entity>(this.fullPlainName).equalTo(this._mode, this.entityId);
    return query.matchesKeyInQuery('id', this._mode === 'src' ? 'dst' : 'src', plainQuery);
  }

  get queryParentsNearly() {
    const query = new Query<Current>(this.className);
    const plainQuery = new Query<Entity>(this.fullPlainName)
      .equalTo(this._mode === 'src' ? 'dst' : 'src', this.entityId)
      .equalTo('level', 0);
    return query.matchesKeyInQuery('id', this._mode, plainQuery);
  }

  get queryParents() {
    const query = new Query<Current>(this.className);
    const plainQuery = new Query<Entity>(this.fullPlainName).equalTo(
      this._mode === 'src' ? 'dst' : 'src',
      this.entityId
    );
    return query.matchesKeyInQuery('id', this._mode, plainQuery);
  }

  add(obj: Current | Current[] | string | string[]) {
    const items = Array.isArray(obj) ? obj : [obj];
    const ids = items.map(m => (typeof m === 'string' ? m : m.id));
    if (this._mode === 'dst')
      this.queue.data(data => ({ ...data, dstAdded: LINQ.from(data.dstAdded || []).concat(ids) }));
    else this.queue.data(data => ({ ...data, srcAdded: LINQ.from(data.srcAdded || []).concat(ids) }));
    return this;
  }

  remove(obj: Current | Current[] | string | string[]) {
    const items = Array.isArray(obj) ? obj : [obj];
    const ids = items.map(m => (typeof m === 'string' ? m : m.id));
    if (this._mode === 'dst')
      this.queue.data(data => ({ ...data, dstRemoved: LINQ.from(data.dstRemoved || []).concat(ids) }));
    else this.queue.data(data => ({ ...data, srcRemoved: LINQ.from(data.srcRemoved || []).concat(ids) }));
    return this;
  }

  execute(manager: Manager) {
    this.queue.data({ manager });
    return new Promise<void>(async (resolve, reject) => {
      await this.queue.execute(err => reject(err));
      resolve();
    }).finally(() => this.initQueueData());
  }
}
