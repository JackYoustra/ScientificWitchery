//! Test suite for the Web and headless browsers.
//!
//! Run with: `wasm-pack test --headless --firefox` (or --chrome) from `rust-wasm/`.
//! Note `parse_file` feeds the crate's own compiled artifact (`pkg/rust_wasm_bg.wasm`)
//! back through the analyzer, so `bun run wasm` must have run at least once.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;

use rust_wasm::parse_wasm_binary;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn parse_file() {
    let data = include_bytes!("../pkg/rust_wasm_bg.wasm");
    let bytes = js_sys::Uint8Array::new_with_length(data.len() as u32);
    bytes.copy_from(data);

    let result = parse_wasm_binary(&bytes.buffer())
        .map_err(JsValue::from)
        .expect("parsing a known-good wasm binary should succeed");

    // Both analyses emit JSON documents; neither should come back empty...
    assert!(
        !result.dominators.is_empty(),
        "dominator analysis produced no output"
    );
    assert!(
        !result.garbage.is_empty(),
        "garbage analysis produced no output"
    );

    // ...and what they emit should actually be JSON, not a stray error string.
    assert!(
        result.dominators.trim_start().starts_with(['{', '[']),
        "dominators was not JSON: {}",
        result.dominators
    );
    assert!(
        result.garbage.trim_start().starts_with(['{', '[']),
        "garbage was not JSON: {}",
        result.garbage
    );
}

#[wasm_bindgen_test]
fn bad_input_is_an_error_not_a_panic() {
    let bytes = js_sys::Uint8Array::new_with_length(8);
    bytes.copy_from(&[0u8; 8]);
    assert!(
        parse_wasm_binary(&bytes.buffer()).is_err(),
        "eight zero bytes are not a wasm module"
    );
}
