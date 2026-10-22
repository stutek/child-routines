// Routine sheet maker: a parent types steps and times, the page picks images by keyword and
// draws the same A4 sheet as tools/build.py. sheetHtml() mirrors sheet_html() in tools/build.py;
// change both together. Data (CSS, skies, keywords, edge colors) comes from data.js, built by it.
"use strict";

const D = window.SHEET_DATA;
const EDGES = window.SHEET_EDGES;
const MAX_STEPS = 8;     // layout limit; 6 to 7 look best (AGENTS.md)
const MAX_SHEETS = 4;
const STORE = "child-routines-maker";
const CONTRIBUTE = "https://github.com/stutek/child-routines/blob/main/CONTRIBUTING.md#add-an-image";

// Step colors per sheet, taken from the example routine and extended to eight steps
const PALETTES = [
  ["#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F97316", "#EAB308", "#0EA5E9", "#14B8A6"],
  ["#F59E0B", "#F97316", "#F43F5E", "#EC4899", "#D946EF", "#C026D3", "#9333EA", "#7C3AED"],
  ["#A855F7", "#8B5CF6", "#7C3AED", "#6366F1", "#3B82F6", "#4F46E5", "#312E81", "#1E3A8A"],
];

const T = {
  sl: {
    heading: "Izdelaj svoj list", intro: "Vpiši korake in uro. Sličico poiščem sam; kjer je nimamo, te opozorim. Tvoji vnosi ostanejo v tvojem brskalniku.",
    title: "Naslov", lang: "Jezik", example: "Začni iz primera", clear: "Počisti", print: "🖨️ Natisni",
    sheet: "List", sheetTitle: "Naslov lista", sky: "Nebo", skies: { dawn: "jutro", afternoon: "popoldne", night: "noč" },
    label: "Opravilo, npr. UMIJ ZOBE", time: "Ura", addStep: "+ Korak", addSheet: "+ List", removeSheet: "Odstrani list",
    auto: "Samodejno", none: "Brez sličice (prazno polje)", matched: (t, k) => `Sličica: ${t} (prepoznano po »${k}«)`,
    noMatch: "Za to opravilo nimamo sličice: izberi drugo ali pusti prazno polje.",
    limit: n => `Največ ${MAX_STEPS} korakov na list (najlepše 6 do 7). Za več dodaj nov list.`,
    warnNoMatch: (s, l) => `${s}: za »${l}« nimamo sličice.`, warnLong: (s, l) => `${s}: napis »${l}« je predolg za okvir; skrajšaj ga.`,
    warnEmpty: s => `${s}: korak brez napisa.`, warnTooMany: (s, n) => `${s} ima ${n} korakov, največ ${MAX_STEPS}: razdeli ga na dva lista.`, ok: "Vse sličice so najdene in vsi napisi se prilegajo.",
    suggest: "Manjka sličica? Predlagaj jo", warnTitle: "Opozorila",
  },
  en: {
    heading: "Make your own sheet", intro: "Type the steps and times. I pick the pictures; where we have none, I tell you. What you type stays in your browser.",
    title: "Title", lang: "Language", example: "Start from the example", clear: "Clear", print: "🖨️ Print",
    sheet: "Sheet", sheetTitle: "Sheet title", sky: "Sky", skies: { dawn: "morning", afternoon: "afternoon", night: "night" },
    label: "Step, e.g. BRUSH TEETH", time: "Time", addStep: "+ Step", addSheet: "+ Sheet", removeSheet: "Remove sheet",
    auto: "Automatic", none: "No picture (empty box)", matched: (t, k) => `Picture: ${t} (matched by "${k}")`,
    noMatch: "We have no picture for this step: pick another or leave the box empty.",
    limit: n => `At most ${MAX_STEPS} steps per sheet (6 to 7 look best). Add a sheet for more.`,
    warnNoMatch: (s, l) => `${s}: no picture for "${l}".`, warnLong: (s, l) => `${s}: "${l}" is too long for the frame; shorten it.`,
    warnEmpty: s => `${s}: step without a label.`, warnTooMany: (s, n) => `${s} has ${n} steps, at most ${MAX_STEPS}: split it into two sheets.`, ok: "All pictures found and all labels fit.",
    suggest: "Missing a picture? Suggest one", warnTitle: "Warnings",
  },
};

// ---------- matching: label -> image id by keywords (images/<id>.json "keywords") ----------

