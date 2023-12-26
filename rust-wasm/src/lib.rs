mod utils;

use jomini::json::DuplicateKeyMode::Preserve;
use jomini::json::JsonOptions;
use jomini::TextTape;
use wasm_bindgen::prelude::*;

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