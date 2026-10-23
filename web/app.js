// Routine sheet maker: a parent types steps and times, the page picks images by keyword and
// draws the same A4 sheet as tools/build.py. sheetHtml() mirrors sheet_html() in tools/build.py;
// change both together. Data (CSS, skies, keywords, edge colors) comes from data.js, built by it.
"use strict";

const D = window.SHEET_DATA;
const EDGES = window.SHEET_EDGES;
const MAX_STEPS = 8;     // layout limit (AGENTS.md); the form always shows this many rows
const STORE = "child-routines-maker";
const CONTRIBUTE = "https://github.com/stutek/child-routines/blob/main/CONTRIBUTING.md#add-an-image";
const PROJECT = "https://github.com/stutek/child-routines";
const GUIDE = { sl: `${PROJECT}/blob/main/README.sl.md`, en: `${PROJECT}/blob/main/README.md` };   // how to use the sheet and safety, for parents

// Step colors per sheet, the same as the example routines: gender-neutral playroom colours (no pink or
// purple), each dark enough for a white step number at 3 : 1 (WCAG 2.2, large text)
const PALETTES = [
  ["#D97706", "#EA580C", "#DC2626", "#65A30D", "#16A34A", "#0D9488", "#0284C7", "#2563EB"],
  ["#16A34A", "#0D9488", "#0284C7", "#2563EB", "#D97706", "#EA580C", "#DC2626", "#65A30D"],
  ["#0284C7", "#0D9488", "#2563EB", "#16A34A", "#0369A1", "#1D4ED8", "#115E59", "#1E40AF"],
];

