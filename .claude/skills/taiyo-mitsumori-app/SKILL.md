---
name: taiyo-mitsumori-app
description: 太陽シルバーサービスの業務アプリ「見積・提案書作成」（リポジトリ akamar08taiyo-bot/taiyo-mitsumori、公開は https://akamar08taiyo-bot.github.io/taiyo-mitsumori/ 、太陽ポータルの先頭のタイル）を直す・機能を足す・公開するときに必ず使う。病院・施設向けの介護用品・消耗品の御見積書・提案書（ケース入数・○○単価）・価格改定のご案内（改定前／改定後・値上がり率）・社内用（仕切り・利益、比較表）・年間コスト試算書、見積もり一覧・メーカー仕切り一覧・営業所共有、印刷・PDF保存・📗 Excel保存、提案資料、ログイン（営業所・名前・パスワード）、Firebase の話が出たら、アプリ名を言われなくても使う。1ファイルの src/index.html を直してビルドする手順、Excel 出力の関数、架空データでのブラウザの確かめ方（スクリプト付き）、公開の状態と落とし穴がまとまっている。似た名前のものと取り違えない：消耗品売上管理の見積書作成・発注書・価格改定（taiyo-uriage-bunseki-app）、価格改定・休暇案内作成ツール、チラシ作成（消耗品）の quote.html（画面の見出しが同じ「見積・提案書作成」。taiyo-shohin-chirashi-app）、住宅改修の見積書（taiyo-jutaku-mitsumori-app）、特定福祉用具（taiyo-tokutei-app）は別のアプリ。
---

# 見積・提案書作成（taiyo-mitsumori）

太陽シルバーサービス㈱の営業担当が、病院・施設向けの見積書などを作るアプリ。依頼してくるのは行橋営業所の担当者（プログラマーではない。返事は短い：「入ります」「公開して」）。
このスキルは 2026年10月のセッション（全部の帳票を Excel でも保存できるようにした）までの知識をまとめたもの。

ポータル全体に共通のこと（公開の流れ・ユーザーの好み・報告のしかた）は `taiyo-portal` スキル、Excel の作り方と確かめ方の詳しいことは `taiyo-excel-export` スキルにある（入っていれば一緒に読む）。

## まず全体をつかむ

| もの | 場所 |
|---|---|
| ソース | `akamar08taiyo-bot/taiyo-mitsumori` の `src/index.html`（約8,160行の1ファイル。React は `<script type="text/babel">` の中）。**直すのはここ** |
| ビルドしたもの | ルートの `index.html`（約1.8MB）。これもコミットする（GitHub Pages が main のルートを配信。`.nojekyll` あり） |
| ビルド | `build.js`（esbuild で JSX と依存を1ファイルに、Tailwind を静的な CSS に、CDN のタグを外す）。`package.json` の scripts は `build` だけ |
| デザインの決まり | `DESIGN.md`（「画面は機能ごとの色、紙は明朝とネイビー、数字は右揃え」。Excel 出力の節とチェックリストもある）。画面・帳票を変える前に読む |
| データ | localStorage（`taiyo_proposals_v1`・`taiyo_draft_v1`・`taiyo_login_v1`・`taiyo_office_info_v1`・`taiyo_users_v1` など）と Firebase RTDB（`database.rules.json`・`firebase.json`）。**テストで本番の Firebase につながない** |
| 公開 | main に push → 「pages build and deployment」。ポータルのタイル `name:'見積・提案書作成'` はこの URL を開くだけ（ポータルの `jutaku-mitsumori/` は住宅改修の別のアプリ） |

詳しいことは必要になったときに読む：
- コードの地図・Excel 出力の関数・帳票ごとの作り → `references/codebase.md`
- ビルド・ブラウザでの確かめ方（`scripts/`）・Excel の確かめ方・公開とデプロイの確かめ方 → `references/build-test-publish.md`

## 画面と帳票

- ログイン：営業所（19か所）→ 名前 → パスワード。ポータルと同じサイトなので、ポータルの `taiyo_portal_session` から営業所を最初に選んでおく。
- モードは3つ（`appMode`）：見積作成（quote）・提案書作成（proposal）・価格改定（kaitei）。
- 帳票は5種類、どれも 印刷・PDF・Excel：①御見積書 ②提案書（ケース入数・○○単価）③価格改定（改定前／改定後・○○単価・差額・値上がり率）
  ④社内用（仕切りと利益まで。価格改定のときは比較表。A4横）⑤年間コスト試算書（月間使用個数から。棒グラフ・円グラフ付き）。
- Excel のボタンは4か所（文字が場所で違う）：ツールバーと提案資料の画面（試算書）は「📗 Excel保存」、各印刷プレビューは「📗 Excelで保存」（`#print-toolbar-excel`）、見積もり一覧のカードは「📗 Excel」（見積を開いてから保存）。

## 直すときの流れ

1. `src/index.html` を直す（ビルドした `index.html` は直接直さない）。コメントは日本語で「なぜ」を書く。
2. 帳票を変えるなら、印刷と Excel の両方を同じ `prepare…Data`（`prepareQuotePrintData`・`prepareKaiteiPrintData`・`prepareEstimateDocData`）から作る。片方だけ直さない。
3. `npm install` → `npm run build`。`package-lock.json` はリポジトリに入れていない（.gitignore）ので、ソースを変えなくても依存の版が動いて `index.html` が変わることがある（165行の差が出た）。
   **直す前に一度ビルドして `git diff --stat index.html` で依存の版による差を見ておき**、自分の変更による差と分ける。ビルドのあとは動くことをブラウザで確かめる。
