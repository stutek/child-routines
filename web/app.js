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
    heading: "Izdelaj svoj list",
    how: ["Vpiši opravila in po želji uro. Prazna ura ostane za ročni vpis.", "Sličico izberem sam. Klikni nanjo, da jo zamenjaš.", "Natisni na A4: robovi »Brez«, merilo 100 %."],
    example: "Primer", clear: "Počisti", print: "🖨️ Natisni",
    sheet: "List", sheetTitle: "Naslov lista", skies: { dawn: "☀️ jutro", afternoon: "🌤️ popoldne", night: "🌙 noč" },
    times: "Ura na listu", background: "Ozadje", backgrounds: { gradient: "preliv barv", white: "belo", none: "prosojno (se ne natisne)" },
    label: "Opravilo, npr. UMIJ ZOBE", time: "Ura", addStep: "+ Korak", addSheet: "+ List", removeSheet: "Odstrani list",
    auto: "Samodejno", none: "Brez sličice", pick: "Zamenjaj sličico", removeStep: "Odstrani korak",
    limit: `Največ ${MAX_STEPS} korakov na list (najlepše 6 do 7). Za več dodaj nov list.`,
    warnNoMatch: (s, l) => `${s}: za »${l}« nimamo sličice. Izberi drugo ali pusti prazno.`,
    warnLong: (s, l) => `${s}: napis »${l}« je predolg za okvir; skrajšaj ga.`,
    warnEmpty: s => `${s}: korak brez napisa.`,
    warnTooMany: (s, n) => `${s} ima ${n} korakov, največ ${MAX_STEPS}: razdeli ga na dva lista.`,
    ok: "✓ Vse sličice so najdene in vsi napisi se prilegajo.", suggest: "Manjka sličica? Predlagaj jo", warnTitle: "Opozorila",
  },
  en: {
    heading: "Make your own sheet",
    how: ["Type the steps and, if you like, a time. An empty time stays blank to write by hand.", "I pick the pictures. Click one to change it.", "Print on A4: margins None, scale 100 %."],
    example: "Example", clear: "Clear", print: "🖨️ Print",
    sheet: "Sheet", sheetTitle: "Sheet title", skies: { dawn: "☀️ morning", afternoon: "🌤️ afternoon", night: "🌙 night" },
    times: "Time on the sheet", background: "Background", backgrounds: { gradient: "color gradient", white: "white", none: "transparent (not printed)" },
    label: "Step, e.g. BRUSH TEETH", time: "Time", addStep: "+ Step", addSheet: "+ Sheet", removeSheet: "Remove sheet",
    auto: "Automatic", none: "No picture", pick: "Change picture", removeStep: "Remove step",
    limit: `At most ${MAX_STEPS} steps per sheet (6 to 7 look best). Add a sheet for more.`,
    warnNoMatch: (s, l) => `${s}: no picture for "${l}". Pick another or leave it empty.`,
    warnLong: (s, l) => `${s}: "${l}" is too long for the frame; shorten it.`,
    warnEmpty: s => `${s}: step without a label.`,
    warnTooMany: (s, n) => `${s} has ${n} steps, at most ${MAX_STEPS}: split it into two sheets.`,
    ok: "✓ All pictures found and all labels fit.", suggest: "Missing a picture? Suggest one", warnTitle: "Warnings",
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
    const clock = sheet.times === false ? "" : step.time ? `<div class="rt-time">${esc(step.time)}</div>`
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
  const plain = D.plain[sheet.sky];   // only known skies and plain backgrounds reach the style attribute
  const background = plain || `linear-gradient(180deg, ${D.skies[sheet.sky] || D.skies.dawn})`;
  const starry = sheet.sky === "night"
    ? `<svg class="rt-sky" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true"><g fill="#FFF8DC">${stars()}</g></svg>` : "";
  const gridRows = `14mm minmax(0, 0.45fr) repeat(${2 * n}, minmax(0, 1fr)) minmax(0, 0.45fr)`;
  return `
  <div class="page-a4 rt-page" style="background: ${background};">${starry}
    <div class="rt-grid" style="grid-template-rows: ${gridRows};">
      <div class="rt-header"><div class="rt-title">${esc(sheet.title)}</div></div>${rows}
    </div>
  </div>`;
}

// ---------- state ----------

function fromExample(lang) {
  const ex = D.examples["sl-vsakdan"];
  return {
    lang, title: ex.title, background: "gradient", times: true,
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
  const background = ["gradient", "white", "none"].includes(s.background) ? s.background : "gradient";
  return sheets.length ? { lang: T[s.lang] ? s.lang : "sl", title: str(s.title, 60), background, times: s.times !== false, sheets } : null;
}
function load() {
  try { const s = clean(JSON.parse(localStorage.getItem(STORE))); if (s) return s; } catch (e) { /* no or bad storage */ }
  return fromExample((navigator.language || "sl").startsWith("sl") ? "sl" : "en");
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state, (k, v) => (k.startsWith("_") ? undefined : v))); } catch (e) { /* no storage */ }
}

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
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) e.append(c);
  return e;
}
function select(label, value, options, onchange) {
  return el("select", { "aria-label": label, title: label, onchange: e => onchange(e.target.value) },
    Object.entries(options).map(([v, text]) => { const o = el("option", { value: v }, text); o.selected = v === value; return o; }));
}
const newStep = () => ({ label: "", time: "", image: "auto" });

