import { Entity } from '../entity';
import { getClassNameByClass } from '../registrator';
import { Queue } from '../utils';
import * as QueueActions from './queueActions';
import { Manager } from '../manager';
import { Query } from '../query';

export interface IEdgeQueueActionData {
  manager: Manager;
  edge: Edge<any, any>;
  srcAdded: string[];
  dstAdded: string[];
  srcRemoved: string[];
  dstRemoved: string[];
}

export interface IEdgeRaw {
  id?: string;
  src: string;
  dst: string;
}

export class Edge<Current extends Entity, Remote extends Entity> {
  static create<Src extends Entity, Dst extends Entity>(
    srcCtor: string | (new () => Src),
    edgeName: string,
    dstCtor: string | (new () => Dst),
    entityId: () => string,
  ) {
    const edge = new Edge<Src, Dst>(srcCtor, edgeName, dstCtor, 'src', entityId);
    return edge;
  }

  static createFromDst<Src extends Entity, Dst extends Entity>(
    srcCtor: string | (new () => Src),
    edgeName: string,
    dstCtor: string | (new () => Dst),
    entityId: () => string,
  ) {
    const edge = new Edge<Dst, Src>(srcCtor, edgeName, dstCtor, 'dst', entityId);
    return edge;
  }

  static generateQuery(fullEdgeName: string) {
    return new Query(fullEdgeName);
  }

  static generateFullEdgeName(classNameSrc: string, edgeName: string, classNameDst) {
    return `${classNameSrc}_${edgeName}_${classNameDst}`;
  }

  private _classNameSrc: string = null;
  private _classNameDst: string = null;
  private _edgeName: string = null;
  private _mode: 'src' | 'dst' = null;
  private _queue = new Queue<IEdgeQueueActionData>().action(QueueActions.saveAction).action(QueueActions.removeAction);
  private _entityId: () => string = null;

  private initQueueData() {
    this.queue.data({ edge: this });
  }

  constructor(
    srcCtor: string | (new () => Entity),
    edgeName: string,
    dstCtor: string | (new () => Entity),
    mode: 'src' | 'dst',
    entityId: () => string,
  ) {
    this._classNameSrc = typeof srcCtor === 'string' ? srcCtor : getClassNameByClass(srcCtor);
    this._classNameDst = typeof dstCtor === 'string' ? dstCtor : getClassNameByClass(dstCtor);
    this._edgeName = edgeName;
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

  get edgeName() {
    return this._edgeName;
  }

  get classNameSrc() {
    return this._classNameSrc;
  }

  get classNameDst() {
    return this._classNameDst;
  }

  get fullEdgeName() {
    return Edge.generateFullEdgeName(this.classNameSrc, this.edgeName, this.classNameDst);
  }

  get query() {
    const edgeQuery = Edge.generateQuery(this.fullEdgeName).equalTo(this._mode, this.entityId);
    const query = this._mode === 'src' ? new Query<Remote>(this.classNameDst) : new Query<Remote>(this.classNameSrc);
    return query.matchesKeyInQuery('id', this._mode === 'src' ? 'dst' : 'src', edgeQuery);
  }

  add(obj: Remote | Remote[] | string | string[]) {
    const items = Array.isArray(obj) ? obj : [obj];
    const ids = items.map((m) => (typeof m === 'string' ? m : m.id));
    if (this._mode === 'dst') this.queue.data((data) => ({ ...data, dstAdded: (data.dstAdded || []).concat(ids) }));
    else this.queue.data((data) => ({ ...data, srcAdded: (data.srcAdded || []).concat(ids) }));
    return this;
  }

  remove(obj: Remote | Remote[] | string | string[]) {
    const items = Array.isArray(obj) ? obj : [obj];
    const ids = items.map((m) => (typeof m === 'string' ? m : m.id));
    if (this._mode === 'dst') this.queue.data((data) => ({ ...data, dstRemoved: (data.dstRemoved || []).concat(ids) }));
    else this.queue.data((data) => ({ ...data, srcRemoved: (data.srcRemoved || []).concat(ids) }));
    return this;
  }

  execute(manager: Manager) {
    this.queue.data({ manager });
    return new Promise<void>(async (resolve, reject) => {
      await this.queue.execute((err) => reject(err));
      resolve();
    }).finally(() => this.initQueueData());
  }
}

/* 
    Создаем таблицу для каждого ребра вида srcEntityName_edgeName_dstEntityName.
    На выход пользователю отдаем API, где он может дополнить текущий "массив" хоть значением src, хоть dst.
    Ребро переименовать нельзя
    Так же на выходе отдается Query либо по src, либо по dst

*/
