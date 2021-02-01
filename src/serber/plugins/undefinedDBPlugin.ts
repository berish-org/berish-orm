import { ISerberPlugin } from '@berish/serber';

export const undefinedDBPlugin: ISerberPlugin<any, any> = {
  isForSerialize: (obj: any) => {
    return typeof obj === 'undefined';
  },

  isForDeserialize: (obj: any, options) => {
    return obj === null || typeof obj === 'undefined';
  },

  serialize: (obj: any, options) => {
    return null;
  },

  deserialize: (obj) => {
    return undefined;
  },
};