4. ブラウザで確かめる（`scripts/harness.js`。架空のデータ・localhost 以外の通信を止める）。Excel は XSD・LibreOffice の再計算・画像で印刷と見比べる。
5. `src/index.html` と `index.html` を同じコミットに入れて、作業用のブランチに push する。**main への push は本番の公開**なので、ユーザーの「公開して」のあと。

## Excel 出力（要点。詳しくは `references/codebase.md`）

- Office Open XML を手で書く（zip だけ fflate の `zipSync`・`strToU8`）。ファイルはブラウザの中で作り、どこにも送らない。共通の部品は `createXlsxBook()`（`// ===== Excel（.xlsx）出力` から LoginScreen の前まで）。
- 帳票ごとの関数：`buildQuoteXlsx`（見積書・提案書）・`buildKaiteiXlsx`・`buildInternalXlsx`・`buildEstimateDocXlsx`。入口は `handleExcel(kind)`（'doc'・'internal'・'estimate'）。一覧のカードからは `pendingExcelProp` を経由。
  ファイル名は `xlFileName`（PDF と同じ形「宛先_日付.xlsx」。価格改定は「価格改定_」、社内用は「社内用_」、試算書は「年間コスト試算書_」が前に付く）。
- 金額は式＋開いた時点の値（キャッシュ）。丸めは JS の `Math.round` に合わせる（負の数は `INT(x+0.5)`。`xlRoundF`）。式が 8000 字を超えるときは値だけ。
- 書体は `BIZ UDP明朝 Medium`（試算書だけ `游ゴシック`）。字の幅は実測（`XL_ASCII_EM`・`xlTextEm`）、折り返しは使える幅を 0.93 倍で見積もる（字体が置き換わる PC で行が増えるので）。
  数値セルは「縮小して全体を表示」にして ### を出さない。題名の字間は文字の間に半角スペース（10字以下だけ。入らなければ詰めて縮小）。
- 印刷設定：A4、横1ページ（fitToWidth=1・fitToHeight=0）、左右中央（社内用だけ `hCenter:false`）。余白（mm）は見積書・提案書・価格改定 左右22・上17・下15、社内用（横）8、試算書 16。見出し行の繰り返しは価格改定と社内用。
- 値上がりの赤・値下がりの緑は条件付き書式。試算書のグラフは Excel のグラフ（元データは印刷範囲の外の H〜I 列）。

## ユーザーの好み（このアプリで言われたこと）

- 依頼：「見積もりが PDF で出力となっているため、Excel ベースで（印刷できるように）…文字は一番近いもの・類似しているものに…Excel 出力機能を全て付け加えて」。「全て」は全部の帳票。
- 中身は印刷・PDF と同じ並び・色・枠・値。金額は Excel の式で、開いた時点の値は PDF と同じ。
- ボタンの色は DESIGN.md に従う（ツールバーはほかの出力と同じ灰色、印刷プレビューは緑 #15803d。一覧のカードの薄い緑はコードにだけある）。住宅改修で言われた「控えめな色」は、このアプリでは頼まれたら合わせる（新しく濃い色は足さない）。
- 画面に説明文を足さない（説明は「その他▾」の使い方ガイドとタイルの使い方の文へ）。
- 報告はやさしい日本語で、架空のデータで作った見本の .xlsx と、印刷と並べた画像を付け、会社の Excel で一度開いてもらう。

## 落とし穴

- `<t xml:space="preserve">` は先頭・末尾に空白や改行があるときだけ付ける（XSD の検査で引っかかった。Excel も同じ書き方）。
- 太字の「4,000 ml」が ### になった → 字の幅を fontTools の実測にし、数値セルを縮小表示に。行の高さは 409pt まで。
- 発行元ボックスの日付が切れる → 縮小表示。御見積金額の小数は値に合わせて桁を出す。備考のメモの改行は印刷と同じく空白1つ。長い価格改定の題名は字間をあけずに縮小。
- XML に書けない文字を除く正規表現は `\uFFFE\uFFFF` のようにエスケープで書く（文字そのものを書かない）。
- `src/index.html` の importmap には jspdf・html2canvas・fflate・firebase/auth が入っていない → ブラウザで試すときはビルドした `index.html` を使う。
- Playwright：印刷の afterprint の後片付けでプレビューが消える（`window.print` を止める）、印刷ボタンに 800ms の二重押し防止、初回に使い方ガイドが開く（Esc）、モーダルの裏のボタンを押さないようセレクタを絞る、
  日本語のダウンロード名は `LANG=C.UTF-8` で（harness.js はそうしている）。
- main への push とポータルの `git pull` は、作業環境の安全確認（本番への公開）で止められたことがある。回り道をせず、ユーザーに聞く。

## これから（2026-10-21 の時点）

1. **Excel 保存はまだ公開していない。** `claude/excel-export`（0d4e3e3）は main（0ad1b7a）より1コミット先で、早送りでマージできる。ユーザーの「公開して」を待っている。
   公開の手順は `references/build-test-publish.md` の4（main が動いていないか確かめる → 早送りで push → Pages の success → ポータルのタイルの使い方の文に Excel 保存を足す）。
2. 会社の Excel で警告が出ないか、BIZ UDP明朝 Medium の無い PC でどう見えるか（どちらもまだ）。
3. 別のセッションの PR #1（デバッグ修正：保存容量・金額の端数・税の備考。2026-09-29）が開いたまま。
