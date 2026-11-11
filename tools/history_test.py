#!/usr/bin/env python3
"""Undo and the browser's own Back/Forward in the sheet maker, with real input.

history.back() in a page does not press the browser's Back, so this runs a windowed Chrome on a virtual display and
presses Alt+Left / Alt+Right there through XTest. Every kind of action is done with real input (CDP Input) and the form
recorded; Back to the start and Forward to the end must match the record at every step. Then: Back while still typing,
reload, Undo after an example (double click) and after the broom, and a link typed into the address bar.
Not part of tools/check.py: GitHub's runners have no display. Needs xvfb-run and libXtst; run it as

    python3 tools/history_test.py

(it starts itself under xvfb-run, with WAYLAND_DISPLAY unset so no window opens on the user's screen).
"""
import base64, ctypes, json, os, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from web_test import Cdp, PAGE, TMP

if "HISTORY_TEST_INNER" not in os.environ:
    env = {k: v for k, v in os.environ.items() if k != "WAYLAND_DISPLAY"} | {"HISTORY_TEST_INNER": "1"}
    sys.exit(subprocess.call(["xvfb-run", "-a", sys.executable, __file__], env=env))

PORT = 9336
x11 = ctypes.CDLL("libX11.so.6"); xt = ctypes.CDLL("libXtst.so.6")
x11.XOpenDisplay.restype = ctypes.c_void_p
dpy = ctypes.c_void_p(x11.XOpenDisplay(None))
SHIFT, ALT, CTRL, LEFT, RIGHT, F5, RET = 0xffe1, 0xffe9, 0xffe3, 0xff51, 0xff53, 0xffc2, 0xff0d
def xkey(*syms):
    codes = [x11.XKeysymToKeycode(dpy, s) for s in syms]
    for c in codes: xt.XTestFakeKeyEvent(dpy, c, True, 0)
    for c in reversed(codes): xt.XTestFakeKeyEvent(dpy, c, False, 0)
    x11.XFlush(dpy)
def xtype(text):
    named = {":": 0x3a, "/": 0x2f, ".": 0x2e, "#": 0x23, "-": 0x2d, "_": 0x5f, "=": 0x3d}
    for ch in text:
        sym = named.get(ch, ord(ch))
        xkey(SHIFT, sym) if ch.isupper() or ch in ":#_" else xkey(sym)

def dec(h): return json.loads(base64.urlsafe_b64decode(h + "=" * (-len(h) % 4)))
def diff(a, b):
    a, b = json.loads(a), json.loads(b); da, db = dec(a["hash"]), dec(b["hash"])
    keys = [f"{k}: {da.get(k)!r} != {db.get(k)!r}" for k in sorted(set(da) | set(db)) if da.get(k) != db.get(k)]
    form = [f"field {i}: {x!r} != {y!r}" for i, (x, y) in enumerate(zip(a["form"], b["form"])) if x != y]
    return "; ".join(keys + form + (["sheet text"] if a["sheet"] != b["sheet"] else []))[:400] or "same?"

