import * as crypto from 'crypto-js';

export function getHash(obj: { [key: string]: any }) {
  const strJSON = JSON.stringify(obj || {});
  const words = crypto.SHA256(strJSON);
  return words.toString();
}