const T = {
  sl: {
    heading: "Otrokove rutine", aboutTitle: "O aplikaciji", howTitle: "Navodila",
    about: "Ko otrok na listu vidi, kaj pride zdaj in kaj potem, laže sledi rutini in pogajanja je lahko manj. Ko na opravljen korak sam položi magnetek, vidi, koliko je že naredil in kaj ga še čaka. Najbolje deluje, če list sestavita skupaj in ga prve dni skupaj prehodita. Še posebej pride prav, ko otrok prespi pri sorodnikih: starim staršem, tetam in stricem pomaga, da rutino ohranijo.",
    how: ["Izberi tip rutine in vpiši do 8 opravil; prazne vrstice se ne natisnejo.", "Sličico izberem sam. Klikni nanjo, da jo zamenjaš. Naj otrok izbere slike in vrstni red: vrstico povleci za pike.", "Natisni na A4: robovi »Brez«, merilo 100 %."],
    example: "Naloži primer", replaceSheet: "Primer bo zamenjal tvoj list in vpisano se bo izgubilo. Nadaljujem?", print: "Natisni",
    type: "Tip rutine", sheetTitle: "Naslov lista", skies: { dawn: "jutro", afternoon: "dan", night: "večer" },
    times: "Ura na listu", background: "Ozadje", backgrounds: { gradient: "preliv barv", white: "belo", none: "prosojno (se ne natisne)" },
    label: "Opravilo", labelHint: "npr. UMIJ ZOBKE", language: "Jezik", moved: n => `Premaknjeno na mesto ${n}`, picture: "Sličica", time: "Ura", auto: "Samodejno", none: "Brez sličice", pick: "Zamenjaj sličico", removeStep: "Izprazni vrstico", move: "Premakni korak", moveHint: "Povleci za premik ali tapni tu in nato na novem mestu; s tipkovnico puščici gor in dol",
    warnNoMatch: (s, l) => `${s}: za »${l}« nimamo sličice. Izberi drugo ali pusti prazno.`,
    warnLong: (s, l) => `${s}: napis »${l}« je predolg za okvir; skrajšaj ga.`,
    preview: "👁 Predogled: tako bo natisnjeno (A4)", step: "Korak", ok: "✓ Vse sličice so najdene in vsi napisi se prilegajo.", suggest: "Manjka sličica? Predlagaj jo", warnTitle: "Opozorila", guide: "Navodila in varnost", project: "Projekt na GitHubu",
  },
  en: {
    heading: "Child routines", aboutTitle: "About", howTitle: "How to",
    about: "When a child can see what comes now and what comes next, following the routine gets easier and there can be less bargaining. Placing a magnet on each finished step themselves shows how much they have done and what is left. It works best when you make the sheet together and go through it together for the first few days. It is especially handy when your child sleeps over at relatives': it helps grandparents, aunts and uncles keep the routine.",
    how: ["Pick the routine type and type up to 8 steps; empty rows are not printed.", "I pick the pictures. Click one to change it. Let your child choose the pictures and the order: drag a row by its dots.", "Print on A4: margins None, scale 100 %."],
    example: "Load example", replaceSheet: "The example will replace your sheet and what you typed will be lost. Continue?", print: "Print",
    type: "Routine type", sheetTitle: "Sheet title", skies: { dawn: "morning", afternoon: "day", night: "evening" },
    times: "Time on the sheet", background: "Background", backgrounds: { gradient: "color gradient", white: "white", none: "transparent (not printed)" },
    label: "Step", labelHint: "e.g. BRUSH TEETH", language: "Language", moved: n => `Moved to place ${n}`, picture: "Picture", time: "Time", auto: "Automatic", none: "No picture", pick: "Change picture", removeStep: "Clear row", move: "Move step", moveHint: "Drag to move, or tap here and then at the new place; with the keyboard, the up and down arrows",
    warnNoMatch: (s, l) => `${s}: no picture for "${l}". Pick another or leave it empty.`,
    warnLong: (s, l) => `${s}: "${l}" is too long for the frame; shorten it.`,
    preview: "👁 Preview: this is what prints (A4)", step: "Step", ok: "✓ All pictures found and all labels fit.", suggest: "Missing a picture? Suggest one", warnTitle: "Warnings", guide: "How to use it and safety", project: "Project on GitHub",
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
  let out = "", n = 0;
  while (n < 46) {   // no stars behind the footer text (264 to 286 mm), as stars() in tools/build.py
    const x = 3 + rnd() * 204, y = 110 + rnd() * 185, r = pick([0.35, 0.5, 0.7, 0.9]), o = 0.45 + rnd() * 0.5;
    if (y > 264 && y < 286) continue;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" opacity="${o.toFixed(2)}"/>`; n++;
  }
  return out;
}

// same as image_size() in tools/build.py
function imageSize(n) {
  const g = D.geometry, row = (g.page_h - g.margin - g.margin_bottom - g.title - g.footer) / (2 * n + 2);
  return Math.min(g.img, Math.floor((4 * row - g.gap) * 2) / 2);
}

// the reader's locale when it matches the page language (en-GB: 19:30, en-US: 7:30 PM, sl: 19:30),
// else the language itself; tools/build.py clock_text() gives the same for sl and en
function clockText(time, lang) {
  const [h, m] = time.split(":").map(Number);
  const own = navigator.language || "";
  const locale = own.toLowerCase().startsWith(lang) ? own : lang;
  try {
    return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2020, 0, 1, h, m));
  } catch (e) {
    return time;
  }
}