function norm(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// "zob*" matches the start of a word (zobki, umij zobe); "wc" or "go to bed" must match whole words.
// The longest matching keyword wins, so "v posteljo" (sleep) beats "postelj*" (make the bed).
function match(label) {
  const text = ` ${norm(label)} `;
  let best = null;
  for (const [id, img] of Object.entries(D.images)) {
    for (const words of Object.values(img.keywords || {})) {
      for (const k of words) {
        const prefix = k.endsWith("*");
        const key = norm(prefix ? k.slice(0, -1) : k);
        if (!key) continue;
        const hit = prefix ? new RegExp(`(^| )${key}`).test(text.trim()) : text.includes(` ${key} `);
        if (hit && (!best || key.length > best.key.length)) best = { id, key: k };
      }
    }
  }
  return best;
}

// ---------- colors: same rules as tools/build.py ----------

function rgb(x) { return [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); }
function luminance(c) {
  const k = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = c.map(k);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function hex(c) { return "#" + c.map(v => v.toString(16).padStart(2, "0").toUpperCase()).join(""); }
function labelColor(step, background, minimum = 4.5) {
  const dark = rgb("#1E1B4B"), bg = rgb(background);
  for (const share of [0.55, 0.45, 0.35, 0.25, 0.15, 0.0]) {
    const c = rgb(step).map((s, i) => Math.round(share * s + (1 - share) * dark[i]));
    const [a, b] = [luminance(c), luminance(bg)].sort((x, y) => y - x);
    if ((a + 0.05) / (b + 0.05) >= minimum) return hex(c);
  }
  return "#1E1B4B";
}

// ---------- sheet markup: mirror of sheet_html() in tools/build.py ----------

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

function stars() {
  let s = 7;
  const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  let out = "";
  for (let i = 0; i < 46; i++) {
    out += `<circle cx="${(3 + rnd() * 204).toFixed(1)}" cy="${(110 + rnd() * 185).toFixed(1)}" r="${pick([0.35, 0.5, 0.7, 0.9])}" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  return out;
}

function sheetHtml(sheet) {
  const n = sheet.steps.length;
  const rows = sheet.steps.map((step, k) => {
    const i = k + 1, side = i % 2 ? "left" : "right";
    const bg = step.image && EDGES[step.image] ? EDGES[step.image][side === "left" ? 0 : 1] : D.missingBg;
    const style = `--step: ${step.color}; --bg: ${bg}; --ink: ${labelColor(step.color, bg)};`;
    const picture = step.image ? `<img src="../images/${esc(step.image)}.jpg" alt="${esc(step.label)}" />` : '<div class="rt-missing">?</div>';
    const clock = step.time ? `<div class="rt-time">${esc(step.time)}</div>`
      : '<div class="rt-time"><span class="blank"></span>:<span class="blank"></span></div>';
    return `
      <div class="rt-pic pic-${side}" style="${style} grid-row: ${2 * i} / span 4;">
        ${picture}
        <div class="rt-num">${i}</div>
      </div>
      <div class="rt-card card-${side}" style="${style} grid-row: ${2 * i + 1} / span 2;">
        <div class="rt-text">
          <div class="rt-label">${esc(step.label)}</div>
          ${clock}
        </div>
        <div class="rt-check"></div>
      </div>`;
  }).join("");
  const sky = D.skies[sheet.sky] || D.skies.dawn;   // only known skies reach the style attribute
  const starry = sheet.sky === "night"
    ? `<svg class="rt-sky" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true"><g fill="#FFF8DC">${stars()}</g></svg>` : "";
  const gridRows = `14mm minmax(0, 0.45fr) repeat(${2 * n}, minmax(0, 1fr)) minmax(0, 0.45fr)`;
  return `
  <div class="page-a4 rt-page" style="background: linear-gradient(180deg, ${sky});">${starry}
    <div class="rt-grid" style="grid-template-rows: ${gridRows};">
      <div class="rt-header"><div class="rt-title">${esc(sheet.title)}</div></div>${rows}
    </div>
  </div>`;
}

// ---------- state ----------

function fromExample(lang) {
  const ex = D.examples["sl-vsakdan"];
  return {
    lang, title: ex.title,
    sheets: ex.sheets.map(s => ({ title: s.title, sky: s.sky, steps: s.steps.map(st => ({ label: st.label, time: "", image: "auto" })) })),
  };
}
// Stored state is untrusted: every page on stutek.github.io shares this origin and its storage.
// Keep only known values, so nothing from storage reaches the markup unchecked.
function clean(s) {
  const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max);
  const step = st => ({
    label: str(st && st.label, 40),
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(st && st.time) ? st.time : "",
    image: st && (st.image === "none" || D.images[st.image]) ? st.image : "auto",
  });
  const sheet = sh => ({
    title: str(sh && sh.title, 60),
    sky: sh && D.skies[sh.sky] ? sh.sky : "dawn",
    steps: (Array.isArray(sh && sh.steps) ? sh.steps : []).slice(0, 2 * MAX_STEPS).map(step),
  });
  const sheets = (Array.isArray(s && s.sheets) ? s.sheets : []).slice(0, MAX_SHEETS).map(sheet).filter(sh => sh.steps.length);
  return sheets.length ? { lang: T[s.lang] ? s.lang : "sl", title: str(s.title, 60), sheets } : null;
}
function load() {
  try { const s = clean(JSON.parse(localStorage.getItem(STORE))); if (s) return s; } catch (e) { /* no or bad storage */ }
  return fromExample((navigator.language || "sl").startsWith("sl") ? "sl" : "en");
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* no storage */ } }

let state = load();
const t = () => T[state.lang] || T.sl;

// resolved step for drawing: uppercase label, chosen or matched image, palette color
function resolve(step, sheetIndex, k) {
  const m = match(step.label);
  const image = step.image === "auto" ? (m ? m.id : null) : step.image === "none" ? null : step.image;
  return { label: step.label.toLocaleUpperCase(state.lang), time: step.time, image, match: m,
           color: PALETTES[sheetIndex % PALETTES.length][k % MAX_STEPS] };
}

// ---------- editor ----------

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined) e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) e.append(c);
  return e;
}

