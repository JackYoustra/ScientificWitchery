/* tslint:disable */
/* eslint-disable */

export enum DuplicateKeys {
    Group = 0,
    Preserve = 1,
    KeyValuePairs = 2,
}

export enum TypeNarrowing {
    All = 0,
    Unquoted = 1,
    None = 2,
}

export class WasmBinaryResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    dominators: string;
    garbage: string;
}

export function parse_jomini(s: string, duplicate_keys?: DuplicateKeys | null, prettyprint?: boolean | null, type_narrowing?: TypeNarrowing | null): string;

export function parse_wasm_binary(s: ArrayBuffer): WasmBinaryResult;
