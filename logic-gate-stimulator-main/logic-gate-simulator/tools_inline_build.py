from pathlib import Path
import re

root = Path(__file__).parent
index = root / "client" / "index.html"
dist = root / "dist" / "public"
html = (dist / "index.html").read_text()

for href in re.findall(r'<link[^>]+href="([^"]+)"[^>]*>', html):
    if href.startswith("/"):
        css_path = dist / href.lstrip("/")
        if css_path.exists():
            css = css_path.read_text()
            html = re.sub(r'<link[^>]+href="' + re.escape(href) + r'"[^>]*>', f"<style>\n{css}\n</style>", html, count=1)

for src in re.findall(r'<script[^>]+src="([^"]+)"[^>]*></script>', html):
    if src.startswith("/"):
        js_path = dist / src.lstrip("/")
        if js_path.exists():
            js = js_path.read_text()
            html = re.sub(r'<script[^>]+src="' + re.escape(src) + r'"[^>]*></script>', lambda _match: f"<script>\n{js}\n</script>", html, count=1)

html = html.replace('<script type="module">', '<script>')
html = html.replace('<html lang="en">', '<html lang="en">\n  <!-- Logic//Lab standalone build: open this file directly or place it in any static GitHub Pages repository. -->')
(root / "index.html").write_text(html)
print(f"Created {root / 'index.html'} ({len(html):,} bytes)")
