import { Serber, plugins } from '@berish/serber';

import { entityToEntityPointerPlugin } from '../plugins/entityToEntityPointerPlugin';
import { fileEntityToFileEntityPointerPlugin } from '../plugins/fileEntityToFileEntityPointerPlugin';
import { undefinedDBPlugin } from '../plugins/undefinedDBPlugin';

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