function renderEditor() {
  const L = t(), root = document.getElementById("maker");
  document.documentElement.lang = state.lang;
  root.classList.toggle("no-times", !state.times);
  const times = el("input", { type: "checkbox", onchange: e => { state.times = e.target.checked; update(true); } });
  times.checked = state.times;
  root.replaceChildren(
    el("div", { class: "row-top" }, [
      el("h1", { class: "grow" }, `🧲 ${L.heading}`),
      select("Language", state.lang, { sl: "SL", en: "EN" }, v => { state.lang = v; update(true); })]),
    el("ol", { class: "how" }, L.how.map(s => el("li", {}, s))),
    el("div", { class: "row-top" }, [
      el("label", { class: "grow" }, [`${L.background}: `,
        select(L.background, state.background, L.backgrounds, v => { state.background = v; update(true); })]),
      el("label", {}, [times, ` ${L.times}`]),
      el("button", { onclick: () => { state = fromExample(state.lang); update(true); } }, L.example),
      el("button", { onclick: () => { state = { ...state, sheets: [{ title: "☀️", sky: "dawn", steps: [newStep()] }] }; update(true); } }, L.clear),
      el("button", { class: "primary", onclick: () => window.print() }, L.print)]));

  state.sheets.forEach((sheet, si) => {
    const box = el("div", { class: "sheet-box" }, el("div", { class: "sheet-head" }, [
      el("input", { class: "title", value: sheet.title, "aria-label": L.sheetTitle, placeholder: L.sheetTitle,
        oninput: e => { sheet.title = e.target.value; update(); } }),
      state.background === "gradient" ? select(L.sheet, sheet.sky, L.skies, v => { sheet.sky = v; update(); }) : "",
      el("button", { class: "del", title: L.removeSheet, "aria-label": L.removeSheet, disabled: state.sheets.length === 1,
        onclick: () => { state.sheets.splice(si, 1); update(true); } }, "×")]));

    sheet.steps.forEach((step, k) => {
      const gallery = el("div", { class: "gallery", hidden: true });
      const thumb = el("button", { class: "thumb", title: L.pick, "aria-label": L.pick,
        onclick: () => { gallery.hidden = !gallery.hidden; } });
      const choose = v => { step.image = v; gallery.hidden = true; update(); };
      gallery.append(
        el("button", { onclick: () => choose("auto") }, `🔄 ${L.auto}`),
        ...Object.entries(D.images).map(([id, img]) =>
          el("button", { title: img.title, onclick: () => choose(id) }, el("img", { src: `../images/${id}.jpg`, alt: img.title, loading: "lazy" }))),
        el("button", { onclick: () => choose("none") }, `∅ ${L.none}`));
      box.append(el("div", { class: "step" }, [
        el("span", { class: "n" }, `${k + 1}`),
        el("input", { value: step.label, placeholder: L.label, maxlength: "24", "aria-label": L.label,
          oninput: e => { step.label = e.target.value; update(); } }),
        el("input", { type: "time", value: step.time, "aria-label": L.time, oninput: e => { step.time = e.target.value; update(); } }),
        thumb,
        el("button", { class: "del", title: L.removeStep, "aria-label": L.removeStep,
          onclick: () => { sheet.steps.splice(k, 1); if (!sheet.steps.length) state.sheets.splice(si, 1); update(true); } }, "×")]), gallery);
      step._thumb = thumb;
    });

    const full = sheet.steps.length >= MAX_STEPS;
    box.append(el("div", { class: "row-top" }, [
      el("button", { disabled: full, onclick: () => { sheet.steps.push(newStep()); update(true); } }, L.addStep),
      full ? el("span", { class: "note" }, L.limit) : ""]));
    root.append(box);
  });

  root.append(
    el("div", { class: "row-top" }, el("button", { disabled: state.sheets.length >= MAX_SHEETS,
      onclick: () => { state.sheets.push({ title: "🌙", sky: "night", steps: [newStep()] }); update(true); } }, L.addSheet)),
    el("div", { id: "warnings" }));
}

// refresh each step's picture in place, so typing keeps focus
function refreshSteps() {
  state.sheets.forEach((sheet, si) => sheet.steps.forEach((step, k) => {
    if (!step._thumb) return;
    const r = resolve(step, si, k);
    step._thumb.classList.toggle("missing", !r.image && step.image !== "none" && !!step.label.trim());
    step._thumb.replaceChildren(r.image ? el("img", { src: `../images/${r.image}.jpg`, alt: D.images[r.image].title }) : "?");
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
  const sky = s => (state.background === "gradient" ? s.sky : state.background);
  const sheets = state.sheets.map((s, si) => ({ title: s.title, sky: sky(s), times: state.times, steps: s.steps.map((st, k) => resolve(st, si, k)) }));
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

// on a narrow screen the A4 preview shrinks to fit; printing uses @media print (zoom 1)
function fitPreview() {
  const a4 = 794, room = document.documentElement.clientWidth - 16;
  document.getElementById("preview").style.zoom = room < a4 ? (room / a4).toFixed(3) : "";
}
window.addEventListener("resize", fitPreview);

document.head.append(el("style", {}, D.css));
fitPreview();
document.fonts && document.fonts.ready.then(() => renderPreview());   // re-measure labels once the font is in
update(true);