function sheetHtml(sheet, lang = "sl") {
  const n = sheet.steps.length;
  const rows = sheet.steps.map((step, k) => {
    const i = k + 1, side = i % 2 ? "left" : "right";
    const bg = step.image && EDGES[step.image] ? EDGES[step.image][side === "left" ? 0 : 1] : D.missingBg;
    const style = `--step: ${step.color}; --bg: ${bg}; --ink: ${labelColor(step.color, bg)};`;
    const picture = step.image ? `<img src="../images/${esc(step.image)}.jpg" alt="${esc(step.label)}" />` : '<div class="rt-missing">?</div>';
    const clock = sheet.times === false ? "" : step.time ? `<div class="rt-time">${esc(clockText(step.time, lang))}</div>`
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
  const gridRows = `${D.geometry.title}mm repeat(${2 * n + 2}, minmax(0, 1fr))`;
  const img = imageSize(n), size = img < D.geometry.img ? ` --img: ${img}mm;` : "";
  return `
  <div class="page-a4 rt-page" style="background: ${background};${size}">${starry}
    <div class="rt-grid" style="grid-template-rows: ${gridRows};">
      <div class="rt-header"><div class="rt-title">${esc(sheet.title)}</div></div>${rows}
    </div>
    <div class="rt-footer${sheet.sky === "night" ? " on-dark" : ""}"><span class="rt-license">${esc(D.license[lang] || D.license.en)}</span><span class="rt-site">${esc(D.site)}</span>${D.qr}</div>
  </div>`;
}

// ---------- state: one sheet, always MAX_STEPS rows; empty rows are left off the sheet ----------

const newStep = () => ({ label: "", time: "", image: "auto" });
const EXAMPLE_FOR = { dawn: 0, afternoon: 1, night: 2 };   // sheet of the example routine per type
// titles are plain text; older stored titles and the example may start with an icon, which is dropped
const bare = s => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();
// examples follow good habits (routines/sl/primer.json, routines/en/example.json), in the page language
const EXAMPLE_IN = { sl: "sl-primer", en: "en-example" };
const example = (sky, lang = (typeof state !== "undefined" && state.lang) || "sl") => D.examples[EXAMPLE_IN[lang] || "sl-primer"].sheets[EXAMPLE_FOR[sky] || 0];
const pad = steps => steps.concat(Array.from({ length: MAX_STEPS }, newStep)).slice(0, MAX_STEPS);

const exampleSteps = ex => pad(ex.steps.map(st => ({ label: st.label, time: "", image: "auto" })));
function fromExample(lang, sky = "night", base = {}) {   // the evening routine opens first
  const ex = example(sky, lang);
  return { lang, background: base.background || "gradient", times: base.times !== false,
           sheet: { title: bare(ex.title), sky, steps: exampleSteps(ex) } };
}
// loading an example would lose what the parent typed: rows with content that are not just an example (any language or type)
const rowsKey = steps => JSON.stringify(steps.map(s => [s.label.trim(), s.time, s.image]));
const EXAMPLE_ROWS = new Set(Object.values(EXAMPLE_IN).flatMap(name => D.examples[name].sheets.map(ex => rowsKey(exampleSteps(ex)))));
const typed = sheet => sheet.steps.some(s => s.label.trim() || s.time || s.image !== "auto") && !EXAMPLE_ROWS.has(rowsKey(sheet.steps));
// Stored state is untrusted: every page on stutek.github.io shares this origin and its storage.
// Keep only known values, so nothing from storage reaches the markup unchecked.
function clean(s) {
  if (!s || typeof s !== "object") return null;
  const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max);
  const step = st => ({
    label: str(st && st.label, 40),
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(st && st.time) ? st.time : "",
    image: st && (st.image === "none" || D.images[st.image]) ? st.image : "auto",
  });
  const sh = s.sheet || (Array.isArray(s.sheets) && s.sheets[0]);   // older versions kept several sheets
  if (!sh) return null;
  const sheet = { title: bare(str(sh.title, 60)), sky: D.skies[sh.sky] ? sh.sky : "night",
                  steps: pad((Array.isArray(sh.steps) ? sh.steps : []).slice(0, MAX_STEPS).map(step)) };
  return { lang: T[s.lang] ? s.lang : "sl", background: ["gradient", "white", "none"].includes(s.background) ? s.background : "gradient",
           times: s.times !== false, sheet };
}
// first visit: the first of the browser's languages the page has (navigator.languages), else English
function browserLang() {
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const l of langs) { const code = l.toLowerCase().slice(0, 2); if (T[code]) return code; }
  return "en";
}
function load() {
  try { const s = clean(JSON.parse(localStorage.getItem(STORE))); if (s) return s; } catch (e) { /* no or bad storage */ }
  return fromExample(browserLang());
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state, (k, v) => (k.startsWith("_") ? undefined : v))); } catch (e) { /* no storage */ }
}

