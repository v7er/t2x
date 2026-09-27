#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path("/workspace/public")


def enso(size: int, rounded: bool = True) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tile = Image.new("RGBA", (size, size), (7, 9, 8, 255))
    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=255)
        bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        bg.paste(tile, mask=mask)
        im = bg
    else:
        im = tile

    draw = ImageDraw.Draw(im)
    m = size * 0.18
    width = max(2, int(size * 0.11))
    bbox = (m, m, size - m - 1, size - m - 1)
    draw.arc(bbox, start=208, end=148, fill=(61, 219, 122, 255), width=width)
    r = size * 0.075
    cx = cy = size / 2
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(61, 219, 122, 255))
    return im


def save(im: Image.Image, name: str) -> None:
    path = OUT / name
    im.save(path, "PNG")
    print(path, im.size)


def main() -> None:
    save(enso(180, rounded=False), "apple-touch-icon.png")
    save(enso(192, rounded=False), "icon-192.png")
    save(enso(512, rounded=False), "icon-512.png")
    save(enso(1024, rounded=True), "icon-1024.png")


if __name__ == "__main__":
    main()
