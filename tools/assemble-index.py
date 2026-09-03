#!/usr/bin/env python3
"""Assemble modular HTML partials into Index.local.html for XAMPP/local preview.

GAS uses Index.html with <?!= include(...) ?> templates.
Local browsers cannot evaluate those tags — run this script instead.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if ROOT.name == "tools":
    ROOT = ROOT.parent

VIEWS = [
    "ViewAnalytics",
    "ViewClientStatus",
    "ViewBilling",
    "ViewAccessCode",
    "ViewUsers",
    "ViewProductionOps",
]


def read(name: str) -> str:
    return (ROOT / f"{name}.html").read_text(encoding="utf-8")


def expand_ops() -> str:
    ops = read("PageOps")
    for view in VIEWS:
        path = ROOT / f"{view}.html"
        if not path.exists():
            continue
        token = f'<?!= include("{view}"); ?>'
        ops = ops.replace(token, read(view))
    return re.sub(r'<\?!=\s*include\("[^"]+"\);\s*\?>', "", ops)


def main() -> None:
    chunks = [
        "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n",
        "<meta charset=\"UTF-8\"/>\n",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n",
        "<title>FA Studio Portal</title>\n",
        '<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet"/>\n',
        read("Styles"),
        read("ThemeBoot"),
        "</head>\n<body>\n",
        read("PartialsNav"),
        read("PageHome"),
        expand_ops(),
        read("PageGallery"),
        read("PageFaq"),
        read("PageBooking"),
        read("PartialsOverlays"),
        read("ScriptsCore"),
        read("ScriptsBooking"),
        read("ScriptsPortal"),
        read("ScriptsOps"),
        read("PartialsMobileNav"),
        "\n</body>\n</html>\n",
    ]
    out = ROOT / "Index.local.html"
    out.write_text("".join(chunks), encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
