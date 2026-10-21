# ビルド・確かめ方・公開（見積・提案書作成）

## 1. 用意

新しいセッションでは、リポジトリを足して clone する（`add_repo` → `git clone https://github.com/akamar08taiyo-bot/taiyo-mitsumori /home/user/taiyo-mitsumori` → `register_repo_root`）。
作業の前に `git fetch` して main と作業用のブランチを見る（ほかのセッションの PR・ブランチもある）。

```sh
cd /home/user/taiyo-mitsumori
npm install                 # package-lock.json はリポジトリに入れていない
npm run build               # = node build.js → ルートの index.html
git diff --stat index.html  # 直す前のビルドで差が出たら、それは依存の版の違い（自分の変更と分けて考える）
```

## 2. ブラウザで確かめる（このスキルの `scripts/`）

リポジトリにテストはない。架空のデータを localStorage に入れて、本物のブラウザで帳票を書き出して確かめる。
`harness.js` は localhost 以外の通信を全部止める（本番の Firebase につながない）・`window.print` を止める・ダウンロードの名前を記録する。

```sh
# ビルドした index.html を配信（Bash の run_in_background で動かす。終わったら止める）
cd /home/user/taiyo-mitsumori && python3 -m http.server 5599 --bind 127.0.0.1   # または npx http-server . -p 5599 -c-1 --silent
S=<このスキル>/scripts; O=<スクラッチパッド>/out
node $S/harness.js http://localhost:5599/ quote $O/quote "download=📗 Excel保存"          # 見積書の Excel
node $S/harness.js http://localhost:5599/ kaitei $O/kaitei "btn=印刷（社内用）" "holdershot=internal" "dlsel=#print-toolbar-excel"
sh $S/run-all.sh $O/all     # 全部の帳票（見積・提案・価格改定 × 帳票と社内用、年間コスト試算書）→ XSD → LibreOffice で PDF・画像
sh $S/run-edge.sh $O/edge   # 端のケース（testdata-edge.js：長い品名・記号・大きな金額・38行で複数ページ・空のカテゴリ など）
node $S/mobile.js $O/mobile # iPhone 13 の幅
```

2026-10-21 に run-all.sh を動かして、7つの Excel（見積・提案・価格改定の帳票と社内用、試算書）が XSD の検査に通り、式 112 個の計算し直しでずれ 0 だった。

- データ：`testdata.js`（見積・提案・価格改定の見本）、`testdata-edge.js`（端のケース）、`testdata-saved.js`（見積もり一覧に保存済みの2件。一覧のカードの「📗 Excel」を試す）。`TESTDATA=` で選ぶ。名前・宛先は架空。
- Playwright の場所は `PLAYWRIGHT_DIR`（CommonJS の require で読むのでフォルダ。既定は `/opt/node-tools/node_modules/playwright` か `/opt/node22/lib/node_modules/playwright` のあるほう）。
  ほかのアプリの e2e（住宅改修・特定福祉用具）は ESM の `PLAYWRIGHT`（index.mjs のパス）なので、名前が違う。
- 入力途中の行（まだ「追加」していない行）は、下書きの `quoteNewItems` に入れても画面の入力欄には戻らない（印刷・Excel は state の `newItems` を見る）。
  試すときは harness の `fillall=<placeholder>|値,値` で入力欄に打ってから保存し、できた xlsx を `unzip -p … xl/sharedStrings.xml | grep` で確かめる。
- 印刷を変えていないこと：変える前のビルドはコミットされている（`git show HEAD:index.html > <スクラッチパッド>/before/index.html`）。それを別のポートで配信し、
  同じ操作の `holdershot`（印刷のプレビューの HTML を `.html` で保存）を前と後で `cmp` する。
- スマホの幅（390px）とパソコン（1500px）のスクリーンショットを見て、横にはみ出していないか確かめる。

## 3. Excel を確かめる（`taiyo-excel-export` スキルの scripts）

新しい作業環境では先に `sh setup-fonts.sh`・`sh fetch-xsd.sh` を動かす（XSD が無いと validate.py が止まる）。
run-*.sh は検査のスクリプトを環境変数 `XL_SCRIPTS`（既定は隣の taiyo-excel-export/scripts）から探す。

- XSD の検査（ECMA-376。結合の重なり・結合の中の値・行の高さ 409pt も）：`python3 -I validate.py *.xlsx` → ALL VALID / EXCEL CHECKS OK。
- 式の計算し直し（LibreOffice UNO）：`python3 recalc.py *.xlsx` → キャッシュ値との不一致 0（2026-10 は 218 式で 0）。
- 見た目：`soffice --headless --convert-to pdf *.xlsx` → `pdftoppm -r 70 -png` で画像にし、印刷の PDF と並べて見る。字体は BIZ UDP明朝 を入れて置き換える（`taiyo-excel-export` の手順）。
- 本物の Excel では開けないので、最後はユーザーに会社の Excel で見本を開いてもらう。

## 4. 公開（main → GitHub Pages）

**ユーザーが「公開して」と言ってから。** 作業環境の安全確認で止められたら回り道をしない。

1. `git fetch origin main` で main が動いていないか見る（作業用のブランチが main の先にあり、早送りできること：`git merge-base --is-ancestor origin/main <ブランチ>`）。
2. `git push origin <ブランチ>:main`（早送り）。
3. デプロイの確かめ：github.io はこの作業環境から見えない。GitHub MCP の `actions_list`（`list_workflow_runs`、owner `akamar08taiyo-bot`、repo `taiyo-mitsumori`、perPage 3）で、
   自分の head_sha の「pages build and deployment」が completed／success になるのを見る。走っている間は `actions_get`（`get_workflow_run`）。
4. ポータルのタイルの使い方の文（`taiyo-portal/index.html` の `name:'見積・提案書作成'` の usage）に新しい機能を足し、ポータルの master に push → ポータルの Pages も確かめる（`taiyo-portal` スキル）。
5. ユーザーへ：スマホで古い画面が出たら、その他▾ → 🛠 トラブルシューティング → 🔄 強制再読込。
