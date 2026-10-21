#!/bin/sh
# 全部の帳票の Excel をブラウザで書き出し、XSD で検査し、LibreOffice で PDF・画像にする（印刷と見比べる）。
# 先にリポジトリで配信しておく： cd <taiyo-mitsumori> && npx http-server . -p 5599 -c-1 --silent
# usage: sh run-all.sh <出力フォルダ> [url]
# 検査のスクリプトは taiyo-excel-export スキルの scripts（場所は環境変数 XL_SCRIPTS、既定は隣のスキル）
OUT=${1:?出力フォルダ}
URL=${2:-http://localhost:5599/}
HERE=$(cd "$(dirname "$0")" && pwd)
XL=${XL_SCRIPTS:-$HERE/../../taiyo-excel-export/scripts}
mkdir -p "$OUT" && OUT=$(cd "$OUT" && pwd)
cd "$HERE" || exit 1
for m in quote proposal kaitei; do
  timeout 200 node harness.js "$URL" $m "$OUT/$m" "download=📗 Excel保存" 2>&1 | grep -i "error\|PAGE"
  timeout 200 node harness.js "$URL" $m "$OUT/$m" "btn=印刷（社内用）" "dlsel=#print-toolbar-excel" 2>&1 | grep -i "error\|PAGE"
done
# 年間コスト試算書（提案資料の画面で、旧単価と月間使用個数を入れてから）
timeout 200 node harness.js "$URL" quote "$OUT/estdoc" "btn=📊 提案資料を作成" "fillall=旧|3100,2000,1100,,700,5000" "fillall=月間|40,25,30,,60,10" "btn=📊 試算書を作成" 'dlsel=div.fixed button:has-text("📗 Excel保存")' 2>&1 | grep -i "error\|PAGE"
cd "$OUT" || exit 1
for d in quote proposal kaitei estdoc; do
  for f in "$d"/*.xlsx; do
    [ -f "$f" ] || continue
    case "$(basename "$f")" in 社内用*) k=internal ;; *) k=doc ;; esac
    cp "$f" "${d}_${k}.xlsx"
  done
done
if [ -f "$XL/validate.py" ]; then python3 -I "$XL/validate.py" ./*.xlsx; else echo "validate.py が見つからないので XSD の検査を飛ばした（XL_SCRIPTS に taiyo-excel-export の scripts を指定）"; fi
timeout 300 soffice --headless --convert-to pdf ./*.xlsx --outdir . > /dev/null 2>&1
for p in ./*.pdf; do pdftoppm -r 70 -png "$p" "${p%.pdf}"; done
ls ./*.png