def main():
    problems = []
    TMP.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="history_test-", dir=TMP, ignore_cleanup_errors=True) as prof:
        chrome = subprocess.Popen(["google-chrome", "--ozone-platform=x11", "--disable-gpu", "--no-first-run", "--password-store=basic",
                                   "--no-sandbox", "--window-position=0,0", "--window-size=1280,1000", "--lang=sl",
                                   f"--user-data-dir={prof}", f"--remote-debugging-port={PORT}", "about:blank"],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            for _ in range(150):
                try: tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2)); break
                except OSError: time.sleep(0.2)
            cdp = Cdp(next(t for t in tabs if t["type"] == "page")["webSocketDebuggerUrl"])
            cdp.call("Runtime.enable")
            cdp.call("Page.navigate", url=PAGE); cdp.wait(3)
            ev = lambda x: cdp.call("Runtime.evaluate", expression=x, returnByValue=True, awaitPromise=True)["result"].get("value")
            def at(sel):
                ev(f"{sel}.scrollIntoView({{block: 'center'}})")
                return json.loads(ev(f"JSON.stringify((r => [r.x + r.width / 2, r.y + r.height / 2])({sel}.getBoundingClientRect()))"))
            def click(sel, wait=0.6, count=1):
                x, y = at(sel)
                for n in range(1, count + 1):
                    for t in ("mousePressed", "mouseReleased"):
                        cdp.call("Input.dispatchMouseEvent", type=t, x=x, y=y, button="left", clickCount=n)
                cdp.wait(wait)
            def key(k, vk, mod=0):
                for t in ("rawKeyDown", "keyUp"):
                    cdp.call("Input.dispatchKeyEvent", type=t, key=k, code=k, windowsVirtualKeyCode=vk, modifiers=mod)
            H1 = "document.querySelector('#maker h1')"
            calm = lambda: click(H1, 0.3)   # click on the heading: leaves the field, as a parent moving on
            def pick(has, value):   # a select changed with the arrow keys, as a keyboard user does, then left
                sel = f"[...document.querySelectorAll('#maker select')].find(x => [...x.options].some(o => o.value === '{has}'))"
                calm(); ev(f"{sel}.focus()")
                n = ev(f"(s => [...s.options].findIndex(o => o.value === '{value}') - s.selectedIndex)({sel})")
                for _ in range(abs(n)):
                    key(*(("ArrowDown", 40) if n > 0 else ("ArrowUp", 38))); time.sleep(0.15)
                cdp.wait(0.3); calm()
            def type_in(sel, text, pause=0.12, replace=False):
                click(sel)
                ev(f"{sel}.select()" if replace else f"(i => i.setSelectionRange(i.value.length, i.value.length))({sel})")
                for ch in text: cdp.call("Input.insertText", text=ch); time.sleep(pause)
                cdp.wait(0.3)
            snap = lambda: ev("""JSON.stringify({hash: location.hash.slice(1),
                form: [...document.querySelectorAll('#maker select, #maker input')].map(e => e.type === 'checkbox' ? e.checked : e.value),
                sheet: [...document.querySelectorAll('#sheets .rt-label')].map(l => l.textContent.trim()).join('|')})""")
            index = lambda: cdp.call("Page.getNavigationHistory")["currentIndex"]
            row = lambda k, what="input": f"document.querySelectorAll('#maker .step:not(.step-head)')[{k}].querySelector('{what}')"
            title = "document.querySelector('#maker input.title')"
            actions = [
                ("type: evening -> morning (2 arrows)", lambda: pick("dawn", "dawn")),
                ("layout: sides", lambda: pick("sides", "sides")),
                ("background: white", lambda: pick("white", "white")),
                ("times on", lambda: click("document.querySelector('#maker .check input')")),
                ("start 7:30", lambda: (type_in("document.querySelector('#maker input.clock')", "7:30", replace=True), calm())),
                ("row 1 label + 'A'", lambda: (type_in(row(0), "A"), calm())),
                ("title + 'X', pause 1.5 s, 'Y'", lambda: (type_in(title, "X"), time.sleep(1.5), type_in(title, "Y"), calm())),
                ("row 2 minutes 7", lambda: (type_in(row(1, "input.time"), "7", replace=True), calm())),
                ("row 3 picture from the gallery", lambda: (click(row(2, ".thumb")), click(f"{row(2, '.thumb')}.closest('.step').nextElementSibling.nextElementSibling.querySelectorAll('button')[5]"))),
                ("broom row 2", lambda: click(row(1, ".del"))),
                ("move row 1 down (Alt+Down)", lambda: (ev(f"{row(0, '.grip')}.focus()"), key("ArrowDown", 40, mod=1), cdp.wait(0.6))),
                ("load example", lambda: click("[...document.querySelectorAll('#maker .fields button.secondary')].find(b => b.textContent.includes(':'))")),
                ("language: the other one", lambda: pick("en", "sl" if ev("document.documentElement.lang") == "en" else "en")),
            ]
            start = index(); expect = {start: snap()}
            for name, act in actions:
                before = index(); act(); after = index()
                expect[after] = snap()
                print(f"{name}: {after - before} history step(s)")
                if after - before != 1: problems.append(f"{name}: {after - before} history steps, expected 1")
            end = index()
            # the browser's Back and Forward: keys go to the window under the pointer
            x, y = json.loads(ev(f"JSON.stringify((r => [window.screenX + r.x + 5, window.screenY + (outerHeight - innerHeight) + r.y + r.height / 2])({H1}.getBoundingClientRect()))"))
            x11.XSetInputFocus(dpy, ctypes.c_ulong(1), 1, ctypes.c_ulong(0))
            xt.XTestFakeMotionEvent(dpy, -1, int(x), int(y), 0); x11.XFlush(dpy); time.sleep(0.3)
            for direction, sym, want in (("Back", LEFT, range(end - 1, start - 1, -1)), ("Forward", RIGHT, range(start + 1, end + 1))):
                bad = 0
                for i in want:
                    xkey(ALT, sym); time.sleep(0.9)
                    if index() != i: problems.append(f"{direction}: at {index()}, expected {i}"); bad += 1; break
                    if snap() != expect[i]: problems.append(f"{direction} to {i}: " + diff(snap(), expect[i])); bad += 1
                print(f"browser {direction} over {len(want)} entries: {'ok' if not bad else f'{bad} wrong'}")
            # Back while still typing in a field (not left yet) undoes the typing, and Forward brings it back
            before = snap(); type_in(title, "QQ"); typed = snap(); xkey(ALT, LEFT); time.sleep(1)
            ok_back = snap() == before; xkey(ALT, RIGHT); time.sleep(1); ok_fwd = snap() == typed
            print(f"Back while typing undoes it: {ok_back}, Forward redoes it: {ok_fwd}")
            if not (ok_back and ok_fwd): problems.append(f"Back while typing: back {ok_back}, forward {ok_fwd}")
            # reload in the middle of typing keeps the typing
            type_in(title, "R"); typed = snap(); xkey(F5); time.sleep(3)
            print("reload while typing keeps it:", snap() == typed)
            if snap() != typed: problems.append("reload while typing lost it: " + diff(snap(), typed))
            calm()
            # Undo after the example takes its place; a double click does not undo
            type_in(row(0), "Z"); calm(); mine = snap()
            click("[...document.querySelectorAll('#maker .fields button.secondary')].find(b => b.textContent.includes(':'))", 0.8, count=2)
            shown = ev("!!document.querySelector('#maker .fields img[src=\"undo.svg\"]')") and snap() != mine
            print("double click on the example: Undo in place, not undone:", shown)
            if not shown: problems.append("double click on the example: no Undo in place, or it undid")
            else:
                click("document.querySelector('#maker .fields img[src=\"undo.svg\"]').closest('button')", 1)
                print("Undo after the example restores:", snap() == mine)
                if snap() != mine: problems.append("Undo after the example: " + diff(snap(), mine))
            before = snap(); click(row(0, ".del"), 0.8); click("document.querySelector('#undo button')", 1)
            print("Undo after the broom restores:", snap() == before)
            if snap() != before: problems.append("Undo after the broom: " + diff(snap(), before))
            # a link typed into the address bar offers Undo; Back brings the typed sheet back
            mine = snap()
            link = "#" + base64.urlsafe_b64encode(json.dumps({"l": "sl", "s": "afternoon", "h": "POVEZAVA", "r": [["OBLECI SE", 5, ""]]}).encode()).decode().rstrip("=")
            xkey(CTRL, 0x6c); time.sleep(0.4); xtype(PAGE + link); xkey(RET); time.sleep(2)
            linked, offered = ev(f"{title}.value"), ev("!!document.querySelector('#undo button')")
            xt.XTestFakeMotionEvent(dpy, -1, int(x), int(y), 0); calm(); xkey(ALT, LEFT); time.sleep(1)
            print(f"typed link: title {linked!r}, Undo offered {offered}, Back restores {snap() == mine}")
            if linked != "POVEZAVA" or not offered or snap() != mine: problems.append(f"typed link: title {linked!r}, Undo {offered}, Back {snap() == mine}")
            errors = [e for e in cdp.events if e.get("method") == "Runtime.exceptionThrown"] if hasattr(cdp, "events") else []
            print("page exceptions:", len(errors))
            if errors: problems.append(f"{len(errors)} page exceptions")
        finally:
            chrome.terminate(); chrome.wait()
    print("\nPROBLEMS:" if problems else "\nno problems", *problems, sep="\n")
    return 1 if problems else 0

if __name__ == "__main__":
    sys.exit(main())
