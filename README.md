# pe-explorer-web

Drag a Windows `.exe` or `.dll` onto a web page and see its headers, sections, imports, and exports. Everything runs in-browser via a Rust/WASM port of [pe-info](https://github.com/AuDowty/pe-info). Nothing is uploaded.

**Live:** https://audowty.github.io/pe-explorer-web/

## Build locally

```
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --target web --out-dir web/pkg --release
python -m http.server -d web 8080
```

GitHub Actions builds and publishes to Pages on every push to `main`.

## License

MIT
