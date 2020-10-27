import { ISerberPlugin } from '@berish/serber';

export const SYMBOL_SERBER_UNDEFINED_DB_LITERAL = Symbol('undefinedDbLiteral');

export interface IUndefinedDBPluginParams {
  [SYMBOL_SERBER_UNDEFINED_DB_LITERAL]?: () => any;
}

export const undefinedDBPlugin: ISerberPlugin<any, any, IUndefinedDBPluginParams> = {
  isForSerialize: (obj: any) => {
    return typeof obj === 'undefined';
  },

  isForDeserialize: (obj: any, options) => {
    if (options[SYMBOL_SERBER_UNDEFINED_DB_LITERAL] && options[SYMBOL_SERBER_UNDEFINED_DB_LITERAL]() === obj)
      return true;
    return typeof obj === 'undefined';
  },

  serialize: (obj: any, options) => {
    if (options[SYMBOL_SERBER_UNDEFINED_DB_LITERAL]) return options[SYMBOL_SERBER_UNDEFINED_DB_LITERAL]();
    return undefined;
  },

  deserialize: obj => {
    return undefined;
  },
};
