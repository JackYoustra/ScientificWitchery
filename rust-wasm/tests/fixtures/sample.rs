//! Test fixture for the wasm analyzer. Small but not trivial: several exported
//! functions, some calling each other, plus a path nothing reaches — so both
//! dominator and garbage analysis have real structure rather than one leaf.
//!
//! Rebuild with:
//!   rustc --crate-type=cdylib --target wasm32-unknown-unknown -O -o sample.wasm sample.rs
#![no_std]
#![no_main]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { loop {} }

#[no_mangle] pub extern "C" fn add(a: i32, b: i32) -> i32 { a.wrapping_add(b) }
#[no_mangle] pub extern "C" fn mul(a: i32, b: i32) -> i32 { a.wrapping_mul(b) }
#[no_mangle] pub extern "C" fn poly(a: i32, b: i32) -> i32 { add(mul(a, a), mul(b, b)) }

#[no_mangle] pub extern "C" fn sum_to(n: i32) -> i32 {
    let mut acc: i32 = 0;
    let mut i: i32 = 0;
    while i < n { acc = acc.wrapping_add(i); i += 1; }
    acc
}

#[no_mangle] pub extern "C" fn digits(mut n: u64, out: *mut u8) -> usize {
    let mut i = 0usize;
    unsafe { while n > 0 { *out.add(i) = (n % 10) as u8; n /= 10; i += 1; } }
    i
}

/// Reachable only from `dead_ref`, which nothing else calls.
fn never_called_helper(x: i32) -> i32 { x.wrapping_mul(3).wrapping_add(7) }
#[no_mangle] pub extern "C" fn dead_ref() -> i32 { never_called_helper(1) }
