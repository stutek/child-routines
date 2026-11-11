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
const MAKER = "https://twotech.si/";   // credited as text, no logo: a logo file in this CC0 repository would look CC0 too
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
    heading: "Otrokove rutine", aboutTitle: "O aplikaciji", howTitle: "Hitri začetek",
    about: "Jutro in večer sta polna korakov in pogosto jih naštevaš ti, vsak dan znova. Tu v nekaj minutah narediš in natisneš list s sličicami otrokove rutine, na katerem otrok opravljen korak sam označi z magnetkom ali kljukico. Tako vidi, kaj pride, list pa lahko gre z njim tudi k starim staršem, teti ali stricu, kjer mu znano zaporedje lahko da občutek varnosti. Brezplačno in brez prijave; kar vpišeš, ostane v tvojem brskalniku.",
    how: ["Najlažje gre na računalniku. Izberi »Tip rutine« in vpiši korake: priporočamo 3 do 8. Prve dni jih opravi skupaj z otrokom.", "Stran sama izbere sličico za vsak korak. Klikni sličico, da jo zamenjaš.", "Naslov in korake lahko spremeniš tako, da vpišeš svoje besedilo. Prazne vrstice so na listu nevidne.", "Za ure na listu vklopi stikalo »Ura na listu«, vpiši začetek in koliko minut traja vsak korak. Ob želenem koncu vidiš rezervo ali preliv.", "Vrstni red spremeniš tako, da vrstico povlečeš za pike.", "Klikni »Natisni«: A4, robovi »Brez«, merilo 100 %. Za datoteko PDF, ki jo lahko deliš, v oknu za tiskanje izberi »Shrani kot PDF«.", "Ko rutino spremeniš ali prilagodiš, natisni nov list.", "Za deljenje trenutnega pogleda aplikacije s sorodniki in prijatelji uporabi gumb »Deli povezavo«."],
    example: "Naloži primer", replaced: "Primer je zamenjal tvoj list.", stepRemoved: "Korak je odstranjen.", skip: "Preskoči na obrazec", previewName: "Predogled lista", linkReplaced: "Povezava je zamenjala tvoj list.", copy: "Deli povezavo", copied: "Povezava je kopirana.", linkHint: "Povezava na končni izdelek brez aplikacije za urejanje. Povezava vsebuje vse podatke za ponovno ustvarjanje kopije deljene rutine.", undo: "Razveljavi", undone: "Tvoj list je vrnjen.", print: "Natisni",
    type: "Tip rutine", sheetTitle: "Naslov lista", skies: { dawn: "jutro", afternoon: "dan", night: "večer" },
    times: "Ura na listu", background: "Ozadje", backgrounds: { gradient: "barvno", white: "belo", none: "brez (manj črnila)" },
    layout: "Postavitev sličic", layouts: { center: "v sredini", sides: "levo in desno" },
    pictures: "Skupina slik", themes: { all: "vse slike", bear: "medvedek", plain: "brez lika" },
    label: "Korak", labelHint: "npr. UMIJ ZOBKE", language: "Jezik", moved: n => `Premaknjeno na mesto ${n}`, picture: "Sličica", time: "Trajanje", start: "Začetek rutine", end: "Želeni konec", endsAt: x => `Konec ob ${x}`,
    converted: (u, n) => `Ure iz starejše povezave so preračunane v trajanja.${u ? ` Ure niso bile po vrsti pri: ${u}; ti koraki imajo privzeto trajanje.` : ""}${n ? ` Brez ure: ${n}; privzeto trajanje.` : ""} Nastavi »Začetek rutine« in »Želeni konec«.`, spare: n => `+${n} min rezerve`, over: n => `−${n} min preliva`, minutes: "minut", auto: "Samodejno", none: "Brez sličice", pick: "Zamenjaj sličico", closePick: "Zapri izbiro sličic", removeStep: "Izprazni vrstico", move: "Premakni korak", moveHint: "Povleci ali tapni tu, nato tapni novo mesto. S tipkovnico: puščici gor in dol.", moveDesc: "Alt in puščica gor ali dol premakne korak. Dotik ročaja in nato ročaja druge vrstice zamenja mesti.",
    warnNoMatch: (s, l) => `${s}: za »${l}« ni sličice. Klikni »?« in izberi sličico ali »Brez sličice«.`,
    warnMismatch: (s, l) => `${s}: sličica se morda ne ujema z napisom »${l}«.`,
    warnLong: (s, l) => `${s}: napis »${l}« je predolg za okvir; skrajšaj ga.`, tooLong: "Napis je predolg za okvir.",
    tipOff: "Ne kaži več tega namiga", tips: { type: "Jutro, dan ali večer: določi barve neba in primer korakov.", layout: "V sredini so sličice skupaj, zato pogled ne skače čez ves list. Levo in desno ima večje napise.", sheetTitle: "Besedilo na vrhu lista. Dolg naslov se zmanjša.", background: "Barvno ozadje je najlepše; belo ali brez porabi manj črnila.", pictures: "Ali naj sličice kažejo medvedka ali nobenega lika.", times: "Vklopljeno: ob vsakem koraku je ura, izračunana iz začetka in trajanj. Ure so za odrasle.", start: "Ura, ko se rutina začne. Brez nje so polja za uro na listu prazna.", end: "Kdaj naj bo rutina končana. Obrazec pokaže, koliko časa ostane ali zmanjka; na listu je ni.", example: "Zamenja tvoj list s primerom za izbrani tip rutine. Razveljaviš lahko.", label: "Napis ob sličici, do približno 17 črk.", time: "Koliko minut traja korak; sivo je predlog. Desno je ura, do katere naj bo korak opravljen. Trajanje gre s korakom, ko ga premakneš.", pick: "Klikni in izberi drugo sličico.", del: "Izprazni vrstico. Razveljaviš lahko." },
    printHint: ["Pri tiskanju nastavi:", "velikost A4", "merilo 100 %", "brez robov", "lahko tudi shraniš kot PDF"], step: "Korak", ok: "✓ Vse sličice so najdene in vsi napisi se prilegajo.", suggest: "Manjka sličica? Predlagaj jo", warnTitle: "Opozorila", watchTitle: "Na kaj paziti", watch: [["Starost", "list je za otroke od 3 let naprej."], ["Magnetki", "uporabi le magnetke, varne za otroke in kemično neškodljive. Če otrok pogoltne magnetek, takoj pojdi k zdravniku."], ["Pisala", "za kljukice uporabi le pisala, varna za otroke in kemično neškodljiva."], ["Zdravila", "daje in hrani jih odrasel. Niso sladkarija."], ["Kopanje", "majhnega otroka nikoli ne pusti samega v kadi."], ["Zobki", "sledi navodilom svojega zobozdravnika."], ["Nagrade", "magnetek pomeni »narejeno«. Ne obljubljaj daril za magnetke: nagrada lahko otroku vzame lastno motivacijo ob doseganju uspeha in zmanjša veselje do opravila."], ["Brez pritiska", "ure na listu so za odrasle, ne za priganjanje. Če korak izpade ali se vrstni red pomeša, ohrani mir in poskusi znova naslednjič."]], guide: "Več o uporabi in varnosti", newTab: "(odpre se v novem zavihku)", project: "Projekt na GitHubu", madeBy: "Naredil", hide: "Skrij", show: "Pokaži",
  },
  en: {
    heading: "Child routines", aboutTitle: "About", howTitle: "Quick start",
    about: "Mornings and evenings are full of steps, and often you're the one listing them, every day. Here you can make and print a picture sheet of your child's routine in a few minutes; your child marks each finished step with a magnet or a tick. They can see what comes next, and the sheet can travel to grandparents, an aunt or an uncle, where the familiar order can give a sense of security. Free, with no sign-up; what you type stays in your browser.",
    how: ["It is easiest on a computer. Pick the “Routine type” and type the steps: we recommend 3 to 8. Do them with your child for the first few days.", "The page picks a picture for each step. Click a picture to change it.", "Type your own text to change the title and the steps. Empty rows do not show on the sheet.", "For times on the sheet, turn on the “Time on the sheet” switch, type the start and how many minutes each step takes. With a wished end you see the time to spare or the overrun.", "Drag a row by its dots to change the order.", "Click “Print”: A4, margins “None”, scale 100%. For a PDF file you can share, choose “Save as PDF” in the print window.", "When you change or adjust the routine, print a new sheet.", "To share the current view of the app with family and friends, use the “Share link” button."],
    example: "Load example", replaced: "The example replaced your sheet.", stepRemoved: "Step removed.", skip: "Skip to the form", previewName: "Sheet preview", linkReplaced: "The link replaced your sheet.", copy: "Share link", copied: "Link copied.", linkHint: "A link to the finished sheet, without the editing app. The link holds all the data to make a copy of the shared routine again.", undo: "Undo", undone: "Your sheet is back.", print: "Print",
    type: "Routine type", sheetTitle: "Sheet title", skies: { dawn: "morning", afternoon: "day", night: "evening" },
    times: "Time on the sheet", background: "Background", backgrounds: { gradient: "color", white: "white", none: "none (less ink)" },
    layout: "Picture layout", layouts: { center: "in the middle", sides: "left and right" },
    pictures: "Image group", themes: { all: "all pictures", bear: "teddy bear", plain: "no character" },
    label: "Step", labelHint: "e.g. BRUSH TEETH", language: "Language", moved: n => `Moved to place ${n}`, picture: "Picture", time: "Duration", start: "Routine start", end: "Wished end", endsAt: x => `Ends at ${x}`,
    converted: (u, n) => `The times from an older link are turned into durations.${u ? ` Out of order: ${u}; these steps take the default duration.` : ""}${n ? ` No time: ${n}; default duration.` : ""} Set the “Routine start” and the “Wished end”.`, spare: n => `+${n} min to spare`, over: n => `−${n} min over`, minutes: "minutes", auto: "Automatic", none: "No picture", pick: "Change picture", closePick: "Close the picture choice", removeStep: "Clear row", move: "Move step", moveHint: "Drag, or tap here and then tap the new place. Keyboard: up and down arrows.", moveDesc: "Alt and the up or down arrow move the step. Tap the handle, then another row's handle, to swap them.",
    warnNoMatch: (s, l) => `${s}: no picture for “${l}”. Click “?” and pick a picture or “No picture”.`,
    warnMismatch: (s, l) => `${s}: the picture may not match the label “${l}”.`,
    warnLong: (s, l) => `${s}: “${l}” is too long for the frame; shorten it.`, tooLong: "The label is too long for the frame.",
    tipOff: "Don't show this hint again", tips: { type: "Morning, day or evening: sets the sky colours and the example steps.", layout: "In the middle the pictures sit together, so the eye does not jump across the sheet. Left and right has larger labels.", sheetTitle: "The text at the top of the sheet. A long title gets smaller.", background: "A coloured background looks best; white or none uses less ink.", pictures: "Whether the pictures show a teddy bear or no character.", times: "On: each step shows a time worked out from the start and the durations. The times are for adults.", start: "The time the routine starts. Without it the time fields on the sheet stay empty.", end: "When the routine should be over. The form shows how much time is left or missing; it is not on the sheet.", example: "Replaces your sheet with the example for the chosen routine type. You can undo it.", label: "The label next to the picture, up to about 17 letters.", time: "How many minutes the step takes; grey is a suggestion. On the right is the time the step should be done by. The duration moves with the step.", pick: "Click to choose another picture.", del: "Clears the row. You can undo it." },
    printHint: ["When printing, set:", "size A4", "scale 100%", "margins “None”", "you can also save it as a PDF"], step: "Step", ok: "✓ All pictures found and all labels fit.", suggest: "Missing a picture? Suggest one", warnTitle: "Warnings", watchTitle: "What to watch for", watch: [["Age", "the sheet is for children aged 3 and up."], ["Magnets", "use only magnets that are safe for children and chemically harmless. If a child swallows a magnet, see a doctor at once."], ["Pens", "for ticks, use only pens that are safe for children and chemically harmless."], ["Medicine", "an adult gives and keeps it. It is not a sweet."], ["Bath", "never leave a young child alone in the bath."], ["Teeth", "follow your dentist's advice."], ["Rewards", "a magnet means “done”. Don't promise gifts for magnets: a reward can take away the child's own motivation to succeed and lessen the joy of the task."], ["No pressure", "the times on the sheet are for adults, not for hurrying. If a step is skipped or the order gets mixed up, stay calm and try again next time."]], guide: "More about use and safety", newTab: "(opens in a new tab)", project: "Project on GitHub", madeBy: "Made by", hide: "Hide", show: "Show",
  },
};

