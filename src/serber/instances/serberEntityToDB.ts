import { Serber, plugins } from '@berish/serber';

import { entityToBaseDBItemPlugin } from '../plugins/entityToBaseDBItemPlugin';

export const serberEntityToDB = new Serber().addPlugin(plugins.arrayPlugin).addPlugin(entityToBaseDBItemPlugin);
