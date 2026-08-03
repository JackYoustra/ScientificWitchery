/* @ts-self-types="./rust_wasm.d.ts" */
import * as wasm from "./rust_wasm_bg.wasm";
import { __wbg_set_wasm } from "./rust_wasm_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    DuplicateKeys, TypeNarrowing, WasmBinaryResult, parse_jomini, parse_wasm_binary
} from "./rust_wasm_bg.js";
