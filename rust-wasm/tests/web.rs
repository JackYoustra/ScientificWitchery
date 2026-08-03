//! Test suite for the Web and headless browsers.
//!
//! Run with: `wasm-pack test --headless --firefox` (or --chrome) from `rust-wasm/`.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;

use rust_wasm::parse_wasm_binary;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// A committed fixture rather than the crate's own `pkg/rust_wasm_bg.wasm`.
///
/// Two reasons. It was self-referential — the test could only run after
/// `bun run wasm` had produced the artifact it read. And that artifact happens
/// to be one of the inputs twiggy cannot parse: it panics in its own
/// `ir.rs` with "should not parse the same key into multiple items", so the
/// test failed on an unlucky fixture rather than on anything this crate does.
///
/// `fixtures/sample.wasm` is 574 bytes built from `fixtures/sample.rs` — a few
/// exported functions, some calling each other, and one path nothing reaches,
/// so both analyses have real structure to report. Rebuild instructions are in
/// the header of that source file.
const SAMPLE: &[u8] = include_bytes!("fixtures/sample.wasm");

#[wasm_bindgen_test]
fn parses_a_real_module() {
    let bytes = js_sys::Uint8Array::new_with_length(SAMPLE.len() as u32);
    bytes.copy_from(SAMPLE);

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

    // The fixture exports these by name, so a successful parse should mention
    // them — this is what distinguishes "produced JSON" from "produced the
    // right JSON".
    for symbol in ["digits", "sum_to", "poly"] {
        assert!(
            result.dominators.contains(symbol),
            "dominators never mentioned `{symbol}`: {}",
            result.dominators
        );
    }
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