// ---------- matching: label -> image id by keywords (images/<id>.json "keywords") ----------

function norm(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// "zob*" matches the start of a word (zobki, umij zobe); "wc" or "go to bed" must match whole words.
// The longest matching keyword wins, so "v posteljo" (sleep) beats "postelj*" (make the bed).
function match(label, only) {
  const text = ` ${norm(label)} `;
  let best = null;
  for (const [id, img] of Object.entries(D.images)) {
    if (only && id !== only) continue;
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

// the picture of a step in the sheet's image group: "all" keeps the picture as chosen; a theme takes the picture's
// variant in that theme (images/<id>.json "variant_of"), else the picture itself; same as themed() in tools/build.py
const ALL = "all";
function themed(id, theme) {
  if (!id || theme === ALL || D.images[id].theme === theme) return id;
  const base = D.images[id].variant_of || id;
  if (D.images[base].theme === theme) return base;
  return Object.keys(D.images).find(v => D.images[v].variant_of === base && D.images[v].theme === theme) || id;
}
// the theme choice shows once an image has a variant; before that it would change nothing
const THEMED = Object.values(D.images).some(img => img.variant_of);

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
  while (n < 46) {   // no stars behind the footer text (262 to 286 mm), as stars() in tools/build.py
    const x = 3 + rnd() * 204, y = 110 + rnd() * 185, r = pick([0.35, 0.5, 0.7, 0.9]), o = 0.45 + rnd() * 0.5;
    if (y > 262 && y < 286) continue;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" opacity="${o.toFixed(2)}"/>`; n++;
  }
  return out;
}

// same as layout(), centres(), title_space(), title_size() and center_label_size() in tools/build.py;
// center: pictures in the middle (default)
function layout(n, center = false) {
  const g = D.geometry, w = g.page_w - 2 * g.margin;
  const area = g.page_h - g.margin - g.margin_bottom - g.footer + g.footer_gap, span = area - g.edge, top = Math.floor((w - g.gap) / 2 * 2) / 2;
  const half = x => Math.floor(x * 2) / 2;
  if (center) {
    const img = n === 1 ? g.img : Math.min(g.img, half((2 * span - g.gap * (n - 1)) / (n + 1)));
    return { img, wide: false, p: n > 1 ? (span - img) / (n - 1) : 0, area };
  }
  let narrow, wide;
  if (n === 1) { narrow = g.img; wide = top; }
  else {
    const k = n - 1;
    narrow = Math.min(g.img, half((2 * span - g.gap * k) / (n + 1)));
    const a = 2 * (span - (g.frame_h / 2 + g.gap) * k) / (n + 1), c = 2 * (span - (g.circle / 2 + g.gap) * k) / (n + 1);
    const free = (w - g.circle - g.gap) / 2;
    wide = Math.min(top, half(a <= free ? a : Math.max(free, Math.min(a, c))));
  }
  const img = Math.max(narrow, wide);
  return { img, wide: wide > narrow, p: n > 1 ? (span - img) / (n - 1) : 0, area };
}

function titleSpace(n, center = false) {
  if (center) { const w = D.geometry.page_w - 2 * D.geometry.margin; return { x: (w + D.geometry.gap) / 2, w: (w - D.geometry.gap) / 2 }; }
  const g = D.geometry, { img } = layout(n);
  let x = img + g.gap;
  if (img / 2 - g.circle / 2 - g.gap < g.title_h) x = img - 0.9 + g.circle + g.gap;
  return { x, w: g.page_w - 2 * g.margin - x };
}
const TITLE_EM = 0.7;   // widest share of the font size per title character
const titleSize = (title, width) => Math.min(21, (width - 15.8) / 25.4 * 72 / (TITLE_EM * Math.max(title.length, 1)));

function centres(n, center = false) {
  const { img, p, area } = layout(n, center);
  return Array.from({ length: n }, (_, k) => n === 1 ? area / 2 : Math.round((img / 2 + k * p) * 1000) / 1000);
}

// centre layout: one label size (pt) for the sheet, the largest at which every label fits its card, wrapped at spaces
const PT = 25.4 / 72;
const textWidth = (text, pt, sp = 0.079) => [...text].reduce((s, c) => s + (D.labelEm[c] || 0.868), 0) * pt * PT + sp * [...text].length;
function labelLines(label, pt, width, sp = 0.079) {
  let lines = 0, line = "";
  for (const word of label.split(/\s+/).filter(Boolean)) {
    if (textWidth(word, pt, sp) > width) return null;
    if (line && textWidth(`${line} ${word}`, pt, sp) <= width) line = `${line} ${word}`;
    else { line = word; lines++; }
  }
  return Math.max(lines, 1);
}
function centerTitleSize(title, width) {   // up to two lines at 21 pt, smaller only if that does not fit
  let pt = 21;
  while (pt > 9) { const n = labelLines(title, pt, width - 15.8, 0.265); if (n !== null && n <= 2) break; pt -= 0.5; }
  return pt;
}
function centerLabelSize(labels, img, times) {
  const g = D.geometry, cw = (g.page_w - 2 * g.margin - g.gap) / 2 - img;
  const room = img - 1.5 - g.circle - g.card_bottom - 1.5 - 0.8 - (times ? 7.3 : 0), width = cw - 4;
  let pt = g.label_range[1];
  while (pt > g.label_range[0]) {
    const lines = labels.map(l => labelLines(l, pt, width));
    if (!lines.includes(null) && Math.max(1, ...lines) * pt * PT * g.label_line <= room) break;
    pt -= 0.5;
  }
  return pt;
}

// the reader's locale when it matches the page language (en-GB: 19:30, en-US: 7:30 PM, sl: 19:30),
// else the language itself; tools/build.py clock_text() gives the same for sl and en
function clockText(time, lang) {
  const [h, m] = time.split(":").map(Number);
  const reader = navigator.language || "";
  const locale = reader.toLowerCase().startsWith(lang) ? reader : lang;
  try {
    return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2020, 0, 1, h, m));
  } catch (e) {
    return time;
  }
}

