#!/usr/bin/env python3
"""Gộp src/ thành 1 file index.html duy nhất (dễ deploy)."""
import pathlib, zipfile
here = pathlib.Path(__file__).parent
src = here / "src"
html = (src / "index.html").read_text(encoding="utf-8")
css = (src / "style.css").read_text(encoding="utf-8")
js = "\n".join((src / f).read_text(encoding="utf-8") for f in ["data1.js", "data2.js", "data3.js", "data4.js", "app.js"])
out = html.replace("/*CSS*/", css).replace("/*JS*/", js)
(here / "index.html").write_text(out, encoding="utf-8")
with zipfile.ZipFile(here / "ban-do-kiem-tien-cloudflare.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.write(here / "index.html", "index.html")
print("OK", len(out) // 1024, "KB")
