import { Serber, plugins } from '@berish/serber';

import { entityToFullEntityPlugin } from '../plugins/entityToFullEntityPlugin';
import { fileEntityToFullFileEntityPlugin } from '../plugins/fileEntitiyToFullFileEntityPlugin';
import { undefinedDBPlugin } from '../plugins/undefinedDBPlugin';

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