function sheetHtml(sheet, lang = "sl") {
  const n = sheet.steps.length, center = sheet.layout !== "sides", ys = centres(n, center);
  const rows = sheet.steps.map((step, k) => {
    const i = k + 1, side = i % 2 ? "left" : "right";
    const pic = themed(step.image, sheet.theme || ALL);
    // EDGES: [right edge, left edge]; centre layout: the card joins the picture's outer edge
    const bg = pic && EDGES[pic] ? EDGES[pic][(side === "left") === !center ? 0 : 1] : D.missingBg;
    const style = `--step: ${step.color}; --bg: ${bg}; --ink: ${labelColor(step.color, bg)};`;
    const picture = pic ? `<img src="../images/${esc(pic)}.jpg" alt="${esc(step.label)}" />` : '<div class="rt-missing">?</div>';
    const clock = sheet.times === false ? "" : step.time ? `<div class="rt-time">${esc(clockText(step.time, lang))}</div>`
      : '<div class="rt-time"><span class="blank"></span>:<span class="blank"></span></div>';
    return `
      <div class="rt-pic pic-${side}" style="${style} --y: ${ys[k]}mm;">
        ${picture}
        <div class="rt-num">${i}</div>
      </div>
      <div class="rt-card card-${side}" style="${style} --y: ${ys[k]}mm;">
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
  const noteIds = [...new Set(sheet.steps.map(st => st.image))].filter(i => D.stepNotes[i]);
  const notes = noteIds.length ? `<span class="rt-notes">${esc(noteIds.map(i => D.stepNotes[i][lang] || D.stepNotes[i].en).join(" "))}</span>` : "";
  const { img, wide } = layout(n, center);
  const ts = titleSpace(n, center);
  let size = ` --img: ${img}mm; --title-x: ${ts.x}mm; --title-size: ${(center ? centerTitleSize : titleSize)(sheet.title, ts.w).toFixed(2)}pt;`;
  if (wide) {   // label and time grow with the picture (+30 % at the largest), as in tools/build.py
    const k = 1 + 0.3 * (img - D.geometry.img) / (D.geometry.wide_max - D.geometry.img);
    size += ` --label: ${(13 * k).toFixed(1)}pt; --time: ${(15 * k).toFixed(1)}pt;`;
  }
  if (center) size += ` --label: ${centerLabelSize(sheet.steps.map(st => st.label), img, sheet.times !== false)}pt;`;
  return `
  <div class="page-a4 rt-page${wide ? " rt-wide" : ""}${center ? " rt-center" : ""}" style="background: ${background};${size}">${starry}
    <div class="rt-grid">
      <div class="rt-header"><div class="rt-title">${esc(sheet.title)}</div></div>${rows}
    </div>
    <div class="rt-footer${sheet.sky === "night" ? " on-dark" : ""}"><span class="rt-license"><img class="rt-under3" src="under3.jpg" alt="${esc(D.under3[lang] || D.under3.en)}"><span class="rt-legal"><span class="rt-safety">${esc(D.safety[lang] || D.safety.en)}</span>${notes}</span></span><span class="rt-source"><span class="rt-site">${esc(D.site)}</span><span class="rt-mail">${esc(D.mail)}</span><span class="rt-lic">${esc(D.license[lang] || D.license.en)}</span></span>${D.qr}</div>
  </div>`;
}

// ---------- state: one sheet, always MAX_STEPS rows; empty rows are left off the sheet ----------

const newStep = () => ({ label: "", mins: "", image: "auto" });
// generous minutes per picture for a young child, used while the parent types none; a step without a picture takes 5
const MINUTES = { "good-morning": 5, "make-bed": 5, toilet: 5, "wash-hands": 2, "wash-face": 5, "brush-teeth": 5, "brush-hair": 5,
  "getting-dressed": 10, "put-on-shoes": 5, kindergarten: 10, breakfast: 20, dinner: 30, "set-table": 5, "clear-table": 10,
  "tidy-toys": 10, cartoon: 20, bath: 20, care: 10, pajamas: 10, story: 15, hug: 5, sleep: 5 };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const fromMin = m => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const okMins = v => Number.isInteger(v) && v >= 1 && v <= 240 ? v : "";
// times of the day (example routines, older links and storage) become durations: each the gap to the step before;
// the first step keeps its default, the start comes before it and the last time is the wished end.
// Steps whose time was not after the one before (gap 0 or over 4 h: out of order) and steps without a time get their default, listed in
// "unordered" and "untimed" for the status line
function fromTimes(steps) {
  const timed = steps.filter(st => st.label && HHMM.test(st.time || ""));
  if (!timed.length) return { start: "", end: "", steps: steps.map(st => ({ ...st, mins: okMins(st.mins) })), unordered: [], untimed: [] };
  let prev = null;
  const unordered = [], untimed = [];
  const out = steps.map(st => {
    if (!timed.includes(st)) { if (st.label) untimed.push(st.label); return { ...st, mins: "" }; }
    const m = prev === null ? "" : okMins(toMin(st.time) - prev); prev = toMin(st.time);
    if (m === "" && st !== timed[0]) unordered.push(st.label);
    return { ...st, mins: m };
  });
  const first = out[steps.indexOf(timed[0])];
  return { start: fromMin(toMin(timed[0].time) - minutesOf(first)), end: fromMin(Math.max(...timed.map(st => toMin(st.time)))), steps: out, unordered, untimed };
}
const EXAMPLE_FOR = { dawn: 0, afternoon: 1, night: 2 };   // sheet of the example routine per type
// titles are plain text; older stored titles and the example may start with an icon, which is dropped
const bare = s => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();
// titles and labels keep only letters of any alphabet (with č š ž), digits and the space (maintainer's decision):
// no punctuation, control, invisible or direction-changing characters, no symbols; the same in a link, in storage and while typing
const tidy = s => s.replace(/[^\p{L}\p{M}\p{N} ]/gu, "");
const typedText = e => { const v = tidy(e.target.value); if (v !== e.target.value) e.target.value = v; return v; };
// examples follow good habits (routines/sl/primer.json, routines/en/example.json), in the page language
const EXAMPLE_IN = { sl: "sl-primer", en: "en-example" };
const example = (sky, lang = (typeof state !== "undefined" && state.lang) || "sl") => D.examples[EXAMPLE_IN[lang] || "sl-primer"].sheets[EXAMPLE_FOR[sky] || 0];
const pad = steps => steps.concat(Array.from({ length: MAX_STEPS }, newStep)).slice(0, MAX_STEPS);

const exampleTimes = ex => fromTimes(ex.steps.map(st => ({ label: st.label, time: st.time || "", image: "auto" })));
const exampleSteps = ex => pad(exampleTimes(ex).steps.map(({ time, ...st }) => st));
function fromExample(lang, sky = "night", base = {}) {   // the evening routine opens first
  const ex = example(sky, lang);
  return { lang, background: base.background || "gradient", times: base.times === true, theme: base.theme || "bear", layout: base.layout || "center",
           sheet: { title: bare(ex.title), sky, start: exampleTimes(ex).start, end: exampleTimes(ex).end, steps: exampleSteps(ex) } };
}
// loading an example would lose what the parent typed: rows with content that are not just an example (any language or type)
const rowsKey = steps => JSON.stringify(steps.map(s => [s.label.trim(), s.mins, s.image]));
const EXAMPLE_ROWS = new Set(Object.values(EXAMPLE_IN).flatMap(name => D.examples[name].sheets.map(ex => rowsKey(exampleSteps(ex)))));
// after an example replaced typed rows, "Undo" brings them back until the next edit or 10 s
let undoTimer;
function hideUndo() { clearTimeout(undoTimer); const u = document.getElementById("undo"); if (u) u.replaceChildren(); }
function showUndo(prev, message = t().replaced) {
  const L = t(), u = document.getElementById("undo");
  u.replaceChildren(message + " ", el("button", { onclick: () => { state = prev; update(true); document.getElementById("announce").textContent = L.undone; } }, [el("img", { class: "icon", src: "undo.svg", alt: "" }), L.undo]));
  document.getElementById("announce").textContent = `${message} ${L.undo}?`;
  undoTimer = setTimeout(hideUndo, 10000);
}
const typed = sheet => sheet.steps.some(s => s.label.trim() || s.mins || s.image !== "auto") && !EXAMPLE_ROWS.has(rowsKey(sheet.steps));
// Stored state is untrusted: anything else ever served from this origin shares its storage.
// Keep only known values, so nothing from storage reaches the markup unchecked.
// only a table's own keys count: "constructor" or "__proto__" exist on every object and would pass a plain lookup
const own = (table, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(table, key);
function clean(s) {
  if (!s || typeof s !== "object") return null;
  const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max);
  const step = st => ({
    label: tidy(str(st && st.label, 40)),
    time: HHMM.test(st && st.time) ? st.time : "",   // older versions kept times of the day, fromTimes() turns them into durations
    mins: okMins(st && st.mins),
    // a step keeps the picture as chosen, a variant too: an image group other than "all" swaps it (themed())
    image: st && st.image === "none" ? "none" : st && own(D.images, st.image) ? st.image : "auto",
  });
  const sh = s.sheet || (Array.isArray(s.sheets) && s.sheets[0]);   // older versions kept several sheets
  if (!sh) return null;
  const steps = (Array.isArray(sh.steps) ? sh.steps : []).slice(0, MAX_STEPS).map(step);
  const old = steps.some(st => st.time) ? fromTimes(steps) : null;
  const sheet = { title: bare(tidy(str(sh.title, 60))), sky: own(D.skies, sh.sky) ? sh.sky : "night",
                  start: old ? old.start : HHMM.test(sh.start) ? sh.start : "", end: old ? old.end : HHMM.test(sh.end) ? sh.end : "",
                  steps: pad((old ? old.steps : steps).map(({ time, ...st }) => st)) };
  return { lang: own(T, s.lang) ? s.lang : "sl", background: ["gradient", "white", "none"].includes(s.background) ? s.background : "gradient",
           times: s.times === true, theme: [ALL, ...D.themes].includes(s.theme) ? s.theme : "bear", layout: s.layout === "sides" ? "sides" : "center", sheet,
           _old: old && { unordered: old.unordered, untimed: old.untimed } };   // shown in the status line until the first change
}
// first visit: the first of the browser's languages the page has (navigator.languages), else English
function browserLang() {
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const l of langs) { const code = String(l).toLowerCase().slice(0, 2); if (own(T, code)) return code; }
  return "en";
}
// ---------- share link: the sheet in the URL fragment (never sent to a server), base64url of compact JSON ----------
// {l: language, b: background, t: 0 when the time is off, p: picture theme, y: picture layout, s: sky, h: title, a: start, e: wished end,
// r: [[label, minutes, image], ...]} (older links: [label, time of day, image]);
// trailing empty rows and image "auto" are left out. Base64 is not encryption.
function encodeSheet(st) {
  const r = st.sheet.steps.map(x => [x.label, x.mins, x.image === "auto" ? "" : x.image]);
  while (r.length && !r[r.length - 1][0] && !r[r.length - 1][1] && !r[r.length - 1][2]) r.pop();
  const json = JSON.stringify({ l: st.lang, b: st.background, t: st.times ? 1 : 0, p: st.theme, y: st.layout, s: st.sheet.sky, h: st.sheet.title, a: st.sheet.start, e: st.sheet.end, r });
  let bin = ""; for (const b of new TextEncoder().encode(json)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
// the same checks as stored state (clean()); anything broken gives null
function decodeSheet(data) {
  try {
    if (data.length > 2000 || !/^[A-Za-z0-9_-]+$/.test(data)) return null;   // a real link is ~400 characters
    const bin = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    const j = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    if (!j || typeof j !== "object" || !Array.isArray(j.r)) return null;
    return clean({ lang: j.l, background: j.b, times: j.t !== 0, theme: j.p, layout: j.y,
      sheet: { title: j.h, sky: j.s, start: j.a, end: j.e, steps: j.r.slice(0, MAX_STEPS).map(x => Array.isArray(x)
        ? { label: x[0], [typeof x[1] === "string" ? "time" : "mins"]: x[1], image: x[2] || "auto" } : {}) } });
  } catch (e) { return null; }
}
const linkData = () => decodeSheet(location.hash.slice(1));
const shareUrl = () => `${location.href.split("#")[0]}#${encodeSheet(state)}`;
function load() {
  try { const s = clean(JSON.parse(localStorage.getItem(STORE))); if (s) return s; } catch (e) { /* no or bad storage */ }
  return fromExample(browserLang());
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state, (k, v) => (k.startsWith("_") ? undefined : v))); } catch (e) { /* no storage */ }
  try { history.replaceState(null, "", shareUrl()); } catch (e) { /* no history */ }   // the address bar is the link to this sheet
}

