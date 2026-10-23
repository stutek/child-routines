"""Smoke test of the sheet maker (web/index.html) in headless Chrome over CDP.

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
PAGE = (ROOT / "web" / "index.html").as_uri()
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
