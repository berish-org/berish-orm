import { Serber, plugins } from '@berish/serber';
import { entityToFullEntityPlugin } from './entityToFullEntityPlugin';
import { fileEntityToFullFileEntityPlugin } from './fileEntitiyToFullFileEntityPlugin';
import { fileEntityToBaseFileItemPlugin } from './fileEntityToBaseFileItemPlugin';
import { entityToEntityPointerPlugin } from './entityToEntityPointerPlugin';
import { fileEntityToFileEntityPointerPlugin } from './fileEntityToFileEntityPointerPlugin';
import { entityToBaseDBItemPlugin } from './entityToBaseDBItemPlugin';
import { undefinedDBPlugin } from './undefinedDBPlugin';

export const serberFullRaw = new Serber()
  .addPlugin(undefinedDBPlugin)
  .addPlugin(plugins.nullPlugin)
  .addPlugin(plugins.boolPlugin)
  .addPlugin(plugins.numberPlugin)
  .addPlugin(plugins.stringPlugin)
  .addPlugin(plugins.datePlugin)
  .addPlugin(plugins.regExpPlugin)
  .addPlugin(plugins.arrayPlugin)
  .addPlugin(entityToFullEntityPlugin)
  .addPlugin(fileEntityToFullFileEntityPlugin)
  .addPlugin(plugins.loopObjectPlugin);

export const serberFileEntityToDB = new Serber()
  .addPlugin(plugins.arrayPlugin)
  .addPlugin(fileEntityToBaseFileItemPlugin);

export const serberEntityToDB = new Serber().addPlugin(plugins.arrayPlugin).addPlugin(entityToBaseDBItemPlugin);

export const serberEntitiesToPointer = new Serber()
  .addPlugin(undefinedDBPlugin)
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