let state = load();
const t = () => T[state.lang] || T.sl;
const filled = () => state.sheet.steps.filter(st => st.label.trim());

// resolved step for drawing: uppercase label, chosen or matched image, palette color by type and position
function resolve(step, k) {
  const m = match(step.label);
  const image = step.image === "auto" ? (m ? m.id : null) : step.image === "none" ? null : step.image;
  return { label: step.label.toLocaleUpperCase(state.lang), time: step.time, image, match: m,
           color: PALETTES[EXAMPLE_FOR[state.sheet.sky] || 0][k % MAX_STEPS] };
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

// each language in its own name and marked with its language (WCAG 2.2, 3.1.2)
function langSelect(label) {
  const s = select(label, state.lang, { sl: "Slovenščina", en: "English" }, v => { state.lang = v; update(true); });
  for (const o of s.options) o.lang = o.value;
  return s;
}

// a labelled field: the label text above its control
const field = (text, control, cls = "") => el("label", { class: `field ${cls}`.trim() }, [el("span", { class: "field-label" }, text), control]);

// a one-colour broom from Noto Emoji (loaded in index.html); it takes the button colour
const broom = () => el("span", { class: "broom", "aria-hidden": "true" }, "🧹");

// ---------- reordering: drag a row by its grip (mouse or touch), tap a grip and then another, or arrow keys ----------
// dragging is not the only way (WCAG 2.2, 2.5.7). The numbers are places 1 to 8 and stay put; the row's content moves.
const shift = (row, y) => { for (const c of row.children) if (!c.classList.contains("n")) c.style.transform = y ? `translateY(${y}px)` : ""; };
let picked = null;   // row picked by a tap, waiting for the tap at its new place
function moveStep(from, to) {
  const steps = state.sheet.steps;
  steps.splice(to, 0, steps.splice(from, 1)[0]);
  picked = null; update(true);
  document.querySelectorAll(".grip")[to].focus();
  document.getElementById("announce").textContent = T[state.lang].moved(to + 1);   // read out by screen readers
}
function dragRow(e, k, rows) {
  if (e.button > 0) return;
  e.preventDefault();
  const grip = e.currentTarget, ac = new AbortController();
  grip.setPointerCapture(e.pointerId);
  document.querySelectorAll(".gallery").forEach(g => { g.hidden = true; });
  const pitch = rows.length > 1 ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top : 1;
  const y0 = e.clientY;
  let to = k, moved = false;
  grip.addEventListener("pointermove", ev => {
    const dy = ev.clientY - y0;
    if (!moved && Math.abs(dy) < 5) return;
    moved = true; rows[k].classList.add("dragging");
    to = Math.max(0, Math.min(rows.length - 1, k + Math.round(dy / pitch)));
    rows.forEach((r, i) => shift(r, i === k ? dy : k < i && i <= to ? -pitch : to <= i && i < k ? pitch : 0));
  }, { signal: ac.signal });
  const end = () => {
    ac.abort();
    rows.forEach(r => { shift(r, 0); r.classList.remove("dragging"); });
    if (moved) { if (to !== k) moveStep(k, to); return; }
    if (picked === null) { picked = k; rows[k].classList.add("picked"); grip.setAttribute("aria-pressed", "true"); }
    else if (picked === k) { picked = null; rows[k].classList.remove("picked"); grip.setAttribute("aria-pressed", "false"); }
    else moveStep(picked, k);
  };
  grip.addEventListener("pointerup", end, { signal: ac.signal });
  grip.addEventListener("pointercancel", end, { signal: ac.signal });
}

function renderEditor() {
  const L = t(), root = document.getElementById("maker"), sheet = state.sheet;
  document.documentElement.lang = state.lang;
  document.title = L.heading;
  document.getElementById("preview-label").textContent = L.preview;
  root.classList.toggle("no-times", !state.times);
  const times = el("input", { type: "checkbox", onchange: e => { state.times = e.target.checked; update(true); } });
  times.checked = state.times;
  // a title still equal to an example title follows the type; a title the parent typed stays
  const setType = v => {
    const auto = Object.keys(EXAMPLE_FOR).some(k => bare(example(k).title) === sheet.title) || !sheet.title.trim();
    sheet.sky = v; if (auto) sheet.title = bare(example(v).title); update(true);
  };
  root.replaceChildren(
    el("div", { class: "row-top" }, [
      el("h1", { class: "grow" }, [el("img", { class: "logo", src: "icon.svg", alt: "" }), L.heading]),
      // each language in its own name, labelled with a globe (W3C: language selection), no flags
      el("label", { class: "lang" }, [el("span", { class: "globe", "aria-hidden": "true" }, "🌐"),
        langSelect(L.language)])]),
    el("h2", {}, L.aboutTitle), el("p", { class: "about" }, L.about),
    el("h2", {}, L.howTitle), el("ol", { class: "how" }, L.how.map(s => el("li", {}, s))),
    // every field has a visible label (WCAG 2.2, 3.3.2); a placeholder disappears once the parent types
    el("div", { class: "row-top fields" }, [
      field(L.type, select(L.type, sheet.sky, L.skies, setType)),
      field(L.sheetTitle, el("input", { class: "title", value: sheet.title, autocapitalize: "characters",
        oninput: e => { sheet.title = e.target.value; update(); } }), "grow")]),
    el("div", { class: "row-top fields" }, [
      field(L.background, select(L.background, state.background, L.backgrounds, v => { state.background = v; update(true); })),
      el("label", { class: "grow check" }, [times, L.times]),
      el("button", { class: "secondary", onclick: () => { if (typed(sheet) && !confirm(L.replaceSheet)) return; state = fromExample(state.lang, sheet.sky, state); update(true); } }, `${L.example}: ${L.skies[sheet.sky]}`)]));

  // column headings label the rows: a screen reader reads a field as "Step 3"
  const box = el("div", { class: "sheet-box" }, el("div", { class: "step step-head", "aria-hidden": "true" }, [
    el("span"), el("span"), el("span", { id: "col-label" }, L.label), el("span", { id: "col-time", class: "col-time" }, L.time),
    el("span", { id: "col-pic" }, L.picture), el("span")]));
  const rows = [];
  sheet.steps.forEach((step, k) => {
    const gallery = el("div", { class: "gallery", hidden: true });
    const thumb = el("button", { class: "thumb", title: L.pick, "aria-label": `${L.pick} ${k + 1}`, onclick: () => { gallery.hidden = !gallery.hidden; } });
    // a picture chosen on an empty row brings its default label (images/<id>.json "label")
    const choose = v => {
      step.image = v; gallery.hidden = true;
      const label = D.images[v] && D.images[v].label;
      if (!step.label.trim() && label) { step.label = label[state.lang] || label.sl || ""; update(true); } else update();
    };
    gallery.append(
      el("button", { onclick: () => choose("auto") }, `🔄 ${L.auto}`),
      ...Object.entries(D.images).map(([id, img]) =>
        el("button", { title: img.title, onclick: () => choose(id) }, el("img", { src: `../images/${id}.jpg`, alt: img.title, loading: "lazy" }))),
      el("button", { onclick: () => choose("none") }, `∅ ${L.none}`));
    const grip = el("button", { class: "grip", title: L.moveHint, "aria-label": `${L.move} ${k + 1}`, "aria-pressed": picked === k ? "true" : "false",
      onpointerdown: e => dragRow(e, k, rows), onclick: e => e.preventDefault(),
      onkeydown: e => {
        const to = k + (e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0);
        if (to !== k && to >= 0 && to < MAX_STEPS) { e.preventDefault(); moveStep(k, to); }
      } }, el("span", { class: "dots", "aria-hidden": "true" }));
    const row = el("div", { class: picked === k ? "step picked" : "step" }, [
      el("span", { class: "n", id: `n-${k}` }, `${k + 1}`), grip,
      el("input", { value: step.label, placeholder: k === 0 ? L.labelHint : "", maxlength: "24", "aria-labelledby": `col-label n-${k}`, autocapitalize: "characters",
        oninput: e => { step.label = e.target.value; update(); } }),
      el("input", { type: "time", value: step.time, "aria-labelledby": `col-time n-${k}`, oninput: e => { step.time = e.target.value; update(); } }),
      thumb,
      el("button", { class: "del", title: L.removeStep, "aria-label": L.removeStep,
        onclick: () => { sheet.steps[k] = newStep(); update(true); } }, broom())]);
    rows.push(row);
    box.append(row, gallery);
    step._thumb = thumb;
  });
  // print comes last, after the parent has filled in the rows and read the warnings
  root.append(box, el("div", { id: "warnings", role: "status" }),
    el("div", { class: "row-top" }, el("button", { class: "primary", onclick: () => window.print() }, L.print)),
    el("p", { class: "links" }, [el("a", { href: GUIDE[state.lang] || GUIDE.en, target: "_blank", rel: "noopener" }, L.guide), " · ",
      el("a", { href: PROJECT, target: "_blank", rel: "noopener" }, L.project)]));
}

// refresh each row's picture in place, so typing keeps focus; an empty row shows no picture
function refreshSteps() {
  state.sheet.steps.forEach((step, k) => {
    if (!step._thumb) return;
    const empty = !step.label.trim(), r = resolve(step, k);
    step._thumb.classList.toggle("missing", !empty && !r.image && step.image !== "none");
    step._thumb.classList.toggle("empty", empty);
    step._thumb.replaceChildren(!empty && r.image ? el("img", { src: `../images/${r.image}.jpg`, alt: D.images[r.image].title }) : empty ? "" : "?");
  });
}

// ---------- preview and warnings ----------

// .rt-text grows with its label, so its own width says nothing; the room is frame minus circle
function labelRoom(lab) {
  const card = lab.closest(".rt-card"), cs = getComputedStyle(card);
  return card.clientWidth - card.querySelector(".rt-check").offsetWidth
    - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.columnGap || 0);
}

