#!/bin/bash

echo "Installing Rustup..."
# Install Rustup (compiler)
# curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain nightly --target wasm32-unknown-unknown -y
$(curl -sSf https://sh.rustup.rs | sh -s -- --default-toolchain nightly --target wasm32-unknown-unknown -y) || true
# Adding binaries to path
source "$HOME/.cargo/env"
echo "Installing wasm-pack..."
# Install wasm-pack (wasm compiler)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y
# Actually build the thing in a sibling directory named "rust-wasm" in a subshell
# so we don't pollute the current directory
(
  cd rust-wasm
  echo "Building Rust..."
  wasm-pack build -- --target-dir ../.next/cache/vercel/rust-wasm
)
yarn add ./rust-wasm/pkg --update-checksums
