"""Smoke test of the sheet maker (web/index.html) in headless Chrome over CDP.

    python3 tools/web_test.py

Checks: no horizontal overflow at 390 and 320 px device width, no console errors or exceptions,
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
