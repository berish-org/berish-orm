import { Serber, plugins } from '@berish/serber';

import { fileEntityToBaseFileItemPlugin } from '../plugins/fileEntityToBaseFileItemPlugin';

export const serberFileEntityToDB = new Serber()
  .addPlugin(plugins.arrayPlugin)
  .addPlugin(fileEntityToBaseFileItemPlugin);
