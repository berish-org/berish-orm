import { Serber, plugins } from '@berish/serber';
import { getSingleton } from 'berish-ringle';

import { entityToBaseDBItemPlugin } from './plugins/entityToBaseDBItemPlugin';
import { entityToEntityPointerPlugin } from './plugins/entityToEntityPointerPlugin';
import { entityToFullEntityPlugin } from './plugins/entityToFullEntityPlugin';
import { fileEntityToFullFileEntityPlugin } from './plugins/fileEntitiyToFullFileEntityPlugin';
import { fileEntityToBaseFileItemPlugin } from './plugins/fileEntityToBaseFileItemPlugin';
import { fileEntityToFileEntityPointerPlugin } from './plugins/fileEntityToFileEntityPointerPlugin';
import { queryToFullQueryPlugin } from './plugins/queryToFullQueryPlugin';

class SerberInstances {
  private _serberEntitiesToPointer = null;
  private _serberEntityToDB = null;
  private _serberFileEntityToDB = null;
  private _serberFullRaw = null;

  get serberEntitiesToPointer(): ReturnType<this['createSerberEntitiesToPointer']> {
    if (!this._serberEntitiesToPointer) this._serberEntitiesToPointer = this.createSerberEntitiesToPointer();
    return this._serberEntitiesToPointer;
  }

  get serberEntityToDB(): ReturnType<this['createSerberEntityToDB']> {
    if (!this._serberEntityToDB) this._serberEntityToDB = this.createSerberEntityToDB();
    return this._serberEntityToDB;
  }
  get serberFileEntityToDB(): ReturnType<this['createSerberFileEntityToDB']> {
    if (!this._serberFileEntityToDB) this._serberFileEntityToDB = this.createSerberFileEntityToDB();
    return this._serberFileEntityToDB;
  }
  get serberFullRaw(): ReturnType<this['createSerberFullRaw']> {
    if (!this._serberFullRaw) this._serberFullRaw = this.createSerberFullRaw();
    return this._serberFullRaw;
  }

  public createSerberEntitiesToPointer() {
    return new Serber()
      .addPlugin(plugins.undefinedPlugin)
      .addPlugin(plugins.nullPlugin)
      .addPlugin(plugins.boolPlugin)
      .addPlugin(plugins.numberPlugin)
      .addPlugin(plugins.stringPlugin)
      .addPlugin(plugins.datePlugin)
      .addPlugin(plugins.regExpPlugin)
      .addPlugin(plugins.arrayPlugin)
      .addPlugin(entityToEntityPointerPlugin)
      .addPlugin(fileEntityToFileEntityPointerPlugin)
      .addPlugin(plugins.loopObjectPlugin);
  }

  public createSerberEntityToDB() {
    return new Serber().addPlugin(plugins.arrayPlugin).addPlugin(entityToBaseDBItemPlugin);
  }

  public createSerberFileEntityToDB() {
    return new Serber().addPlugin(plugins.arrayPlugin).addPlugin(fileEntityToBaseFileItemPlugin);
  }

  public createSerberFullRaw() {
    return new Serber()
      .addPlugin(plugins.undefinedPlugin)
      .addPlugin(plugins.nullPlugin)
      .addPlugin(plugins.boolPlugin)
      .addPlugin(plugins.numberPlugin)
      .addPlugin(plugins.stringPlugin)
      .addPlugin(plugins.datePlugin)
      .addPlugin(plugins.regExpPlugin)
      .addPlugin(plugins.arrayPlugin)
      .addPlugin(entityToFullEntityPlugin)
      .addPlugin(fileEntityToFullFileEntityPlugin)
      .addPlugin(queryToFullQueryPlugin)
      .addPlugin(plugins.loopObjectPlugin);
  }
}

export const serberInstances = getSingleton(SerberInstances);