let state = linkData() || load();   // a valid link wins over the saved sheet; a broken one is ignored
const fromLink = !!linkData();
let oldKey = state._old ? encodeSheet(state) : null;   // the converted sheet; the note goes once the parent changes it
const t = () => T[state.lang] || T.sl;
const filled = () => state.sheet.steps.filter(st => st.label.trim());
// a row's number on the sheet: empty rows are left off, so they have none and do not count
const place = k => state.sheet.steps[k].label.trim() ? state.sheet.steps.slice(0, k + 1).filter(st => st.label.trim()).length : "";

// resolved step for drawing: uppercase label, chosen or matched image, palette color by type and position
function imageOf(step) {
  return step.image === "auto" ? (match(step.label) || {}).id || null : step.image === "none" ? null : step.image;
}
function minutesOf(step) {
  const id = imageOf(step);
  return step.mins || (id && MINUTES[D.images[id].variant_of || id]) || 5;
}
// the time each filled step should be done by: start plus the durations up to and including it
function schedule() {
  const at = new Map(), start = state.sheet.start;
  let m = HHMM.test(start) ? toMin(start) : null;
  for (const st of filled()) if (m !== null) { m += minutesOf(st); at.set(st, fromMin(m)); }
  return { at, end: m };
}
function resolve(step, k, at = schedule().at) {
  const m = match(step.label);
  const image = imageOf(step);
  return { label: step.label.toLocaleUpperCase(state.lang), time: at.get(step) || "", image, match: m,
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
// ---------- hints ----------
// One popup for every control with a hint: after a pause on hover, at once on keyboard focus, never on a tap (the tap acts).
// It stays while the pointer is on it, Escape closes it, and × hides that hint for good (WCAG 2.2, 1.4.13); a screen reader
// gets the same text through aria-describedby.
const TIPS_OFF = "child-routines-tips-off";
const tipsOff = new Set((() => { try { return JSON.parse(localStorage.getItem(TIPS_OFF)) || []; } catch (e) { return []; } })());
const tipText = (key, L = t()) => key === "print" ? L.printHint : key === "link" ? L.linkHint : key === "move" ? L.moveHint : L.tips[key];
function tip(control, key) {
  const target = control.matches("label") ? control.querySelector("input") : control;
  target.dataset.tip = key;
  if (!tipsOff.has(key)) target.setAttribute("aria-description", [].concat(tipText(key)).join(" "));
  return control;
}
const tipBox = el("div", { class: "pop", role: "tooltip", hidden: true });
document.body.append(tipBox);
let tipFor = null, tipTimer = 0;
function hideTip() { clearTimeout(tipTimer); tipBox.hidden = true; tipFor = null; }
function showTip(target) {
  const key = target.dataset.tip, text = tipText(key);
  if (tipsOff.has(key) || !text) return;
  const off = el("button", { class: "tip-off", "aria-label": t().tipOff, title: t().tipOff, onclick: () => {
    tipsOff.add(key); try { localStorage.setItem(TIPS_OFF, JSON.stringify([...tipsOff])); } catch (e) { /* no storage */ }
    document.querySelectorAll(`[data-tip="${key}"]`).forEach(c => c.removeAttribute("aria-description"));
    hideTip(); target.focus();
  } }, "×");
  tipBox.replaceChildren(off, ...(Array.isArray(text) ? [el("p", {}, text[0]), el("ul", {}, text.slice(1).map(t => el("li", {}, t)))] : [el("p", {}, text)]));
  tipBox.hidden = false; tipFor = target;
  // above the control if it fits, else below; kept inside the window
  const r = target.getBoundingClientRect(), b = tipBox.getBoundingClientRect();
  tipBox.style.left = `${Math.max(8, Math.min(r.left, innerWidth - b.width - 8))}px`;
  tipBox.style.top = `${r.top - b.height - 8 >= 8 ? r.top - b.height - 8 : r.bottom + 8}px`;
}
const tipTarget = e => e.target.closest && e.target.closest("[data-tip]");
addEventListener("pointerover", e => {
  if (e.pointerType !== "mouse" || tipBox.contains(e.target)) { if (tipBox.contains(e.target)) clearTimeout(tipTimer); return; }
  const t = tipTarget(e); clearTimeout(tipTimer);
  if (t && t !== tipFor) tipTimer = setTimeout(() => showTip(t), 700);
  else if (!t && tipFor) tipTimer = setTimeout(hideTip, 300);
});
addEventListener("pointerdown", e => { if (!tipBox.contains(e.target)) hideTip(); }, true);
addEventListener("focusin", e => { const t = tipTarget(e); if (t && !("pointer" in document.documentElement.dataset)) showTip(t); else if (!tipBox.contains(e.target)) hideTip(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !tipBox.hidden) hideTip(); });
addEventListener("scroll", hideTip, true);

// a text field, not the browser's time picker: that one shows AM/PM to a reader whose browser is in English, whatever
// the page language. It takes 7:30, 19.30, 1930 and, in English, 7:30 PM; leaving the field shows the sheet's form
function timeInput(get, set, attrs) {
  const shown = t => t ? clockText(t, state.lang) : "";
  const parse = v => {
    const m = v.trim().toLowerCase().match(/^(\d{1,2})(?:[:.,\s]?(\d{2}))?\s*([ap])?\.?m?\.?$/);
    if (!m) return null;
    let h = +m[1]; const min = +(m[2] || 0);
    if (m[3]) { if (h < 1 || h > 12) return null; h = h % 12 + (m[3] === "p" ? 12 : 0); }
    return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` : null;
  };
  return el("input", { value: shown(get()), class: "clock", type: "text", maxlength: "8",
    placeholder: state.lang === "en" ? "7:30 PM" : "19:30", autocomplete: "off", ...attrs,
    oninput: e => {
      const t = e.target.value.trim() ? parse(e.target.value) : "";
      e.target.toggleAttribute("aria-invalid", t === null);
      if (t !== null) { set(t); update(); }
    },
    onchange: e => { if (parse(e.target.value)) e.target.value = shown(get()); } });
}
// minutes a step takes: 10, +10, 10 min; empty takes the picture's default, shown grey. The time it should be done by sits beside it
function minutesInput(step, k) {
  const shown = v => v ? `+${v}` : "";
  const input = el("input", { value: shown(step.mins), "aria-labelledby": `col-time n-${k}`, "aria-describedby": `at-${k}`, class: "time",
    type: "text", inputmode: "numeric", maxlength: "7", autocomplete: "off",
    oninput: e => {
      const v = e.target.value.trim(), m = v.match(/^\+?\s*(\d{1,3})\s*(m|min)?$/i), n = m && okMins(+m[1]);
      e.target.toggleAttribute("aria-invalid", !!v && !n);
      if (!v || n) { step.mins = v ? n : ""; update(); }
    },
    onchange: e => { if (!e.target.hasAttribute("aria-invalid")) e.target.value = shown(step.mins); } });
  step._mins = input;
  return el("span", { class: "dur" }, [input, step._at = el("span", { class: "at", id: `at-${k}` })]);
}

function select(label, value, options, onchange) {
  // autocomplete off: the browser must not restore an earlier choice over the state (a link, an example, Undo)
  const s = el("select", { "aria-label": label, autocomplete: "off", onchange: e => onchange(e.target.value) },
    Object.entries(options).map(([v, text]) => el("option", { value: v }, text)));
  s.value = value;
  return s;
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
  steps.splice(to, 0, steps.splice(from, 1)[0]);   // the duration moves with the step
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
  document.querySelectorAll(".thumb").forEach(b => b.setAttribute("aria-expanded", "false"));
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
    else if (picked === k) { picked = null; rows[k].classList.remove("picked"); grip.removeAttribute("aria-pressed"); }
    else moveStep(picked, k);
  };
  grip.addEventListener("pointerup", end, { signal: ac.signal });
  grip.addEventListener("pointercancel", end, { signal: ac.signal });
}

// copy the link; where the clipboard is not allowed, show it in a field, selected
// the system share sheet (SMS, e-mail, copy …) where the browser has one (phones, Safari, Chrome on most desktops);
// elsewhere (Firefox on a computer) the link is copied, or shown selected if the clipboard is blocked
function copyLink() {
  // copied: a screen reader hears it, and the button itself says so for two seconds with a short flash
  const url = shareUrl(), L = t(), say = () => {
    document.getElementById("announce").textContent = L.copied;
    const btn = document.querySelector("#actionbar .copy"), label = [...btn.childNodes];
    btn.replaceChildren(`✓ ${L.copied.replace(/\.$/, "")}`); btn.classList.add("done");
    setTimeout(() => { btn.replaceChildren(...label); btn.classList.remove("done"); }, 2000);
  };
  const show = () => { const b = document.getElementById("linkbox"); b.hidden = false; b.value = url; b.focus(); b.select(); };
  const copy = () => { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(say, show); else show(); };
  if (navigator.canShare && navigator.canShare({ url }))
    navigator.share({ title: state.sheet.title || L.heading, url }).catch(e => { if (e.name !== "AbortError") copy(); });
  else copy();
}

// What to watch for and Quick start fold, open at first (the maintainer's decision); a parent's choice lasts while the page is open
const detailsOpen = { watch: true, how: true };
// a link that opens in a new tab: an external-link sign, and a screen reader hears that it opens a new tab
const extLink = (href, text) => el("a", { href, target: "_blank", rel: "noopener", class: "ext" },
  [text, el("img", { class: "icon", src: "external.svg", alt: "" }), el("span", { class: "sr-only" }, ` ${t().newTab}`)]);

const details = (id, title, body) => {
  // the content sits in a framed box; opening and closing slide (none when the parent asks for less motion)
  const inner = el("div", { class: "fold-body" }, body);
  const summary = el("summary", { "data-hide": t().hide, "data-show": t().show }, title);
  const d = el("details", { id, class: id === "watch" ? "warn" : "how-box" }, [summary, inner]);
  d.open = detailsOpen[id];
  summary.addEventListener("click", e => {
    e.preventDefault();
    const open = !d.open;
    detailsOpen[id] = open;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { d.open = open; return; }
    d.open = true;
    const h = inner.scrollHeight + "px";
    inner.style.overflow = "hidden";
    const anim = inner.animate(open ? [{ height: "0px", opacity: 0 }, { height: h, opacity: 1 }] : [{ height: h, opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 220, easing: "ease-in-out" });
    anim.onfinish = () => { inner.style.overflow = ""; d.open = open; };
  });
  return d;
};

function renderEditor() {
  const L = t(), root = document.getElementById("maker"), sheet = state.sheet;
  document.documentElement.lang = state.lang;
  document.title = L.heading;
  document.getElementById("skip").textContent = L.skip;
  document.getElementById("preview").setAttribute("aria-label", L.previewName);
  const times = el("input", { type: "checkbox", autocomplete: "off", onchange: e => { state.times = e.target.checked; update(true); } });
  times.checked = state.times;
  // a title still equal to an example title follows the type; a title the parent typed stays
  const setType = v => {
    const auto = Object.keys(EXAMPLE_FOR).some(k => bare(example(k).title) === sheet.title) || !sheet.title.trim();
    sheet.sky = v; if (auto) sheet.title = bare(example(v).title); update(true);
  };
  root.replaceChildren(
    el("header", { class: "row-top" }, [
      el("h1", { class: "grow" }, [el("img", { class: "logo", src: "icon.svg", alt: "" }), L.heading]),
      // each language in its own name, labelled with a globe (W3C: language selection), no flags
      el("label", { class: "lang" }, [el("span", { class: "globe", "aria-hidden": "true" }, "🌐"),
        langSelect(L.language)])]),
    // the maintainer's order: About (the project link at its end), what to watch for (with the danger sign, the guide link at its end),
    // Quick start, then the form
    el("h2", {}, L.aboutTitle), el("p", { class: "about" }, L.about), el("p", { class: "more" }, [extLink(PROJECT, L.project), ` · ${L.madeBy} `, extLink(MAKER, "twotech.si")]),
    details("watch", [el("span", { class: "danger", "aria-hidden": "true" }, "⚠"), L.watchTitle], el("div", {}, [
      el("ul", {}, L.watch.map(([what, text]) => el("li", {}, [el("strong", {}, `${what}: `), text]))),
      el("p", { class: "more" }, extLink(GUIDE[state.lang] || GUIDE.en, L.guide))])),
    details("how", L.howTitle, el("ol", { class: "how" }, L.how.map(s => el("li", {}, s)))),
    // every field has a visible label (WCAG 2.2, 3.3.2); a placeholder disappears once the parent types
    el("div", { class: "row-top fields" }, [
      field(L.type, tip(select(L.type, sheet.sky, L.skies, setType), "type")),
      field(L.sheetTitle, tip(el("input", { class: "title", value: sheet.title, autocapitalize: "characters",
        oninput: e => { sheet.title = typedText(e); update(); } }), "sheetTitle"), "grow")]),
    el("div", { class: "row-top fields" }, [
      field(L.layout, tip(select(L.layout, state.layout, L.layouts, v => { state.layout = v; update(true); }), "layout")),
      field(L.background, tip(select(L.background, state.background, L.backgrounds, v => { state.background = v; update(true); }), "background")),
      ...(THEMED ? [field(L.pictures, tip(select(L.pictures, state.theme, L.themes, v => { state.theme = v; sheet.steps.forEach(st => st._gallery()); update(); }), "pictures"))] : []),
      tip(el("label", { class: "grow check" }, [times, L.times]), "times"),
      tip(el("button", { class: "secondary", onclick: () => {
        const prev = typed(sheet) && JSON.parse(JSON.stringify(state, (k, v) => (k.startsWith("_") ? undefined : v)));
        state = fromExample(state.lang, sheet.sky, state); update(true);
        if (prev) showUndo(prev);
      } }, `${L.example}: ${L.skies[sheet.sky]}`), "example")]),
    // start, wished end and what is left or missing; only with times on the sheet
    ...(state.times ? [el("div", { class: "row-top fields" }, [
      field(L.start, tip(timeInput(() => sheet.start, v => { sheet.start = v; }, { placeholder: "" }), "start")),
      field(L.end, tip(timeInput(() => sheet.end, v => { sheet.end = v; }, { placeholder: "" }), "end")),
    ])] : []),
    // the undo notice has its own line between the controls and the steps (example loaded, step removed)
    el("div", { id: "undo", class: "undo" }));

  // column headings label the rows: a screen reader reads a field as "Step 3"
  const box = el("div", { class: state.times ? "sheet-box" : "sheet-box no-times" }, el("div", { class: "step step-head", "aria-hidden": "true" }, [
    el("span"), el("span"), el("span", { id: "col-label" }, L.label), el("span", { id: "col-time", class: "col-time" }, L.time),
    el("span", { id: "col-pic" }, L.picture), el("span")]));
  const rows = [];
  sheet.steps.forEach((step, k) => {
    const gallery = el("div", { class: "gallery", hidden: true });
    const thumb = tip(el("button", { class: "thumb", "aria-label": `${L.pick} ${k + 1}`, "aria-expanded": "false" }), "pick");
    const openGallery = open => { gallery.hidden = !open; thumb.setAttribute("aria-expanded", String(open)); };
    thumb.addEventListener("click", () => openGallery(gallery.hidden));
    // Escape closes the gallery and gives focus back to the thumbnail (WCAG 2.1.1, 2.4.3)
    const onEscape = e => { if (e.key === "Escape" && !gallery.hidden) { e.preventDefault(); openGallery(false); thumb.focus(); } };
    gallery.addEventListener("keydown", onEscape); thumb.addEventListener("keydown", onEscape);
    // a picture chosen on an empty row brings its default label (images/<id>.json "label")
    const choose = v => {
      step.image = v; openGallery(false);
      const label = D.images[v] && D.images[v].label;
      if (!step.label.trim() && label) { step.label = label[state.lang] || label.sl || ""; update(true); } else update();
    };
    // filled in place, also when the image group changes: an open gallery stays open, focus and scroll stay
    const fillGallery = () => gallery.replaceChildren(
      el("div", { class: "gallery-top" }, el("button", { class: "gallery-close", "aria-label": L.closePick, title: L.closePick,
        onclick: () => { openGallery(false); thumb.focus(); } }, "×")),
      el("button", { onclick: () => choose("auto") }, `🔄 ${L.auto}`),
      ...Object.entries(D.images).filter(([, img]) => state.theme === ALL || !img.variant_of).map(([id, img]) =>
        el("button", { title: img.title, "aria-label": (img.label && (img.label[state.lang] || img.label.sl)) || img.title, onclick: () => choose(id) },
          el("img", { src: `../images/${themed(id, state.theme)}.jpg`, alt: "", loading: "lazy" }))),
      el("button", { onclick: () => choose("none") }, `∅ ${L.none}`));
    fillGallery();
    const grip = el("button", { class: "grip", "data-tip": "move", "aria-label": `${L.move} ${k + 1}`, "aria-describedby": "move-desc", "aria-keyshortcuts": "Alt+ArrowUp Alt+ArrowDown",
      "aria-pressed": picked === k ? "true" : null,   // only in the tap-tap mode; a keyboard user never sees a toggle
      onpointerdown: e => dragRow(e, k, rows), onclick: e => e.preventDefault(),
      onkeydown: e => {
        const to = k + (e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0);
        if (to !== k && to >= 0 && to < MAX_STEPS) { e.preventDefault(); moveStep(k, to); }
      } }, el("span", { class: "dots", "aria-hidden": "true" }));
    const row = el("div", { class: picked === k ? "step picked" : "step" }, [
      el("span", { class: "n", id: `n-${k}` }, `${place(k)}`), grip,
      step._input = tip(el("input", { value: step.label, placeholder: k === 0 ? L.labelHint : "", maxlength: "24", "aria-labelledby": `col-label n-${k}`, autocapitalize: "characters",
        oninput: e => { step.label = typedText(e); update(); } }), "label"),
      ...(state.times ? [tip(minutesInput(step, k), "time")] : []),
      thumb,
      tip(el("button", { class: "del", "aria-label": L.removeStep,
        onclick: () => {
          const had = step.label.trim(), prev = had && JSON.parse(JSON.stringify(state, (key, v) => (key.startsWith("_") ? undefined : v)));
          sheet.steps.splice(k, 1); sheet.steps.push(newStep()); update(true);
          if (prev) showUndo(prev, L.stepRemoved);
          rowInput(k).focus();   // the row now at this place (WCAG 2.4.3)
        } }, broom()), "del")]);
    rows.push(row);
    step._hint = el("div", { class: "row-hint", id: `hint-${k}`, hidden: true }, L.tooLong);
    box.append(row, step._hint, gallery);
    step._thumb = thumb;
    step._gallery = fillGallery;
  });
  // warnings sit above the steps, where the parent looks; the green "all fine" stays below them
  // the status sits between the form fields and the steps: warnings, then the green "all fine" with the time left or missing
  root.append(el("div", { id: "warnings", class: "warnings", role: "status", hidden: true }),
    el("div", { id: "all-fine", class: "warnings ok", role: "status", hidden: true }), box,
    el("span", { id: "move-desc", class: "sr-only" }, L.moveDesc),
    // Share link and Print stay in view at the bottom of the form (sticky), the sheet keeps the whole preview height
    el("div", { class: "actionbar", id: "actionbar" }, [
      tip(el("button", { class: "copy", onclick: copyLink }, [el("img", { class: "icon", src: "share.svg", alt: "" }), L.copy]), "link"),
      tip(el("button", { class: "print", onclick: () => window.print() }, L.print), "print"),
      el("input", { id: "linkbox", class: "linkbox", readonly: "", hidden: "", "aria-label": L.copy })]));
}

const rowInput = k => document.querySelectorAll("#maker .sheet-box .step:not(.step-head)")[k].querySelector("input:not(.time)");
// each row's default minutes and done-by time, and the start, end and what is left or missing
function refreshTimes() {
  const { at } = schedule();
  state.sheet.steps.forEach(st => {
    if (!st._mins) return;
    st._mins.placeholder = st.label.trim() ? `+${minutesOf(st)}` : "";
    st._at.textContent = at.get(st) ? clockText(at.get(st), state.lang) : "";
  });
}
// "Ends at 18:45: −15 min over" for the status line, with the minutes left (negative: missing); none with times off or no start
function budget() {
  const L = t(), { end } = schedule(), wished = state.sheet.end;
  if (!state.times || end === null || !filled().length) return null;
  let d = HHMM.test(wished) ? ((toMin(wished) - end) % 1440 + 1440) % 1440 : null;
  if (d !== null && d > 720) d -= 1440;
  return { d, text: L.endsAt(clockText(fromMin(end), state.lang)) + (d === null ? "." : `: ${d < 0 ? L.over(-d) : L.spare(d)}.`) };
}

// the last input decides the select's focus ring: none after the mouse or a touch, back with the keyboard (index.html)
addEventListener("pointerdown", () => { document.documentElement.dataset.pointer = ""; }, true);
addEventListener("keydown", () => { delete document.documentElement.dataset.pointer; }, true);

// skip link: focus the first form field; no hash, the fragment carries the sheet
document.getElementById("skip").addEventListener("click", e => { e.preventDefault(); document.querySelector("#maker .row-top.fields select").focus(); });

// refresh each row's picture in place, so typing keeps focus; an empty row shows no picture
function refreshSteps() {
  state.sheet.steps.forEach((step, k) => {
    if (!step._thumb) return;
    const n = document.getElementById(`n-${k}`);
    if (n) n.textContent = place(k);
    const empty = !step.label.trim(), r = resolve(step, k);
    step._thumb.classList.toggle("missing", !empty && !r.image && step.image !== "none");
    step._thumb.classList.toggle("empty", empty);
    step._thumb.replaceChildren(!empty && r.image ? el("img", { src: `../images/${themed(r.image, state.theme)}.jpg`, alt: "" }) : empty ? "+" : "?");
  });
}

// ---------- preview and warnings ----------

// .rt-text grows with its label, so its own width says nothing; the room is frame minus circle
function labelRoom(lab) {
  const card = lab.closest(".rt-card"), cs = getComputedStyle(card);
  if (cs.flexDirection === "column") return card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);   // centre: circle below
  return card.clientWidth - card.querySelector(".rt-check").offsetWidth
    - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.columnGap || 0);
}

function renderPreview() {
  const L = t(), s = state.sheet, steps = filled(), { at } = schedule();
  const sky = state.background === "gradient" ? s.sky : state.background;
  document.getElementById("sheets").innerHTML = sheetHtml({ title: s.title.toLocaleUpperCase(state.lang), sky, times: state.times, theme: state.theme, layout: state.layout, steps: steps.map((st, k) => resolve(st, k, at)) }, state.lang);

  const warnings = [];
  steps.forEach((st, k) => {
    if (st.image === "auto" && !match(st.label)) warnings.push(L.warnNoMatch(`${L.step} ${k + 1}`, st.label));
    // a hand-picked picture whose own keywords miss the label (pictures without keywords are not judged)
    const kw = D.images[st.image] && Object.values(D.images[st.image].keywords || {}).flat();
    if (kw && kw.length && !match(st.label, st.image)) warnings.push(L.warnMismatch(`${L.step} ${k + 1}`, st.label));
  });
  // labels do not wrap: compare each with the frame width left beside the magnet circle (AGENTS.md)
  // the row itself is marked (aria-invalid, hint); the list repeats it for sighted users only, so it is not read out twice
  const longs = new Set();
  state.sheet.steps.forEach(st => { if (st._input) { st._input.removeAttribute("aria-invalid"); st._input.removeAttribute("aria-describedby"); st._hint.hidden = true; } });
  document.querySelectorAll("#sheets .rt-label").forEach((lab, k) => {
    if (lab.scrollWidth <= labelRoom(lab)) return;
    warnings.push(L.warnLong(`${L.step} ${k + 1}`, lab.textContent)); longs.add(warnings.length - 1);
    const st = steps[k];
    if (st && st._input) { st._input.setAttribute("aria-invalid", "true"); st._input.setAttribute("aria-describedby", st._hint.id); st._hint.hidden = false; }
  });
  const box = document.getElementById("warnings"), fine = document.getElementById("all-fine");
  const b = budget(), over = b && b.d !== null && b.d < 0;
  box.hidden = !warnings.length; fine.hidden = !!warnings.length && !b;
  box.replaceChildren(...(warnings.length
    ? [el("strong", { "aria-hidden": longs.size === warnings.length ? "true" : null }, L.warnTitle),
       el("ul", {}, warnings.map((w, i) => el("li", { "aria-hidden": longs.has(i) ? "true" : null }, w))),
       el("a", { href: CONTRIBUTE, target: "_blank", rel: "noopener" }, L.suggest)]
    : []));
  const old = state._old && oldKey === encodeSheet(state) ? state._old : null, odd = old && (old.unordered.length || old.untimed.length);
  if (old) fine.hidden = false;
  fine.replaceChildren(...(warnings.length ? [] : [el("div", {}, L.ok)]),
    ...(old ? [el("div", { class: odd ? "over" : null }, L.converted(old.unordered.join(", "), old.untimed.join(", ")))] : []),
    ...(b ? [el("div", { class: over ? "over" : null }, `${over ? "⚠" : "✓"} ${b.text}`)] : []));   // ✓ like the line above; ⚠ when over
}

function update(structure = false) {
  hideUndo();
  if (structure) renderEditor();
  refreshSteps();
  refreshTimes();
  renderPreview();
  save();
}

// the A4 sheet shrinks to its column: by width on a narrow screen, by width and height side by side,
// so the whole sheet is in view without scrolling; printing uses @media print (zoom 1)
function fitPreview() {
  const a4w = 794, a4h = 1123, preview = document.getElementById("preview");
  const sheets = document.getElementById("sheets");
  let zoom = (preview.clientWidth - 8) / a4w;
  // side by side the sheet fits the column's height too, 2 px spare,
  // rounded down so it never overflows by a pixel (the scroll bar stays only as a fallback).
  // The room is the column's max-height (100vh - 32px), not its height: that follows the zoomed sheet,
  // so a sheet once shrunk would never grow back when the window gets taller.
  if (matchMedia("(min-width: 1100px)").matches) {
    const room = parseFloat(getComputedStyle(preview).maxHeight) || preview.clientHeight;
    sheets.style.zoom = Math.floor(Math.min(zoom, (room - 2) / a4h) * 1000) / 1000;
    return;
  }
  zoom = Math.floor(zoom * 1000) / 1000;
  document.getElementById("sheets").style.zoom = zoom < 1 ? zoom : "";
}
window.addEventListener("resize", fitPreview);

document.head.append(el("style", {}, D.css));
{
  const prev = fromLink ? load() : null;   // what was saved, to bring back with Undo if the link replaces typed rows
  update(true);
  if (prev && typed(prev.sheet) && rowsKey(prev.sheet.steps) !== rowsKey(state.sheet.steps)) showUndo(prev, t().linkReplaced);
}
window.addEventListener("hashchange", () => {   // a link pasted into this tab
  const s = linkData();
  if (s && encodeSheet(s) !== encodeSheet(state)) { const prev = typed(state.sheet) && state; state = s; oldKey = s._old ? encodeSheet(s) : null; update(true); if (prev) showUndo(prev, t().linkReplaced); }
});
fitPreview();
document.fonts && document.fonts.ready.then(() => { renderPreview(); fitPreview(); });   // re-measure labels once the font is in
