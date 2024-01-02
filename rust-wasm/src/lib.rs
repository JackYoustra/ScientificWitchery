mod utils;

use jomini::json::DuplicateKeyMode::Preserve;
use jomini::json::JsonOptions;
use jomini::TextTape;
use twiggy_opt::CommonCliOptions;
use wasm_bindgen::prelude::*;
use twiggy_parser;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
// #[cfg(feature = "wee_alloc")]
// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn parse_jomini(s: &str) -> Result<String, JsError> {
    // to json
    let tape = TextTape::from_slice(s.as_bytes())?;
    let json = tape.utf8_reader()
        .json()
        .with_options(
            JsonOptions::default()
                .with_prettyprint(true)
                .with_duplicate_keys(Preserve)
        );
    Ok(json.to_string())
}

#[wasm_bindgen]
pub fn parse_wasm_binary(s: &[u8]) -> Result<String, JsError> {
    let mut items = twiggy_parser::parse(&s).map_err(|e| JsError::new(&format!("Error parsing: {}", e)))?;
    let options = twiggy_opt::Top::default();
    let top = twiggy_analyze::top(&mut items, &options).map_err(|e| JsError::new(&format!("Error analyzing: {}", e)))?;
    let mut json = Vec::new();
    top.emit_json(&items, &mut json).map_err(|e| JsError::new(&format!("Error emitting: {}", e)))?;
    Ok(String::from_utf8(json).unwrap())
}