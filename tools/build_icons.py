"""Builds the app icons from the source illustration.

Run: python tools/build_icons.py

The source art has its own rounded corners on white. Phones round icons
themselves (and Android may crop to a circle), so the white corners are
filled by extending the painting's edge colours outward.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'icons' / 'source' / 'clean-goose.png'
OUT = ROOT / 'icons'


def outside_mask(img):
    """True where pixels are the white surround connected to the image border."""
    rgb = np.asarray(img, dtype=np.int32)
    white = (rgb.sum(axis=2) > 738).astype(np.uint8) * 255
    m = Image.fromarray(white, 'L').copy()  # fromarray can be read-only; floodfill needs a writable image
    w, h = m.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    out = np.asarray(m) == 128
    # Swallow the soft anti-aliased fringe too.
    grown = Image.fromarray(out.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))
    return np.asarray(grown) > 0


def push_pull_fill(rgb, valid):
    """Fill invalid pixels with a smooth blend of nearby valid colours."""
    levels = []
    c = rgb * valid[..., None]
    w = valid.astype(np.float64)
    while min(w.shape) > 1:
        levels.append((c, w))
        h2, w2 = (w.shape[0] + 1) // 2, (w.shape[1] + 1) // 2
        cp = np.zeros((h2 * 2, w2 * 2, 3)); cp[:c.shape[0], :c.shape[1]] = c
        wp = np.zeros((h2 * 2, w2 * 2)); wp[:w.shape[0], :w.shape[1]] = w
        c = cp.reshape(h2, 2, w2, 2, 3).sum(axis=(1, 3))
        w = wp.reshape(h2, 2, w2, 2).sum(axis=(1, 3))
    filled = c / np.maximum(w, 1e-9)[..., None]
    for c, w in reversed(levels):
        up = np.repeat(np.repeat(filled, 2, axis=0), 2, axis=1)[:w.shape[0], :w.shape[1]]
        up = np.asarray(Image.fromarray(np.clip(up, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)), dtype=np.float64)
        known = c / np.maximum(w, 1e-9)[..., None]
        a = np.clip(w, 0, 1)[..., None]
        filled = known * a + up * (1 - a)
    return filled


def fill(img, valid):
    rgb = np.asarray(img, dtype=np.float64)
    filled = push_pull_fill(rgb, valid)
    # Soften the filled area so it reads as paper, not smears.
    soft = np.asarray(Image.fromarray(filled.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), dtype=np.float64)
    out = np.where(valid[..., None], rgb, soft)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main():
    src = Image.open(SRC).convert('RGB')
    outside = outside_mask(src)

    # Square crop around the painting.
    ys, xs = np.where(~outside)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    side = int(max(xs.max() - xs.min(), ys.max() - ys.min()))
    box = (int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))
    art = fill(src, ~outside).crop(box)

    for size, name in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png'), (32, 'favicon-32.png')):
        art.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)

    # Android "maskable": shrink the art into a wider canvas so a circle crop keeps the goose's feet.
    big = 1024
    inner = int(big * 0.84)
    canvas = Image.new('RGB', (big, big))
    off = (big - inner) // 2
    canvas.paste(art.resize((inner, inner), Image.LANCZOS), (off, off))
    valid = np.zeros((big, big), bool)
    valid[off:off + inner, off:off + inner] = True
    fill(canvas, valid).resize((512, 512), Image.LANCZOS).save(OUT / 'icon-maskable-512.png', optimize=True)

    # In-app home art (keeps the painting's own rounded corners, on transparency).
    alpha = Image.fromarray(((~outside) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    home = src.copy()
    home.putalpha(alpha)
    home.crop(box).resize((360, 360), Image.LANCZOS).save(OUT / 'clean-goose-art.webp', quality=86, method=6)
    print('icons written')


if __name__ == '__main__':
    main()
