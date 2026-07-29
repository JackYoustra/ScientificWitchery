/* tslint:disable */
/* eslint-disable */
/**
* @param {string} s
* @param {DuplicateKeys | undefined} [duplicate_keys]
* @param {boolean | undefined} [prettyprint]
* @param {TypeNarrowing | undefined} [type_narrowing]
* @returns {string}
*/
export function parse_jomini(s: string, duplicate_keys?: DuplicateKeys, prettyprint?: boolean, type_narrowing?: TypeNarrowing): string;
/**
* @param {ArrayBuffer} s
* @returns {WasmBinaryResult}
*/
export function parse_wasm_binary(s: ArrayBuffer): WasmBinaryResult;
/**
*/
export enum DuplicateKeys {
  Group = 0,
  Preserve = 1,
  KeyValuePairs = 2,
}
/**
*/
export enum TypeNarrowing {
  All = 0,
  Unquoted = 1,
  None = 2,
}
/**
*/
export class WasmBinaryResult {
  free(): void;
/**
*/
  dominators: string;
/**
*/
  garbage: string;
}
