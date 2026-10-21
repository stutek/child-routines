"""Manual second check: upload one image to Google Lens in a debugging Chrome and print
the "Exact matches" tab (identical or near-identical images on the web).

    python3 tools/lens_check.py <absolute image path> [wait seconds]

Needs Chrome started with --remote-debugging-port (default 9224, override with CDP_PORT) and a
separate profile, e.g.:
    google-chrome --remote-debugging-port=9224 --user-data-dir=$HOME/.chrome-debug-profile
Do not bypass bot checks or login walls on matched sites.
"""
import asyncio
import os
import json
import sys
import urllib.request

import websockets

PORT = int(os.environ.get("CDP_PORT", "9224"))
img, wait = sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 8


async def main():
    tab = json.load(urllib.request.urlopen(
        urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?https://images.google.com/?hl=en", method="PUT")))
    try:
        async with websockets.connect(tab["webSocketDebuggerUrl"], max_size=50_000_000) as ws:
            n = 0

            async def cmd(method, **params):
                nonlocal n
                n += 1
                await ws.send(json.dumps({"id": n, "method": method, "params": params}))
                while True:
                    m = json.loads(await ws.recv())
                    if m.get("id") == n:
                        if "error" in m:
                            raise RuntimeError(m["error"])
                        return m.get("result", {})

            async def js(expr):
                r = await cmd("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
                return r.get("result", {}).get("value")

            await asyncio.sleep(3)
            # open the 'Search by image' dialog so the file input appears
            await js("""(()=>{const b=document.querySelector('div[aria-label="Search by image"],[aria-label*="image" i][role=button]'); if(b){b.click(); return true} return false})()""")
            await asyncio.sleep(2)
            doc = await cmd("DOM.getDocument", depth=-1, pierce=True)
            node = await cmd("DOM.querySelector", nodeId=doc["root"]["nodeId"], selector='input[type="file"]')
            if not node.get("nodeId"):
                print("ERROR: no file input found; URL:", await js("location.href"))
                print((await js("document.body.innerText"))[:800])
                return
            await cmd("DOM.setFileInputFiles", nodeId=node["nodeId"], files=[img])
            await asyncio.sleep(wait)
            url = await js("location.href")
            if "udm=26" not in url:
                print("ERROR: no Lens results page; URL:", url)
                print((await js("document.body.innerText"))[:800])
                return
            # 'Exact matches' tab (udm=48): identical or near-identical images on the web
            await js(f"location.href = {json.dumps(url.replace('udm=26', 'udm=48'))}")
            await asyncio.sleep(wait)
            text = await js("document.body.innerText")
            start = text.find("Exact matches")
            print(text[start:start + 2500] if start >= 0 else text[:2500])
            links = await js("""[...document.querySelectorAll('a[href^="http"]')].map(a=>a.href).filter(h=>!/google\\./.test(new URL(h).hostname)).slice(0,15).join('\\n')""")
            print("--- external links ---")
            print(links)
    finally:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/close/{tab['id']}")


asyncio.run(main())
