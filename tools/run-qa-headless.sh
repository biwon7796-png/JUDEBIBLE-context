#!/bin/bash
# headless(가시성 보장) 로 ?qa=<suite> 를 실행해 리포트를 출력
C="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$C" --headless=new --disable-gpu --window-size=1300,900 --virtual-time-budget=$2 --dump-dom "http://127.0.0.1:8765/index.html?qa=$1&hl=$RANDOM" 2>/dev/null > "F:/Projects/웹앱/tools/_out_$1.html"
python - "$1" <<'PY'
import re,html,sys
n=sys.argv[1]; t=open('F:/Projects/웹앱/tools/_out_'+n+'.html',encoding='utf-8',errors='ignore').read()
m=re.search(r'class="qa"[^>]*>(.*?)</div>',t,re.S) or re.search(r'id="[a-z0-9]+-qa-report"[^>]*>(.*?)</div>',t,re.S)
txt=html.unescape(m.group(1)) if m else 'NO REPORT'
print(txt.split('\n')[0]); print('\n'.join(l for l in txt.split('\n') if l.startswith('FAIL') or '✗' in l))
PY
