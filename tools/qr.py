"""Write children/qr.svg: the QR code printed in the footer of every sheet, leading to the sheet maker.

    pip install qrcode==8.2
    python3 tools/qr.py

Run only when SITE in tools/build.py changes; tools/build.py reads the file, so CI needs no QR library.
"""
from pathlib import Path

import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parent.parent
URL = "https://routines.twotech.si/children/"   # the sheet maker itself; / redirects here until other routine makers sit beside it


def main():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=1,
                       image_factory=qrcode.image.svg.SvgPathImage)
    qr.add_data(URL)
    qr.make(fit=True)
    out = ROOT / "children" / "qr.svg"
    out.write_bytes(qr.make_image().to_string())
    print(f"Wrote {out.relative_to(ROOT)}: version {qr.version}, {qr.modules_count} modules, {URL}")


if __name__ == "__main__":
    main()
