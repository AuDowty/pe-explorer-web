use wasm_bindgen::prelude::*;

mod flags;
mod pe;

#[wasm_bindgen]
pub fn parse_pe(bytes: &[u8]) -> Result<String, JsValue> {
    let img = pe::Image::parse(bytes).map_err(|e| JsValue::from_str(&e))?;
    let oh = &img.optional_header;
    let fh = &img.file_header;
    let v = serde_json::json!({
        "file_size": img.file_size,
        "bits": if img.is_64 { 64 } else { 32 },
        "machine": flags::machine_name(fh.machine),
        "subsystem": flags::subsystem_name(oh.subsystem),
        "image_base": format!("0x{:x}", oh.image_base),
        "entry_point": format!("0x{:x}", oh.address_of_entry_point),
        "size_of_image": oh.size_of_image,
        "size_of_headers": oh.size_of_headers,
        "number_of_sections": fh.number_of_sections,
        "characteristics": flags::characteristics(fh.characteristics),
        "dll_characteristics": flags::dll_characteristics(oh.dll_characteristics),
        "sections": img.sections.iter().map(|s| serde_json::json!({
            "name": s.name,
            "virtual_address": format!("0x{:08x}", s.virtual_address),
            "virtual_size": s.virtual_size,
            "raw_address": format!("0x{:08x}", s.raw_address),
            "raw_size": s.raw_size,
            "characteristics": flags::section_characteristics(s.characteristics),
        })).collect::<Vec<_>>(),
        "imports": img.imports().unwrap_or_default().iter().map(|i| serde_json::json!({
            "dll": i.dll,
            "functions": i.functions.iter().map(|f| match f {
                pe::ImportFn::Named(n) => serde_json::Value::String(n.clone()),
                pe::ImportFn::Ordinal(o) => serde_json::json!({ "ordinal": o }),
            }).collect::<Vec<_>>(),
        })).collect::<Vec<_>>(),
        "exports": img.exports().unwrap_or_default().iter().map(|e| serde_json::json!({
            "ordinal": e.ordinal,
            "rva": format!("0x{:08x}", e.rva),
            "name": e.name,
        })).collect::<Vec<_>>(),
    });
    Ok(v.to_string())
}