function renderPreview() {
  const L = t(), s = state.sheet, steps = filled();
  const sky = state.background === "gradient" ? s.sky : state.background;
  document.getElementById("sheets").innerHTML = sheetHtml({ title: s.title.toLocaleUpperCase(state.lang), sky, times: state.times, steps: steps.map(resolve) }, state.lang);

  const warnings = [];
  steps.forEach((st, k) => { if (st.image === "auto" && !match(st.label)) warnings.push(L.warnNoMatch(`${L.step} ${k + 1}`, st.label)); });
  // labels do not wrap: compare each with the frame width left beside the magnet circle (AGENTS.md)
  document.querySelectorAll("#sheets .rt-label").forEach((lab, k) => {
    if (lab.scrollWidth > labelRoom(lab)) warnings.push(L.warnLong(`${L.step} ${k + 1}`, lab.textContent));
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

// the A4 sheet shrinks to its column: by width on a narrow screen, by width and height side by side,
// so the whole sheet is in view without scrolling; printing uses @media print (zoom 1)
function fitPreview() {
  const a4w = 794, a4h = 1123, preview = document.getElementById("preview");
  const label = document.getElementById("preview-label");
  let zoom = (preview.clientWidth - 8) / a4w;
  if (matchMedia("(min-width: 1100px)").matches) zoom = Math.min(zoom, (innerHeight - 32 - label.offsetHeight - 16) / a4h);
  document.getElementById("sheets").style.zoom = zoom < 1 ? zoom.toFixed(3) : "";
}
window.addEventListener("resize", fitPreview);

document.head.append(el("style", {}, D.css));
update(true);
fitPreview();
document.fonts && document.fonts.ready.then(() => renderPreview());   // re-measure labels once the font is in