function renderEditor() {
  const L = t(), root = document.getElementById("maker");
  document.documentElement.lang = state.lang;
  root.replaceChildren();
  root.append(el("h1", {}, `🧲 ${L.heading}`), el("p", {}, L.intro));

  const lang = el("select", { "aria-label": L.lang, onchange: e => { state.lang = e.target.value; update(true); } },
    ["sl", "en"].map(v => { const o = el("option", { value: v }, v === "sl" ? "Slovenščina" : "English"); o.selected = v === state.lang; return o; }));
  const title = el("input", { class: "grow", value: state.title, "aria-label": L.title, placeholder: L.title,
    oninput: e => { state.title = e.target.value; update(); } });
  root.append(el("div", { class: "row-top" }, [title, lang,
    el("button", { onclick: () => { state = fromExample(state.lang); update(true); } }, L.example),
    el("button", { onclick: () => { state = { lang: state.lang, title: state.title, sheets: [{ title: "☀️", sky: "dawn", steps: [{ label: "", time: "", image: "auto" }] }] }; update(true); } }, L.clear),
    el("button", { class: "primary", onclick: () => window.print() }, L.print)]));

  state.sheets.forEach((sheet, si) => {
    const box = el("div", { class: "sheet-box" });
    const sky = el("select", { "aria-label": L.sky, onchange: e => { sheet.sky = e.target.value; update(); } },
      Object.keys(D.skies).map(v => { const o = el("option", { value: v }, L.skies[v] || v); o.selected = v === sheet.sky; return o; }));
    box.append(el("div", { class: "sheet-head" }, [
      el("strong", {}, `${L.sheet} ${si + 1}`),
      el("input", { class: "title", value: sheet.title, "aria-label": L.sheetTitle, oninput: e => { sheet.title = e.target.value; update(); } }),
      sky,
      el("button", { disabled: state.sheets.length === 1 ? "" : null, onclick: () => { state.sheets.splice(si, 1); update(true); } }, L.removeSheet)]));

    sheet.steps.forEach((step, k) => {
      const hint = el("div", { class: "hint" });
      const pick = el("select", { "aria-label": "image", onchange: e => { step.image = e.target.value; update(); } });
      const label = el("input", { value: step.label, placeholder: L.label, maxlength: "24", "aria-label": L.label,
        oninput: e => { step.label = e.target.value; update(); } });
      const time = el("input", { type: "time", value: step.time, "aria-label": L.time, oninput: e => { step.time = e.target.value; update(); } });
      const del = el("button", { class: "del", title: "×", onclick: () => { sheet.steps.splice(k, 1); if (!sheet.steps.length) state.sheets.splice(si, 1); update(true); } }, "×");
      box.append(el("div", { class: "step" }, [el("span", { class: "n" }, `${k + 1}`), label, time, pick, del]), hint);
      step._ui = { pick, hint };
    });

    const full = sheet.steps.length >= MAX_STEPS;
    box.append(el("div", { class: "row-top" }, [
      el("button", { disabled: full ? "" : null, onclick: () => { sheet.steps.push({ label: "", time: "", image: "auto" }); update(true); } }, L.addStep),
      full ? el("span", { class: "hint warn" }, L.limit()) : ""]));
    root.append(box);
  });

  root.append(el("div", { class: "row-top" }, [
    el("button", { disabled: state.sheets.length >= MAX_SHEETS ? "" : null,
      onclick: () => { state.sheets.push({ title: "🌙", sky: "night", steps: [{ label: "", time: "", image: "auto" }] }); update(true); } }, L.addSheet)]));
  root.append(el("div", { id: "warnings" }));
}

