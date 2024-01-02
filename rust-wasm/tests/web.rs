//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;

use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;
use rust_wasm::parse_wasm_binary;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}

#[wasm_bindgen_test]
fn parse_file() {
    // lol
    let data = include_bytes!("../pkg/rust_wasm_bg.wasm");
    let result = parse_wasm_binary(data)
        .map_err(JsValue::from)
        .unwrap();
    // pretty-print the result json
    let json = js_sys::JSON::parse(&result).unwrap();
    let pretty = js_sys::JSON::stringify_with_replacer_and_space(&json, &JsValue::null(), &JsValue::from(4i32)).unwrap();
    // console_log!("result: {}", pretty);
    console_log!("json: {}", result);
    assert_eq!(1 + 1, 2);
}
