#!/usr/bin/env python3
"""Build the two Drabuff AI pages: full HTML for the zip packages + fragment for artifact preview."""
import base64, os, shutil, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'dist')

# Contact shown on both pages. webhook: optional URL (Google Apps Script, n8n…) to receive leads as JSON.
CONTACT = "window.DRABUFF={brand:'Drabuff AI',zalo:'0934041114',display:'093.404.1114',webhook:''};"

PAGES = {
    'drabuff-ai-thiet-ke-khoa-hoc': {
        'title': 'Drabuff AI Course Designer',
        'desc': 'Thiết kế khóa học AI Inhouse cho doanh nghiệp — Drabuff AI',
        'config': 'course.js',
        'accent': '--acc:#45E3FF;--acc-d:#1FB5D8;--acc-dd:#0A6377;--acc-ink:#021419;--acc-glow:rgba(69,227,255,.5);'
                  '--acc-soft:rgba(69,227,255,.08);--acc-soft2:rgba(69,227,255,.18);--acc2:#9B8CFF;--acc2-soft:rgba(155,140,255,.18);',
        'status': 'AI COURSE DESIGNER',
    },
    'drabuff-ai-tu-dong-hoa': {
        'title': 'Drabuff AI Automation Designer',
        'desc': 'Thiết kế quy trình tự động hóa doanh nghiệp bằng AI — Drabuff AI',
        'config': 'auto.js',
        'accent': '--acc:#FFB547;--acc-d:#F08C1E;--acc-dd:#7E4507;--acc-ink:#1C0F00;--acc-glow:rgba(255,181,71,.45);'
                  '--acc-soft:rgba(255,181,71,.08);--acc-soft2:rgba(255,181,71,.18);--acc2:#5B8CFF;--acc2-soft:rgba(91,140,255,.18);',
        'status': 'AUTOMATION DESIGNER',
    },
    'drabuff-ai-ban-do-dich-vu': {
        'title': 'Drabuff AI Service Map',
        'desc': 'Bản đồ toàn bộ dịch vụ AI triển khai cho doanh nghiệp, có sơ đồ quy trình trực quan — Drabuff AI',
        'css': ['base.css', 'catalog.css'],
        'js': ['catalog-data.js', 'catalog-data2.js', 'scene.js', 'catalog.js'],
        'accent': '--acc:#B69CFF;--acc-d:#8E6EF2;--acc-dd:#46308F;--acc-ink:#120A2A;--acc-glow:rgba(182,156,255,.5);'
                  '--acc-soft:rgba(182,156,255,.08);--acc-soft2:rgba(182,156,255,.18);--acc2:#45E3FF;--acc2-soft:rgba(69,227,255,.1);',
        'status': 'AI SERVICE MAP',
    },
}

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Chakra+Petch:wght@500;600;700'
         '&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">')
THREE_CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
THREE_FALLBACK = '<script>window.THREE||document.write(\'<script src="three.min.js"><\\/script>\')</script>'


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def b64(p):
    with open(p, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()


def body(cfg, logo, full):
    css = '\n'.join(read(os.path.join(SRC, f)) for f in cfg.get('css', ['base.css']))
    js_files = cfg.get('js', ['shared.js', cfg.get('config'), 'scene.js', 'app.js'])
    js = '\n'.join([CONTACT] + [read(os.path.join(SRC, f)) for f in js_files])
    return (
        f'<title>{cfg["title"]}</title>\n'
        f'<meta name="description" content="{cfg["desc"]}">\n{FONTS}\n'
        f'<style>\n{css}\n:root{{{cfg["accent"]}}}\n</style>\n'
        '<canvas id="bg3d" aria-hidden="true"></canvas><div class="fx" aria-hidden="true"></div>\n'
        f'<header class="top"><a class="brand" href="#hero" aria-label="Drabuff AI"><img src="{logo}" alt="Drabuff" width="44" height="30">'
        '<span class="bn"><b>DRABUFF AI</b><small>Agency &amp; Academy</small></span></a>'
        f'<div class="top-r"><span class="status"><i></i><span class="st-l">{cfg["status"]} · </span>ONLINE</span></div></header>\n'
        '<main id="app" class="wrap"></main>\n'
        '<footer class="foot"><span><b>Drabuff AI</b> · Đào tạo &amp; triển khai AI cho doanh nghiệp</span>'
        '<span>Zalo: <b>093.404.1114</b></span></footer>\n'
        f'{THREE_CDN}\n' + (THREE_FALLBACK + '\n' if full else '') +
        f'<script>\n{js}\n</script>\n'
    )


def main():
    logo = b64(os.path.join(ROOT, 'assets', 'mark-white.png'))
    os.makedirs(OUT, exist_ok=True)
    for slug, cfg in PAGES.items():
        d = os.path.join(OUT, slug)
        os.makedirs(d, exist_ok=True)
        full = ('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
                '</head>\n<body>\n' + body(cfg, logo, True) + '</body>\n</html>\n')
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(full)
        shutil.copy(os.path.join(ROOT, 'assets', 'three.min.js'), d)
        with open(os.path.join(OUT, slug + '.preview.html'), 'w', encoding='utf-8') as f:
            f.write(body(cfg, logo, False))
        zp = os.path.join(ROOT, slug + '.zip')
        with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
            z.write(os.path.join(d, 'index.html'), 'index.html')
            z.write(os.path.join(d, 'three.min.js'), 'three.min.js')
        print('built', zp, os.path.getsize(zp))


if __name__ == '__main__':
    main()
