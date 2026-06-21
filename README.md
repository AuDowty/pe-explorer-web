# pe-explorer-web

Drag a Windows `.exe` or `.dll` onto a web page → instant view of its headers, sections, imports, and exports. Parsing happens entirely in your browser via a Rust → WASM port of [`pe-info`](https://github.com/AuDowty/pe-info). Nothing is uploaded anywhere.

**Live demo:** https://audowty.github.io/pe-explorer-web/

## How it's built

- `src/lib.rs` exposes `parse_pe(bytes)` via `wasm-bindgen`
- `src/pe.rs` + `src/flags.rs` are a slim port of the `pe-info` parser
- `web/index.html` is a single-page UI; `wasm-pack build --target web` produces the JS glue in `web/pkg/`
- GitHub Actions workflow builds + publishes to GitHub Pages on every push to `main`

## Local build

```
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --target web --out-dir web/pkg --release
# serve any static server from ./web
python -m http.server -d web 8080
```

## License

MIT.
