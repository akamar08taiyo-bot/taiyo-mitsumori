# コードの地図（見積・提案書作成）

行番号は変わるので、関数名・目印の文字で grep して探す。

## ファイル

| ファイル | 役割 |
|---|---|
| `src/index.html` | ソース（約8,160行）。React 18 の JSX が `<script type="text/babel">` の中にすべて |
| `index.html` | ビルドしたもの（約1.8MB、CDN なし）。コミットする |
| `build.js` | esbuild で JSX と依存（react・lucide-react・jspdf・html2canvas・fflate・firebase）をまとめ、Tailwind 3 の CSS を入れ、CDN のタグを外す |
| `package.json` | 依存（fflate は今回書き足した）と scripts の `build` だけ。`package-lock.json`・`tailwind.output.css` は .gitignore |
| `DESIGN.md` | デザインの決まり（frontmatter `name: mitsumori-design`）。Excel 出力の節とチェックリストの行がある |
| `database.rules.json`・`firebase.json` | Firebase RTDB のルール |
| `.claude/launch.json` | `npx http-server . -p 5599 -c-1 --silent` |
| `見積書作成.txt` | 古いソースの写し（build.js は読まない） |

## 画面

- 上のツールバー：📝 新規作成／名前を付けて保存／上書き保存／✕ 閉じる｜印刷／印刷（社内用）／📄 PDF保存／📗 Excel保存／📊 提案資料を作成｜見積もり・メーカー仕切り一覧｜🏢 営業所共有／📑 仕切りを見ながら｜その他▾（使い方ガイド、🛠 トラブルシューティング → 🔄 強制再読込 など）。
- モード `appMode`：quote・proposal・kaitei。帳票は見積書・提案書・価格改定・社内用・年間コスト試算書。

## Excel 出力（`src/index.html` の中）

共通部（`// ===== Excel（.xlsx）出力` から LoginScreen の前まで）：
- `createXlsxBook()` → `{style, addSheet, toBytes}`。シートは `ws.setCols(mmの配列)`・`ws.height(r, pt)`（409pt まで）・`ws.cell`・`ws.box(r1,c1,r2,c2,値,書式)`（結合して外枠の罫線をまわりのセルに振り分ける）・
  `ws.cf`（条件付き書式）・`ws.rect`（図形。所長印・担当印の 15mm 角など）・`ws.chart`。
- 値：数値／文字／`{rich:[{t, font}]}`／`{f:'式', v:キャッシュ値}`。行・列は 0 始まり。
- 書式：`{font, fill:'RRGGBB', border:{l:'thin:RRGGBB', …}, align:{h, v, wrap, indent, shrink}, fmt}`。同じ書式は使い回す（styles の intern）。
- workbook に `fullCalcOnLoad="1"`、シートに `showGridLines="0"`、定義名 Print_Area／Print_Titles。
- 補助：`xlColWidth`（mm → Excel の列幅。数字の幅 `XL_MDW=10`px）・`XL_ASCII_EM`／`xlTextEm`（BIZ UDP明朝の実測の字幅）・`xlLineCount`（折り返しの行数。使える幅は (w−4)×0.93）・
  `xlFitMm`・`xlRoundF`（JS の Math.round と同じ丸め。負の数は `INT(x+0.5)`）・`xlYenFmt`・`xlDiffFmt`・`xlDecimals`・`xlSpaced`／`xlTitle`（字間）・`XL_C`（印刷と同じ配色）・
  `xlDocColumns`（品名は数値列の手前まで結合、発行元ボックスは右の数値列に重ねる）・`xlDocHeader`（題名・宛名・挨拶・条件・発行元ボックス・所長印と担当印の 15mm 角）・
  `xlBarChartXml`・`xlPieChartXml`・`xlDownload`・`xlFileName`。

帳票ごと（App の中）：
- `buildQuoteXlsx`（見積書・提案書）・`buildKaiteiXlsx`（価格改定）・`buildInternalXlsx`（社内用）・`buildEstimateDocXlsx`（年間コスト試算書。游ゴシック。グラフの元データは印刷範囲の外の H〜I 列）。
- 入口 `handleExcel(kind)`（'doc'・'internal'・'estimate'）。見積もり一覧のカードからは `pendingExcelProp`（見積を開いてから保存）。
- 印刷と同じ明細・合計にするため、計算は `prepareQuotePrintData`・`prepareKaiteiPrintData`・`prepareEstimateDocData` に切り出してあり、印刷と Excel の両方が使う
  （入力途中の行の取り込みと「印刷で隠す」行を外す処理もここ）。

印刷設定：A4、横1ページ（fitToWidth=1・fitToHeight=0）、左右中央。余白（mm）：見積書・提案書・価格改定 左右22・上17・下15／社内用（横）8／試算書 16。見出し行の繰り返しは価格改定と社内用。
書体：`'BIZ UDP明朝 Medium'`（family=1・charset=128 なので、無い PC では Excel が近い明朝体で出す）、試算書は `'游ゴシック'`。

## 帳票を足すとき

`buildXxxXlsx` を作る → `handleExcel` に足す → ボタン（ツールバー・プレビュー・一覧のカード・モーダル）→ 使い方ガイドと `DESIGN.md` のチェックリスト。
計算は `prepare…Data` に置いて印刷と共有する。
