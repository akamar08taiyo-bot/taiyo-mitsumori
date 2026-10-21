#!/bin/sh
# 端のケース（長い品名・改行・記号・大きな金額・税込だけ・入力途中の行・空のカテゴリ・38行で複数ページ）で Excel を書き出して検査する。
# usage: sh run-edge.sh <出力フォルダ> [url]（先に npx http-server . -p 5599 -c-1 --silent）
OUT=${1:?出力フォルダ}
URL=${2:-http://localhost:5599/}
HERE=$(cd "$(dirname "$0")" && pwd)
XL=${XL_SCRIPTS:-$HERE/../../taiyo-excel-export/scripts}
mkdir -p "$OUT" && OUT=$(cd "$OUT" && pwd)
cd "$HERE" || exit 1
export TESTDATA=$HERE/testdata-edge.js
timeout 200 node harness.js "$URL" quote "$OUT/quote" "download=📗 Excel保存" 2>&1 | grep -i "error\|PAGE"
timeout 200 node harness.js "$URL" kaitei "$OUT/kaitei" 'sel=button[role=switch]@0' 'sel=button[role=switch]@2' "download=📗 Excel保存" 2>&1 | grep -i "error\|PAGE"
timeout 200 node harness.js "$URL" proposal "$OUT/proposal" 'sel=input[type=checkbox]@0' 'sel=input[type=checkbox]@1' "download=📗 Excel保存" 2>&1 | grep -i "error\|PAGE"
cd "$OUT" || exit 1
for d in quote kaitei proposal; do cp "$d"/*.xlsx "$d.xlsx"; done
if [ -f "$XL/validate.py" ]; then python3 -I "$XL/validate.py" ./*.xlsx; else echo "validate.py が見つからないので XSD の検査を飛ばした（XL_SCRIPTS に taiyo-excel-export の scripts を指定）"; fi
timeout 300 soffice --headless --convert-to pdf ./*.xlsx --outdir . > /dev/null 2>&1
for p in ./*.pdf; do pdftoppm -r 60 -png "$p" "${p%.pdf}"; done
ls ./*.png | tr '\n' ' '
