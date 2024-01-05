//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;

use rust_wasm::parse_wasm_binary;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}

#[wasm_bindgen_test]
fn parse_file() {
    // lol
    let data = include_bytes!("../pkg/rust_wasm_bg.wasm");
    let arrayBuffer = js_sys::Uint8Array::default();
    arrayBuffer.copy_from(data);
    let result = parse_wasm_binary(&arrayBuffer.buffer())
        .map_err(JsValue::from)
        .unwrap();
    // make sure result isn't empty
    assert!(result.len() > 0);
    assert_eq!(1 + 1, 2);
}
