#!/usr/bin/env python3
import os
import sys
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


def add(zf: ZipFile, full: str, base: str) -> None:
    rel = os.path.relpath(full, base)
    if os.path.islink(full):
        info = ZipInfo(rel)
        info.create_system = 3
        info.external_attr = (0o120777 & 0xFFFF) << 16
        zf.writestr(info, os.readlink(full))
        return
    if os.path.isdir(full):
        info = ZipInfo(rel + "/")
        info.create_system = 3
        info.external_attr = (0o40755 & 0xFFFF) << 16
        zf.writestr(info, "")
        return
    zf.write(full, rel, compress_type=ZIP_DEFLATED)


def main() -> None:
    app, zip_path = sys.argv[1], sys.argv[2]
    base = os.path.dirname(app)
    with ZipFile(zip_path, "w") as zf:
        for root, dirs, files in os.walk(app, followlinks=False):
            for name in dirs:
                add(zf, os.path.join(root, name), base)
            for name in files:
                add(zf, os.path.join(root, name), base)


if __name__ == "__main__":
    main()