// refresh image pickers and hints in place, so typing keeps focus
function refreshSteps() {
  const L = t();
  state.sheets.forEach((sheet, si) => sheet.steps.forEach((step, k) => {
    if (!step._ui) return;
    const r = resolve(step, si, k), { pick, hint } = step._ui;
    const options = [[`auto`, `${L.auto}${r.match ? ": " + D.images[r.match.id].title : ""}`]]
      .concat(Object.entries(D.images).map(([id, img]) => [id, img.title]), [["none", L.none]]);
    pick.replaceChildren(...options.map(([v, text]) => { const o = el("option", { value: v }, text); o.selected = v === step.image; return o; }));
    const missing = step.label.trim() && step.image === "auto" && !r.match;
    hint.className = missing ? "hint warn" : "hint";
    hint.replaceChildren(missing ? L.noMatch : r.match && step.image === "auto" ? L.matched(D.images[r.match.id].title, r.match.key) : "");
  }));
}

// ---------- preview and warnings ----------

// .rt-text grows with its label, so its own width says nothing; the room is frame minus circle
function labelRoom(lab) {
  const card = lab.closest(".rt-card"), cs = getComputedStyle(card);
  return card.clientWidth - card.querySelector(".rt-check").offsetWidth
    - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.columnGap || 0);
}

function renderPreview() {
  const L = t();
  const sheets = state.sheets.map((s, si) => ({ title: s.title, sky: s.sky, steps: s.steps.map((st, k) => resolve(st, si, k)) }));
  document.getElementById("preview").innerHTML = sheets.map(sheetHtml).join("");

  const warnings = [];
  state.sheets.forEach((s, si) => { if (s.steps.length > MAX_STEPS) warnings.push(L.warnTooMany(`${L.sheet} ${si + 1}`, s.steps.length)); });
  state.sheets.forEach((s, si) => s.steps.forEach((st, k) => {
    const where = `${L.sheet} ${si + 1}, ${k + 1}`;
    if (!st.label.trim()) warnings.push(L.warnEmpty(where));
    else if (st.image === "auto" && !match(st.label)) warnings.push(L.warnNoMatch(where, st.label));
  }));
  // labels do not wrap: compare each with the frame width left beside the magnet circle (AGENTS.md)
  document.querySelectorAll("#preview .rt-page").forEach((page, si) => {
    page.querySelectorAll(".rt-label").forEach((lab, k) => {
      if (lab.scrollWidth > labelRoom(lab)) warnings.push(L.warnLong(`${L.sheet} ${si + 1}, ${k + 1}`, lab.textContent));
    });
  });
  const box = document.getElementById("warnings");
  box.className = warnings.length ? "warnings" : "warnings ok";
  box.replaceChildren(...(warnings.length
    ? [el("strong", {}, L.warnTitle), el("ul", {}, warnings.map(w => el("li", {}, w))),
       el("a", { href: CONTRIBUTE, target: "_blank", rel: "noopener" }, L.suggest)]
    : [L.ok]));
}

function update(structure = false) {
  if (structure) renderEditor();
  refreshSteps();
  renderPreview();
  save();
}

document.head.append(el("style", {}, D.css));
document.fonts && document.fonts.ready.then(() => renderPreview());   // re-measure labels once the font is in
update(true);
