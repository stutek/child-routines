"""Copyright gate: fail if any image already exists on the web.

    VISION_API_KEY=... python3 tools/copyright_check.py <image> [<image> ...]

Uses Google Cloud Vision Web Detection (POST https://vision.googleapis.com/v1/images:annotate).
An image fails when the web has a full or partial match of it, or a page showing it, other than
this repository itself (ALLOWED_PREFIXES, comma separated). Visually similar images do not count.
The gate fails closed: a missing key or any API error also fails. Standard library only, so the
workflow installs nothing. Writes a Markdown report to $GITHUB_STEP_SUMMARY when set.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

ENDPOINT = "https://vision.googleapis.com/v1/images:annotate"


def web_matches(path, key, allowed):
    body = {"requests": [{
        "image": {"content": base64.b64encode(open(path, "rb").read()).decode()},
        "features": [{"type": "WEB_DETECTION", "maxResults": 20}],
    }]}
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=60) as r:
        resp = json.load(r)["responses"][0]
    if "error" in resp:
        raise RuntimeError(resp["error"].get("message", resp["error"]))
    web = resp.get("webDetection", {})
    urls = [m["url"] for f in ("fullMatchingImages", "partialMatchingImages") for m in web.get(f, [])]
    urls += [p["url"] for p in web.get("pagesWithMatchingImages", [])]
    return [u for u in dict.fromkeys(urls) if not any(u.startswith(a) for a in allowed)]


def main():
    images = [p for p in sys.argv[1:] if os.path.isfile(p)]
    key = os.environ.get("VISION_API_KEY", "")
    allowed = [a for a in os.environ.get("ALLOWED_PREFIXES", "").split(",") if a]
    lines, failed = ["## Copyright gate", ""], False
    if not images:
        lines.append("No new or changed images. Passed.")
    elif not key:
        lines.append("VISION_API_KEY is not set, so images cannot be checked. Failed (the gate fails closed).")
        failed = True
    else:
        for path in images:
            name = os.path.basename(path)
            try:
                found = web_matches(path, key, allowed)
            except (urllib.error.URLError, RuntimeError, KeyError, ValueError) as e:
                lines.append(f"- **{name}**: check failed ({e}). Failed.")
                failed = True
                continue
            if found:
                failed = True
                lines.append(f"- **{name}**: already on the web. Failed. Regenerate the image with a different composition.")
                lines += [f"  - {u}" for u in found[:10]]
            else:
                lines.append(f"- **{name}**: no matches. Passed.")
    report = "\n".join(lines) + "\n"
    print(report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(report)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
