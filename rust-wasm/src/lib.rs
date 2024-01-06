mod utils;

use crate::utils::set_panic_hook;
use jomini::json::DuplicateKeyMode::Preserve;
use jomini::json::TypeNarrowing::All;
use jomini::json::{DuplicateKeyMode, JsonOptions};
use jomini::TextTape;
use js_sys::ArrayBuffer;
use log::info;
use twiggy_analyze::garbage;
use twiggy_opt::CommonCliOptions;
use twiggy_parser;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
// #[cfg(feature = "wee_alloc")]
// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

fn initialize() {
    set_panic_hook();
    let _ = console_log::init();
}

#[wasm_bindgen]
pub enum DuplicateKeys {
    Group,
    Preserve,
    KeyValuePairs,
}

impl From<DuplicateKeys> for DuplicateKeyMode {
    fn from(dk: DuplicateKeys) -> Self {
        match dk {
            DuplicateKeys::Group => DuplicateKeyMode::Group,
            DuplicateKeys::Preserve => DuplicateKeyMode::Preserve,
            DuplicateKeys::KeyValuePairs => DuplicateKeyMode::KeyValuePairs,
        }
    }
}

#[wasm_bindgen]
pub enum TypeNarrowing {
    All,
    Unquoted,
    None,
}

impl From<TypeNarrowing> for jomini::json::TypeNarrowing {
    fn from(tn: TypeNarrowing) -> Self {
        match tn {
            TypeNarrowing::All => jomini::json::TypeNarrowing::All,
            TypeNarrowing::Unquoted => jomini::json::TypeNarrowing::Unquoted,
            TypeNarrowing::None => jomini::json::TypeNarrowing::None,
        }
    }
}

#[wasm_bindgen]
pub fn parse_jomini(
    s: &str,
    duplicate_keys: Option<DuplicateKeys>,
    prettyprint: Option<bool>,
    type_narrowing: Option<TypeNarrowing>,
) -> Result<String, JsError> {
    initialize();
    // to json
    let tape = TextTape::from_slice(s.as_bytes())?;
    let json = tape.utf8_reader().json().with_options(
        JsonOptions::default()
            .with_prettyprint(prettyprint.unwrap_or(true))
            .with_duplicate_keys(duplicate_keys.map(|dk| dk.into()).unwrap_or(Preserve))
            .with_type_narrowing(type_narrowing.map(|tn| tn.into()).unwrap_or(All)),
    );
    Ok(json.to_string())
}

#[wasm_bindgen(getter_with_clone)]
pub struct WasmBinaryResult {
    pub dominators: String,
    pub garbage: String,
}

#[wasm_bindgen]
pub fn parse_wasm_binary(s: &ArrayBuffer) -> Result<WasmBinaryResult, JsError> {
    let s = js_sys::Uint8Array::new(s).to_vec();
    initialize();
    let mut items =
        twiggy_parser::parse(&s).map_err(|e| JsError::new(&format!("Error parsing: {}", e)))?;
    // let options = twiggy_opt::Top::default();
    // let top = twiggy_analyze::top(&mut items, &options).map_err(|e| JsError::new(&format!("Error analyzing: {}", e)))?;
    let options = twiggy_opt::Dominators::default();
    let dominators = twiggy_analyze::dominators(&mut items, &options)
        .map_err(|e| JsError::new(&format!("Error in dominator analysis: {}", e)))?;
    let mut json = Vec::new();
    dominators.emit_json(&items, &mut json)
        .map_err(|e| JsError::new(&format!("Error emitting dominators: {}", e)))?;
    let mut options = twiggy_opt::Garbage::default();
    options.set_max_items(u32::MAX);
    options.set_show_data_segments(true);
    let garbage = garbage(&mut items, &options)
        .map_err(|e| JsError::new(&format!("Error in garbage analysis: {}", e)))?;
    let mut json2 = Vec::new();
    garbage.emit_json(&items, &mut json2)
        .map_err(|e| JsError::new(&format!("Error emitting garbage: {}", e)))?;
    let dominatorString = String::from_utf8(json).map_err(|e| JsError::new(&format!("Error converting dominators to string: {}", e)))?;
    let garbageString = String::from_utf8(json2).map_err(|e| JsError::new(&format!("Error converting garbage to string: {}", e)))?;
    Ok(WasmBinaryResult {
        dominators: dominatorString,
        garbage: garbageString,
    })
}
