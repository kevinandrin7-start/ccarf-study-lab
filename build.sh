set -e
cd "$(dirname "$0")"
npx tailwindcss -c tailwind.config.js -i tw.css -o out/tw.css --minify >/dev/null 2>&1
npx esbuild src/main.jsx --bundle --format=iife --minify --target=es2019 --alias:react=./shims/react.js --alias:react-dom/client=./shims/react-dom.js --outfile=out/app.js --log-level=warning
python3 - <<'PY'
h=open('head.html').read().replace('<style>/*TW*/</style>','<style>'+open('out/tw.css').read()+'</style>')
js=open('out/app.js').read()
open('out/artifact.html','w').write(h+'<div id="root"><div class="boot">Loading…</div></div>\n<script>'+js+'</script>\n')
head,_,rest=h.partition('<script src')
full='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'+h+'\n</head>\n<body>\n<div id="root"><div class="boot">Loading…</div></div>\n<script>'+js+'</script>\n</body>\n</html>\n'
open('out/index.html','w').write(full)
PY
