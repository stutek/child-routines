"""Smoke test of the sheet maker (children/index.html) in headless Chrome over CDP.

    python3 tools/web_test.py

Checks: no horizontal overflow at 390 and 320 px device width, form numbers match the sheet after
removing and clearing rows, no console errors or exceptions,
a share link round-trips (title, labels with č š ž) and a broken one is ignored,
and printing gives exactly 1 page. Needs google-chrome and `pip install websockets`. Every call has a timeout.
"""
import base64
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from websockets.sync.client import connect

ROOT = Path(__file__).resolve().parent.parent
PAGE = (ROOT / "children" / "index.html").as_uri()
PORT = 9333
TIMEOUT = 20


class Cdp:
    def __init__(self, url):
        self.ws, self.n, self.events = connect(url, max_size=None, open_timeout=TIMEOUT), 0, []

    def call(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        end = time.time() + TIMEOUT
        while True:
            msg = json.loads(self.ws.recv(timeout=max(0.1, end - time.time())))
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg["result"]
            self.events.append(msg)

    def wait(self, seconds):   # collect events for a while
        end = time.time() + seconds
        while time.time() < end:
            try:
                self.events.append(json.loads(self.ws.recv(timeout=0.2)))
            except TimeoutError:
                pass


def main():
    errors = []
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        chrome = subprocess.Popen(["google-chrome", "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={tmp}",
                                   f"--remote-debugging-port={PORT}", "--lang=sl", "about:blank"],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            for _ in range(50):
                try:
                    tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2))
                    break
                except OSError:
                    time.sleep(0.2)
            else:
                sys.exit("Chrome did not start")
            cdp = Cdp(next(t for t in tabs if t["type"] == "page")["webSocketDebuggerUrl"])
            cdp.call("Runtime.enable")
            cdp.call("Log.enable")
            cdp.call("Emulation.setFocusEmulationEnabled", enabled=True)   # a background page has no :focus otherwise
            for width in (390, 320):
                cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=800, deviceScaleFactor=1, mobile=True)
                cdp.call("Page.navigate", url=PAGE)
                cdp.wait(2)
                scroll = cdp.call("Runtime.evaluate", expression="document.documentElement.scrollWidth", returnByValue=True)["result"]["value"]
                print(f"width {width}: scrollWidth {scroll}")
                if scroll > width:
                    errors.append(f"horizontal overflow at {width}: scrollWidth {scroll}")
            # numbers in the form match the sheet after the broom removes a row and a label is cleared by hand
            numbers = """(async () => {
              const rows = () => [...document.querySelectorAll('.step')].filter(r => r.querySelector('.n'));
              const tick = () => new Promise(r => setTimeout(r, 300));
              rows()[1].querySelector('.del').click(); await tick();
              const input = rows()[4].querySelector('input');
              input.value = ''; input.dispatchEvent(new Event('input')); await tick();
              const form = rows().filter(r => r.querySelector('.n').textContent)
                .map(r => r.querySelector('.n').textContent + ' ' + r.querySelector('input').value.trim());
              const sheet = [...document.querySelectorAll('#sheets .rt-num')].map(n => n.textContent + ' ' +
                n.closest('.rt-pic').nextElementSibling.querySelector('.rt-label').textContent.trim());
              return JSON.stringify(form) === JSON.stringify(sheet) && form.length === 6 ? 'ok' : JSON.stringify({form, sheet});
            })()"""
            got = cdp.call("Runtime.evaluate", expression=numbers, awaitPromise=True, returnByValue=True)["result"]["value"]
            print(f"numbers after broom and a cleared label: {got}")
            if got != "ok":
                errors.append(f"form numbers differ from the sheet: {got}")
            # the broom on a row with a label offers Undo and puts focus on the input now at that place
            got = cdp.call("Runtime.evaluate", awaitPromise=True, returnByValue=True, expression="""(async () => {
              const rows = () => [...document.querySelectorAll('#maker .step')].filter(r => r.querySelector('.n'));
              const tick = () => new Promise(r => setTimeout(r, 300));
              const before = rows().map(r => r.querySelector('input').value);
              rows()[0].querySelector('.del').click(); await tick();
              const after = rows().map(r => r.querySelector('input').value);
              const focused = document.activeElement === rows()[0].querySelector('input');
              const btn = document.querySelector('#undo button');
              if (btn) { btn.click(); await tick(); }
              const back = rows().map(r => r.querySelector('input').value);
              return JSON.stringify({shifted: after[0] === before[1], focused, undo: !!btn, restored: JSON.stringify(back) === JSON.stringify(before)});
            })()""")["result"]["value"]
            print(f"broom: {got}")
            if got != '{"shifted":true,"focused":true,"undo":true,"restored":true}':
                errors.append(f"broom without Undo, focus or restore: {got}")
            # gallery: names from the labels, decorative images, aria-expanded, Escape returns focus; landmarks and skip link
            got = cdp.call("Runtime.evaluate", awaitPromise=True, returnByValue=True, expression="""(async () => {
              const tick = () => new Promise(r => setTimeout(r, 200));
              const thumb = document.querySelector('.step .thumb'), gal = thumb.parentElement.nextElementSibling.nextElementSibling;   // row, its hint, its gallery
              const r = {closed: thumb.getAttribute('aria-expanded') === 'false'};
              thumb.click(); await tick();
              r.open = thumb.getAttribute('aria-expanded') === 'true' && !gal.hidden;
              const pics = [...gal.querySelectorAll('button')].filter(b => b.querySelector('img'));
              r.named = pics.length > 10 && pics.every(b => b.getAttribute('aria-label')) && pics.every(b => b.querySelector('img').getAttribute('alt') === '');
              gal.querySelector('button').focus();
              gal.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); await tick();
              r.escape = gal.hidden && thumb.getAttribute('aria-expanded') === 'false' && document.activeElement === thumb;
              r.landmarks = !!document.querySelector('main header h1') && !!document.querySelector('main');
              const skip = document.getElementById('skip'), before = location.hash;
              skip.focus(); r.skipShown = skip.getBoundingClientRect().top >= 0;
              skip.click(); await tick();
              r.skipFocus = document.activeElement === document.querySelector('#maker .row-top.fields select') && location.hash === before;
              return JSON.stringify(r);
            })()""")["result"]["value"]
            print(f"gallery and landmarks: {got}")
            bad = [k for k, v in json.loads(got).items() if not v]
            if bad:
                errors.append(f"accessibility checks failed: {bad}")
            # step grip: Alt+ArrowDown / Alt+ArrowUp (and plain arrows) move the step, focus stays on its grip;
            # shortcuts and description are announced; aria-pressed is not set for keyboard use
            got = cdp.call("Runtime.evaluate", awaitPromise=True, returnByValue=True, expression="""(async () => {
              const tick = () => new Promise(r => setTimeout(r, 200));
              const rows = () => [...document.querySelectorAll('#maker .step')].filter(r => r.querySelector('.n'));
              const labels = () => rows().map(r => r.querySelector('input').value);
              const grips = () => [...document.querySelectorAll('.grip')];
              const key = (g, k, alt) => g.dispatchEvent(new KeyboardEvent('keydown', {key: k, altKey: alt, bubbles: true, cancelable: true}));
              const r = {}, a = labels();
              const g = grips()[0];
              r.attrs = g.getAttribute('aria-keyshortcuts') === 'Alt+ArrowUp Alt+ArrowDown' && !g.hasAttribute('aria-pressed')
                && document.getElementById(g.getAttribute('aria-describedby')).textContent.startsWith('Alt ');
              g.focus(); key(g, 'ArrowDown', true); await tick();
              const b = labels();
              r.down = b[1] === a[0] && b[0] === a[1] && document.activeElement === grips()[1];
              key(grips()[1], 'ArrowUp', true); await tick();
              r.up = JSON.stringify(labels()) === JSON.stringify(a) && document.activeElement === grips()[0];
              key(grips()[0], 'ArrowDown', false); await tick();
              r.plain = labels()[1] === a[0] && document.activeElement === grips()[1];
              key(grips()[1], 'ArrowUp', false); await tick();
              r.noPressed = grips().every(x => !x.hasAttribute('aria-pressed'));
              return JSON.stringify(r);
            })()""")["result"]["value"]
            print(f"grip keyboard: {got}")
            bad = [k for k, v in json.loads(got).items() if not v]
            if bad:
                errors.append(f"grip keyboard checks failed: {bad}")
            # the maintainer's order above the form: About, the watch list with its danger sign, the links, Quick start; print hint on the button
            got = cdp.call("Runtime.evaluate", returnByValue=True, expression="""(() => {
              const warn = document.querySelector('#maker .warn'), field = document.querySelector('#maker .row-top.fields');
              const d = [...document.querySelectorAll('#maker details')], box = document.querySelector('#maker .sheet-box');
              const btn = document.querySelector('#actionbar .print');
              const copy = document.querySelector('#actionbar .copy'), undo = document.getElementById('undo');
              const row = [...document.querySelectorAll('#maker .row-top.fields')].find(r => r.querySelector('button.secondary')), sel = row.querySelector('select');
              return JSON.stringify({
                copyInBar: !!copy && copy.dataset.tip === 'link' && (copy.getAttribute('aria-description') || '').length > 10 && !!document.querySelector('#actionbar #linkbox') && !document.getElementById('preview-label') && getComputedStyle(document.getElementById('actionbar')).position === 'sticky' && document.getElementById('maker').lastElementChild === document.getElementById('actionbar') && !!document.getElementById('preview').getAttribute('aria-label'),
                noActionsRow: !document.querySelector('#maker .actions') && document.querySelectorAll('#maker .copy').length === 1 && !row.querySelector('.copy'),
                undoLine: !!(row.compareDocumentPosition(undo) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(undo.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING) && undo.parentElement === document.getElementById('maker'),
                exampleWithBackground: !!sel && !!row.querySelector('input[type=checkbox]') && [...row.querySelectorAll('button.secondary')].length === 1,
                warnAbove: !!warn && !!(warn.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) && warn.tagName === 'DETAILS' && warn.querySelectorAll('li').length >= 7 && !!warn.querySelector('summary .danger'),
                iconHidden: warn.querySelector('.danger').getAttribute('aria-hidden') === 'true',
                orderAbove: d.length === 2 && d.every(x => x.open) && !!(document.querySelector('#maker ol.how').compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(warn.compareDocumentPosition(document.querySelector('#maker ol.how')) & Node.DOCUMENT_POSITION_FOLLOWING),
                howHas: document.querySelectorAll('#maker ol.how li').length === 8,
                hint: btn.dataset.tip === 'print' && (btn.getAttribute('aria-description') || '').length > 10 });
            })()""")["result"]["value"]
            print(f"warning, details, print hint, link button (390 px): {got}")
            bad = [k for k, v in json.loads(got).items() if not v]
            if bad:
                errors.append(f"A1 layout checks failed: {bad}")
            # hostile links: keys every object has ("constructor", "__proto__", "toString") and an oversized link are
            # ignored or replaced by defaults; the page still renders, throws nothing and stores nothing broken
            # only letters, digits and the space stay in a title or label
            tricky = {"l": "sl", "s": "night", "h": "Večer\u202e\u200bČŠŽ 🙂", "r": [["Pij vodo\u0000 (1/2)", "", ""], ["Mamin \u2066čaj\u2069’s", "", ""]]}
            cdp.call("Page.navigate", url="about:blank"); cdp.wait(0.3)
            cdp.call("Page.navigate", url=PAGE + "#" + base64.urlsafe_b64encode(json.dumps(tricky).encode()).decode().rstrip("=")); cdp.wait(1.5)
            got = json.loads(cdp.call("Runtime.evaluate", returnByValue=True, expression="""JSON.stringify({
              title: document.querySelector('input.title').value,
              labels: [...document.querySelectorAll('.step')].filter(r => r.querySelector('.n')).slice(0, 2).map(r => r.querySelector('input').value) })""")["result"]["value"])
            print(f"tidy text: {got}")
            if got != {"title": "VečerČŠŽ", "labels": ["Pij vodo 12", "Mamin čajs"]}:
                errors.append(f"title and labels not tidied: {got}")
            # typed markup: the title, every label and every time field get an <img onerror>; nothing runs, and neither
            # the form nor the sheet gets an element with an event handler or the injected image
            cdp.call("Page.navigate", url="about:blank"); cdp.wait(0.3)
            cdp.call("Page.navigate", url=PAGE); cdp.wait(1.5)
            got = cdp.call("Runtime.evaluate", awaitPromise=True, returnByValue=True, expression="""(async () => {
              const payload = '<img src=x onerror="window.__injected=1">';
              for (const i of document.querySelectorAll('#maker input.title, #maker .step input')) {
                i.value = payload; i.dispatchEvent(new Event('input')); i.dispatchEvent(new Event('change'));
              }
              await new Promise(r => setTimeout(r, 500));
              const handlers = [...document.querySelectorAll('*')].filter(e => [...e.attributes].some(a => /^on/i.test(a.name)));
              return JSON.stringify({ ran: !!window.__injected, handlers: handlers.length,
                injectedImg: document.querySelectorAll('img[src="x"]').length });
            })()""")["result"]["value"]
            print(f"typed markup: {got}")
            if got != '{"ran":false,"handlers":0,"injectedImg":0}':
                errors.append(f"typed markup reached the page: {got}")
            hostile = [{"l": "constructor", "b": "gradient", "t": 1, "s": "__proto__", "h": "<img src=x onerror=alert(1)>", "r": [["<b>X</b>", "25:99", "toString"]]},
                       {"l": "__proto__", "s": "constructor", "r": [["A", "", "constructor"]]}]
            for case in [base64.urlsafe_b64encode(json.dumps(h).encode()).decode().rstrip("=") for h in hostile] + ["A" * 5000]:
                cdp.events.clear()
                cdp.call("Page.navigate", url="about:blank"); cdp.wait(0.3)
                cdp.call("Page.navigate", url=PAGE + "#" + case); cdp.wait(1.5)
                got = json.loads(cdp.call("Runtime.evaluate", returnByValue=True, expression="""JSON.stringify({
                  rendered: !!document.querySelector('#sheets .rt-title') && !!document.querySelector('#maker h1').textContent,
                  noInjectedImg: !document.querySelector('#sheets img[src="x"]') && !document.querySelector('#sheets b'),
                  lang: document.documentElement.lang,
                  stored: (() => { try { return JSON.parse(localStorage.getItem(Object.keys(localStorage)[0]) || '{}').lang || ''; } catch (e) { return 'bad'; } })() })""")["result"]["value"])
                thrown = [e for e in cdp.events if e.get("method") == "Runtime.exceptionThrown"]
                print(f"hostile link ({len(case)} chars): {got}, exceptions {len(thrown)}")
                if not (got["rendered"] and got["noInjectedImg"] and got["lang"] in ("sl", "en") and got["stored"] in ("", "sl", "en")) or thrown:
                    errors.append(f"hostile link not handled: {got}, exceptions {len(thrown)}")
            # a click on a section's summary folds it (after the slide), a second click opens it again
            got = cdp.call("Runtime.evaluate", awaitPromise=True, returnByValue=True, expression="""(async () => {
              const d = document.getElementById('watch'), s = d.querySelector('summary'), wait = () => new Promise(r => setTimeout(r, 400));
              s.click(); await wait(); const closed = !d.open;
              s.click(); await wait();
              return JSON.stringify({ closed, reopened: d.open, framed: getComputedStyle(d).borderTopStyle === 'solid' });
            })()""")["result"]["value"]
            print(f"fold and unfold: {got}")
            bad = [k for k, v in json.loads(got).items() if not v]
            if bad:
                errors.append(f"fold checks failed: {bad}")
            # share link: title and labels (with č š ž) survive a fresh navigation; a broken fragment is ignored
            cdp.call("Runtime.evaluate", expression="""(() => {
              const t = document.querySelector('input.title'); t.value = 'Čšž večer'; t.dispatchEvent(new Event('input'));
              const i = document.querySelector('.step input'); i.value = 'Umij zobe čšž'; i.dispatchEvent(new Event('input'));
            })()""")
            link = cdp.call("Runtime.evaluate", expression="location.href", returnByValue=True)["result"]["value"]
            read = """JSON.stringify([document.querySelector('input.title').value, document.querySelector('.step input').value,
              [...document.querySelectorAll('#sheets .rt-label')].map(l => l.textContent.trim())[0], document.querySelector('#sheets .rt-title').textContent.trim()])"""
            cdp.call("Page.navigate", url="about:blank")
            cdp.wait(0.5)
            cdp.call("Page.navigate", url=link)
            cdp.wait(2)
            got = json.loads(cdp.call("Runtime.evaluate", expression=read, returnByValue=True)["result"]["value"])
            print(f"link {len(link.split('#')[1])} characters, read back: {got}")
            if got != ["Čšž večer", "Umij zobe čšž", "UMIJ ZOBE ČŠŽ", "ČŠŽ VEČER"]:
                errors.append(f"share link does not round-trip: {got}")
            # a link to a picture that was removed later: the id falls back to "auto" (keyword match, else "?")
            for label, want in (("UMIJ ZOBKE", "brush-teeth"), ("XYZ", None)):
                raw = json.dumps({"l": "sl", "b": "gradient", "t": 1, "s": "night", "h": "TEST", "r": [[label, "", "removed-picture"]]})
                frag = base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")
                cdp.call("Page.navigate", url="about:blank")
                cdp.wait(0.5)
                cdp.call("Page.navigate", url=PAGE + "#" + frag)
                cdp.wait(2)
                res = json.loads(cdp.call("Runtime.evaluate", returnByValue=True, expression="""JSON.stringify({
                  img: (document.querySelector('#sheets .rt-pic img') || {src: ''}).src.split('/').pop(),
                  missing: !!document.querySelector('#sheets .rt-missing'),
                  warn: document.getElementById('warnings').className })""")["result"]["value"])
                print(f"removed picture, label {label}: {res}")
                if want and res["img"] != want + ".jpg":
                    errors.append(f"removed picture with label {label}: expected {want}.jpg, got {res}")
                if not want and not (res["missing"] and res["warn"] == "warnings"):
                    errors.append(f"removed picture with label {label}: expected ? placeholder and a warning, got {res}")
            # a label too long for its frame is marked at its own row (aria-invalid, hint, described by) and the
            # warnings list does not read the same thing out again (aria-hidden); a short label is not marked
            rows6 = [["UMIJ ZOBE", "", ""], ["WWWWWWWWWWWWWWWWWWWWWWWW", "", ""]] + [[f"KORAK {i}", "", ""] for i in range(4)]
            raw = json.dumps({"l": "sl", "b": "gradient", "t": 1, "s": "dawn", "h": "TEST", "r": rows6})
            frag = base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")
            cdp.call("Page.navigate", url="about:blank")
            cdp.wait(0.5)
            cdp.call("Page.navigate", url=PAGE + "#" + frag)
            cdp.wait(2)
            got = cdp.call("Runtime.evaluate", returnByValue=True, expression="""(() => {
              const inputs = [...document.querySelectorAll('.step input:not(.time)')];
              const hint = i => { const id = inputs[i].getAttribute('aria-describedby'); return id && document.getElementById(id); };
              const r = {
                marked: inputs[1].getAttribute('aria-invalid') === 'true' && !!hint(1) && !hint(1).hidden && hint(1).textContent.length > 10,
                red: getComputedStyle(inputs[1]).borderColor === 'rgb(185, 28, 28)',
                others: [0, 2, 3].every(i => !inputs[i].hasAttribute('aria-invalid') && !inputs[i].hasAttribute('aria-describedby')),
                listOnce: [...document.querySelectorAll('#warnings li')].filter(li => li.textContent.includes('predolg')).every(li => li.getAttribute('aria-hidden') === 'true'),
                listStays: document.querySelectorAll('#warnings li').length > 0 };
              inputs[1].value = 'KRATEK'; inputs[1].dispatchEvent(new Event('input'));
              r.cleared = !inputs[1].hasAttribute('aria-invalid') && !inputs[1].hasAttribute('aria-describedby') && [...document.querySelectorAll('.row-hint')].every(h => h.hidden);
              return JSON.stringify(r);
            })()""")["result"]["value"]
            print(f"too long label: {got}")
            bad = [k for k, v in json.loads(got).items() if not v]
            if bad:
                errors.append(f"too-long label checks failed: {bad}")
            # the form shows the state a link carries: type (sky), background, picture theme (shown once an image has
            # a variant), time checkbox; also after a reload. Every picture on the sheet is in the theme or has no variant in it.
            raw = json.dumps({"l": "sl", "b": "white", "t": 0, "p": "plain", "s": "dawn", "h": "JUTRO", "r": [["UMIJ ZOBE", "", ""], ["POSPRAVI POSTELJO", "", ""]]})
            frag = base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")
            cdp.call("Page.navigate", url="about:blank")
            cdp.wait(0.5)
            cdp.call("Page.navigate", url=PAGE + "#" + frag)
            cdp.wait(2)
            form_state = """JSON.stringify([...document.querySelectorAll('#maker select')].map(s => s.value).concat([document.querySelector('#maker input[type=checkbox]').checked]))"""
            themed = cdp.call("Runtime.evaluate", expression="Object.values(SHEET_DATA.images).some(i => i.variant_of)", returnByValue=True)["result"]["value"]
            in_theme = """(() => { const I = SHEET_DATA.images;
              return [...document.querySelectorAll('#sheets img[src*="/images/"]')].map(i => i.getAttribute('src').match(/images\\/([^/]+)\\.jpg/)[1])
                .every(id => I[id].theme === 'plain' || !Object.values(I).some(v => v.variant_of === id && v.theme === 'plain')); })()"""
            for how in ("link", "reload"):
                if how == "reload":
                    cdp.call("Page.reload")
                    cdp.wait(2)
                got = json.loads(cdp.call("Runtime.evaluate", expression=form_state, returnByValue=True)["result"]["value"])
                print(f"form after {how}: {got}")
                if got != ["sl", "dawn", "white"] + (["plain"] if themed else []) + [False]:
                    errors.append(f"form after {how} does not show the sheet (language, type, background, theme, time): {got}")
                if not cdp.call("Runtime.evaluate", expression=in_theme, returnByValue=True)["result"]["value"]:
                    errors.append(f"sheet after {how} shows a picture outside the theme though a variant exists")
            # image group: "bear" is the default, also for a link without one, and shows the bear picture of the step;
            # "all" keeps a hand-picked variant
            variant = cdp.call("Runtime.evaluate", expression="""(() => { const I = SHEET_DATA.images;
              const v = Object.keys(I).find(id => I[id].variant_of && I[id].theme === 'plain' && I[I[id].variant_of].theme === 'bear');
              return v ? [v, I[v].variant_of] : null; })()""", returnByValue=True)["result"]["value"]
            if variant:
                for group, want in ((None, ["bear", variant[1]]), ("all", ["all", variant[0]])):
                    raw = {"l": "sl", "b": "white", "t": 0, "s": "dawn", "h": "JUTRO", "r": [["KORAK", "", variant[0]]]}
                    if group:
                        raw["p"] = group
                    frag = base64.urlsafe_b64encode(json.dumps(raw).encode()).decode().rstrip("=")
                    cdp.call("Page.navigate", url="about:blank")
                    cdp.wait(0.5)
                    cdp.call("Page.navigate", url=PAGE + "#" + frag)
                    cdp.wait(2)
                    got = cdp.call("Runtime.evaluate", expression="""JSON.stringify([document.querySelectorAll('#maker select')[3].value,
                      document.querySelector('#sheets img[src*="/images/"]').getAttribute('src').match(/images\\/([^/]+)\\.jpg/)[1]])""",
                      returnByValue=True)["result"]["value"]
                    print(f"image group {group or 'default'}: {got}")
                    if json.loads(got) != want:
                        errors.append(f"image group {group or 'default'} shows {got}, expected {want}")
                # changing the image group refills an open gallery in place: it stays open, focus and scroll stay
                cdp.call("Page.navigate", url="about:blank")
                cdp.wait(0.5)
                cdp.call("Page.navigate", url=PAGE)
                cdp.wait(2)
                got = cdp.call("Runtime.evaluate", expression="""(() => {
                  const thumb = document.querySelector('.step .thumb'), gal = thumb.parentElement.nextElementSibling.nextElementSibling;
                  thumb.click(); window.scrollTo(0, 200);
                  const sel = document.querySelectorAll('#maker select')[3], y = scrollY, before = gal.querySelectorAll('img').length;
                  sel.focus({ preventScroll: true }); sel.value = sel.value === 'all' ? 'bear' : 'all'; sel.dispatchEvent(new Event('change'));
                  return JSON.stringify({ open: !gal.hidden && thumb.getAttribute('aria-expanded') === 'true',
                    refilled: gal.querySelectorAll('img').length !== before, focus: document.activeElement === sel, scroll: scrollY === y }); })()""",
                    returnByValue=True)["result"]["value"]
                print(f"image group change, gallery: {got}")
                bad = [k for k, v in json.loads(got).items() if not v]
                if bad:
                    errors.append(f"image group change: gallery checks failed: {bad}")
            # a select opened and closed with the mouse keeps no focus ring; the keyboard brings it back (WCAG 2.2, 2.4.7)
            ev = lambda e: cdp.call("Runtime.evaluate", expression=e, returnByValue=True)["result"].get("value")
            sel = "document.querySelectorAll('#maker select')[1]"
            ev(f"{sel}.scrollIntoView({{ block: 'center' }})")
            x, y = json.loads(ev(f"JSON.stringify((r => [r.x + r.width / 2, r.y + r.height / 2])({sel}.getBoundingClientRect()))"))
            for _ in range(2):
                for kind in ("mousePressed", "mouseReleased"):
                    cdp.call("Input.dispatchMouseEvent", type=kind, x=x, y=y, button="left", clickCount=1)
                cdp.wait(0.4)
            mouse = ev(f"document.activeElement === {sel} && getComputedStyle({sel}).outlineStyle")
            for kind in ("rawKeyDown", "keyUp"):
                cdp.call("Input.dispatchKeyEvent", type=kind, key="Tab", code="Tab", windowsVirtualKeyCode=9)
            cdp.wait(0.3)
            keyboard = ev("getComputedStyle(document.activeElement).outlineStyle")
            print(f"select focus ring: after mouse {mouse}, after Tab {keyboard}")
            if mouse != "none" or keyboard != "solid":
                errors.append(f"select focus ring: after mouse {mouse} (want none), after Tab {keyboard} (want solid)")
            cdp.call("Page.navigate", url="about:blank")
            cdp.wait(0.5)
            cdp.call("Page.navigate", url=PAGE + "#abc")
            cdp.wait(2)
            ok = cdp.call("Runtime.evaluate", expression="document.querySelectorAll('#sheets .rt-label').length > 0", returnByValue=True)["result"]["value"]
            print(f"broken fragment ignored, sheet shown: {ok}")
            if not ok:
                errors.append("a broken fragment left no sheet")
            for e in cdp.events:
                if e["method"] == "Runtime.exceptionThrown":
                    errors.append("exception: " + e["params"]["exceptionDetails"].get("text", "?"))
                elif e["method"] == "Runtime.consoleAPICalled" and e["params"]["type"] == "error":
                    errors.append("console.error")
                elif e["method"] == "Log.entryAdded" and e["params"]["entry"]["level"] == "error":
                    errors.append("log error: " + e["params"]["entry"]["text"])
            cdp.call("Emulation.clearDeviceMetricsOverride")
            pdf = base64.b64decode(cdp.call("Page.printToPDF", preferCSSPageSize=True)["data"])
            pages = len(re.findall(rb"/Type\s*/Page\b", pdf))
            print(f"printed pages: {pages}")
            if pages != 1:
                errors.append(f"print gives {pages} pages, expected 1")
        finally:
            chrome.terminate()
            chrome.wait(timeout=10)
    for e in errors:
        print("ERROR", e)
    print(f"{len(errors)} errors")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
