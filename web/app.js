import init, { parse_pe } from "./pkg/pe_explorer_web.js?v=2";

const drop = document.getElementById("drop");
const file = document.getElementById("file");
const errorBox = document.getElementById("error");
const result = document.getElementById("result");
const filenameEl = document.getElementById("filename");
const quickStats = document.getElementById("quickstats");
const tabsNav = document.getElementById("tabs");

let ready = false;
console.log("[pe-explorer] loading wasm...");
await init();
ready = true;
console.log("[pe-explorer] wasm ready");

drop.addEventListener("click", () => file.click());
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]);
});
file.addEventListener("change", () => {
  if (file.files[0]) handle(file.files[0]);
});

async function handle(f) {
  if (!ready) return;
  errorBox.hidden = true;
  result.hidden = true;
  try {
    const buf = await f.arrayBuffer();
    console.log(`[pe-explorer] parsing ${f.name} (${buf.byteLength} bytes)`);
    const raw = parse_pe(new Uint8Array(buf));
    console.log(`[pe-explorer] parse_pe -> ${typeof raw}, length ${String(raw).length}`);
    if (typeof raw !== "string") {
      throw new Error(`expected string from parse_pe, got ${typeof raw} — clear browser cache (Ctrl+Shift+R)`);
    }
    const parsed = JSON.parse(raw);
    console.log("[pe-explorer] parsed:", parsed);
    if (typeof parsed.file_size !== "number") {
      throw new Error(`parsed.file_size is ${typeof parsed.file_size}, expected number — see console`);
    }
    render(f, parsed);
  } catch (e) {
    console.error("[pe-explorer] error:", e);
    errorBox.textContent = String(e?.message ?? e);
    errorBox.hidden = false;
  }
}

function render(f, p) {
  filenameEl.textContent = f.name;
  quickStats.innerHTML = "";
  const stat = (k, v) => `<span><strong>${v}</strong> ${k}</span>`;
  quickStats.innerHTML = [
    stat("bits", p.bits),
    stat("machine", p.machine),
    stat("subsystem", p.subsystem),
    stat("sections", p.number_of_sections),
    stat("size", formatBytes(p.file_size)),
  ].join("");

  document.getElementById("tab-headers").innerHTML = renderHeaders(p);
  document.getElementById("tab-sections").innerHTML = renderSections(p.sections);
  document.getElementById("tab-imports").innerHTML = renderImports(p.imports);
  document.getElementById("tab-exports").innerHTML = renderExports(p.exports);

  result.hidden = false;
  document.querySelector(".tabs button.active")?.classList.remove("active");
  document.querySelector('.tabs button[data-tab="headers"]').classList.add("active");
  document.querySelectorAll(".tab-pane").forEach((el) => el.classList.remove("active"));
  document.getElementById("tab-headers").classList.add("active");
}

tabsNav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  tabsNav.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".tab-pane").forEach((el) => {
    el.classList.toggle("active", el.id === `tab-${btn.dataset.tab}`);
  });
});

function renderHeaders(p) {
  const row = (k, v) => `<div class="k">${k}</div><div class="v">${v}</div>`;
  const flags = (a) => (a || []).map((f) => `<span class="flag">${f}</span>`).join("");
  return `<div class="kv">
    ${row("file size", `${formatBytes(p.file_size)} (${(p.file_size ?? 0).toLocaleString()} bytes)`)}
    ${row("bits", p.bits ?? "?")}
    ${row("machine", p.machine ?? "?")}
    ${row("subsystem", p.subsystem ?? "?")}
    ${row("image base", p.image_base ?? "?")}
    ${row("entry point RVA", p.entry_point ?? "?")}
    ${row("size of image", "0x" + (p.size_of_image ?? 0).toString(16))}
    ${row("size of headers", "0x" + (p.size_of_headers ?? 0).toString(16))}
    ${row("sections", p.number_of_sections ?? 0)}
    ${row("characteristics", flags(p.characteristics) || `<span class="k">none</span>`)}
    ${row("dll characteristics", flags(p.dll_characteristics) || `<span class="k">none</span>`)}
  </div>`;
}

function renderSections(sections) {
  return `<table>
    <thead><tr><th>name</th><th>vaddr</th><th>vsize</th><th>raw addr</th><th>raw size</th><th>flags</th></tr></thead>
    <tbody>
      ${(sections || []).map((s) => `
        <tr>
          <td>${s.name}</td>
          <td>${s.virtual_address}</td>
          <td>${(s.virtual_size ?? 0).toLocaleString()}</td>
          <td>${s.raw_address}</td>
          <td>${(s.raw_size ?? 0).toLocaleString()}</td>
          <td>${(s.characteristics || []).map((c) => `<span class="flag">${c}</span>`).join("")}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>`;
}

function renderImports(imports) {
  if (!imports || imports.length === 0) {
    return `<p style="color:var(--text-dim)">no imports</p>`;
  }
  return imports.map((i) => `
    <div class="dll-group">
      <h3>${i.dll} <small>${i.functions.length} function${i.functions.length === 1 ? "" : "s"}</small></h3>
      <ul>${i.functions.map((f) => `<li>${typeof f === "string" ? f : "#" + f.ordinal}</li>`).join("")}</ul>
    </div>
  `).join("");
}

function renderExports(exports) {
  if (!exports || exports.length === 0) {
    return `<p style="color:var(--text-dim)">no exports</p>`;
  }
  return `<table>
    <thead><tr><th>ordinal</th><th>rva</th><th>name</th></tr></thead>
    <tbody>
      ${exports.map((e) => `
        <tr><td>${e.ordinal}</td><td>${e.rva}</td><td>${e.name || "<unnamed>"}</td></tr>
      `).join("")}
    </tbody>
  </table>`;
}

function formatBytes(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "?";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}
