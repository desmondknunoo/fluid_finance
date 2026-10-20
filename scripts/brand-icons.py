#!/usr/bin/env python3
"""One-off generator for the favicon set, app icons and default share image.

Run from the repository root with Pillow installed (`python3 -m pip install pillow`):

    python3 scripts/brand-icons.py

Inputs are the supplied brand files in public/logo/. Outputs are committed, so the build never
runs this. Re-run it only when the logo artwork changes.
"""
from pathlib import Path
import shutil

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
MARK = Image.open(PUBLIC / "logo" / "mark.png").convert("RGBA")
MARK = MARK.crop(MARK.getbbox())  # trim transparent margin around the two letterforms


def square(size: int, fill: float, background=None) -> Image.Image:
    """The mark centred on a square canvas, its height `fill` of the side."""
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    height = round(size * fill)
    width = round(MARK.width * height / MARK.height)
    mark = MARK.resize((width, height), Image.LANCZOS)
    canvas.alpha_composite(mark, ((size - width) // 2, (size - height) // 2))
    return canvas


WHITE = (255, 255, 255, 255)
(PUBLIC / "icons").mkdir(exist_ok=True)
square(32, 0.94).save(PUBLIC / "icons" / "favicon-32.png", optimize=True)
square(192, 0.72, WHITE).save(PUBLIC / "icons" / "icon-192.png", optimize=True)
square(512, 0.72, WHITE).save(PUBLIC / "icons" / "icon-512.png", optimize=True)
# Maskable icons keep the artwork inside the central 80% safe zone.
square(512, 0.56, WHITE).save(PUBLIC / "icons" / "maskable-512.png", optimize=True)
square(180, 0.72, WHITE).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
square(48, 0.94).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# Default share image: the existing 1200x630 brand card fits, so it is reused as is.
(PUBLIC / "og").mkdir(exist_ok=True)
shutil.copyfile(PUBLIC / "logo" / "og-card.png", PUBLIC / "og" / "default.png")
print("wrote favicon.ico, apple-touch-icon.png, icons/*.png and og/default.png")
