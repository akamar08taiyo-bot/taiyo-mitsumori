---
name: mitsumori-design
description: 日本のB2B業務アプリ（見積書・提案書・帳票系）のデザインシステム。太陽シルバーサービス見積アプリで確立した画面UI・A4印刷帳票・操作パターンの設計規約。見積書/請求書/比較表など「入力画面＋印刷帳票」を持つ業務アプリのUI設計・印刷レイアウト・React実装をするときに使う。
---

# 見積・帳票系B2Bアプリのデザインシステム（御見積デザイン言語）

日本の中小企業向け業務アプリで実証済みのデザイン言語。
「画面は機能的なカラフル、印刷は明朝ネイビーの企業文書」という2層構造が核。

## 設計原則（5箇条）

1. **画面と紙は別人格** — 画面UIはTailwindの機能色で操作性優先、印刷帳票は明朝＋ネイビーで「会社の顔」。同じデータでもトーンを切り替える。
2. **数字は右揃え・桁揃え・等高** — 金額セルは `text-right tabular-nums`、全セル `h-9`(36px) 固定、ヘッダーは `pr-4` で入力欄内の数字と右端をピクセル一致させる。
3. **色は識別のため、装飾のためではない** — 機能ごとに1色相（保存=blue、破棄=rose、共有=fuchsia…）。グラデーション・リング等の装飾は使わない。単色600番＋白文字。
4. **展開は常に1つ** — フォルダ/カテゴリのアコーディオンは排他（新しく開くと前が閉じる）。画面の縦爆発を防ぐ。
5. **書けたものは必ず読める** — 保存は必ずID照合で書き戻し先を確認し、空振り時は成功トーストではなくエラーを出す。

## カラーシステム

### 画面（Tailwind）
| 用途 | 色 |
|---|---|
| 新規作成・成功 | emerald-600 |
| 保存 | blue-600 / 上書き teal-700 |
| 破棄・削除・閉じる | rose-600 |
| 印刷 | sky-600（社内用は cyan-800 で濃く区別） |
| PDF | indigo-600 |
| 一覧・管理 | teal-600 |
| 共有（営業所） | fuchsia-600 |
| ビューア・メーカー | purple-600 |
| 価格改定モードのアクセント | amber（トグル・枠・見出し） |

ボタン共通形：`bg-{color}-600 hover:bg-{color}-700 text-white px-3.5 py-2.5 rounded-md shadow-sm text-sm font-bold transition`

### フォルダ3色体系（区別が一目で付く）
- 施設フォルダ: `bg-gradient-to-r from-blue-100 to-sky-50 border-l-4 border-l-blue-500`
- 営業所共有: emerald系（見出し bg-emerald-100）
- メーカー: purple系（見出し bg-purple-100）

### 印刷（企業文書パレット）
| 役割 | 色 |
|---|---|
| タイトル・強調 | #1e3a8a (navy-800) |
| 準強調 | #1e40af / #2563eb |
| 罫線・枠 | #93c5fd / #bfdbfe |
| 背景タイント | #f0f7ff / #eff6ff / ゼブラ #f8fbff |
| 本文 | #1f2937 / 補足 #4b5563 |
| 値上げ=赤 #c0392b、値下げ=緑 #15803d |

## タイポグラフィ

- 画面: システムsans。表は text-xs〜text-sm、入力値 text-sm。太字は見出し・ボタンのみ。
- 印刷: `'BIZ UDPMincho','Yu Mincho','Hiragino Mincho ProN',serif` 全体 9.5pt / 行間1.6。
  - 帳票タイトル: 22pt, letter-spacing 0.5em, navy, 下線1.5px #3b82f6
  - 宛先(御中): 15pt + サフィックス10.5pt青
  - 発行元ボックス: 8-8.5pt
  - 表本文: 10pt、数値セル 9pt、備考 8.5pt 左ボーダー付き

## 画面UIパターン

### 入力テーブル規約
- 全入力/表示セルは `h-9`(36px) に統一し、表示専用セルは `flex items-center justify-end` のdivで描く（inputと同じ枠色・角丸）。
- 数値は `tabular-nums`、単価は5桁(¥10,000)が入る `w-[100px]` を標準に。
- 数値列ヘッダーは `pl-2 pr-4 text-right` — td(px-2)+input内(px-2)=16px と一致し右端が揃う。
- 商品名列は `min-w-[260〜360px]` で最優先確保。
- 自動計算セルは背景タイントで「入力不可」を示す（改定後=amber-50、○○単価=blue-50/100）。
- 派生値の逆編集を許す（値上がり率を入力→単価を逆算）。onChange即時計算、追加ボタン不要。

### 備考（メモ）行
- 商品名の右に「▶ 備考 / ▼ 備考」トグル。開くと colspan の**独立行**に入力欄（`max-w-[640px]`）。
- 他の列の位置・高さを絶対に動かさない。入力済みなら自動で開いた状態。

### ナビゲーション
- 2段階チューザ：大分類（見積一覧/仕切り一覧）をカード2枚で選択→一覧へ。戻るは上部タブ切替＋「⊞ 選択画面」。
- アコーディオンは排他（開くのは常に1つ、state は「開いている名前 or null」の単一文字列）。
- 一定時間(3分)放置で選択画面へ自動復帰（setTimeout + クリーンアップ）。
- 状態バッジ：「🏢 営業所共有データ編集中」のように編集コンテキストをピル表示。fuchsia-100/800。

### トグル
role="switch" の丸ノブ式。ON時は機能色（amber-600等）、OFF時は slate-200。右に「ON（印刷に出す）」等の状態ラベル。

## 印刷帳票デザイン（A4縦・WYSIWYG）

### 構造テンプレート
```
.doc(width:210mm; min-height:297mm; padding:12-14mm) 
└ .page(max-width:180mm)
   ├ .doc-header(flex)
   │   ├ .left(flex:1): タイトル → 宛先「◯◯ 御中」 → 挨拶文(8.5pt)
   │   └ .right(70mm固定): 発行日 → 会社名/営業所/住所/TEL/FAX/登録番号/所長/担当
   │       └ .stamps: 所長印・担当印の 15mm 角枠（border #93c5fd）
   ├ .items-table(table-layout:fixed + colgroup)
   └ .bottom-remarks(備考枠)
```

### 帳票テーブル
- `table-layout:fixed` + `<colgroup>` で列幅を%指定。**商品名列 44〜64%**（列数で動的配分、数値列は10-12%）。
- 商品名セル: `overflow-wrap:anywhere; word-break:break-word;` 9.5pt/1.45 — 長名でも枠内で折り返す。
- ヘッダー: bg #dbeafe / navy文字 / 8.5pt。ゼブラ: 偶数行 #f8fbff。
- 数値: 右揃え tabular-nums nowrap 9pt。
- 列のON/OFF（値上がり率トグル等）は colgroup/thead/行を条件生成し、幅を再配分。

### 印刷の実装レシピ（React/単一HTML）
```js
// 1. HTML文字列を組み立て（escapeHTML必須）
// 2. #print-content-holder に注入、プレビューは実寸210mmページ＋box-shadow
// 3. @media print で body* を visibility:hidden、holderのみ表示
@page { size: A4 portrait; margin: 0; }   // 余白はdoc側のpaddingで持つ
#holder { position:absolute; width:210mm; }
// 4. ツールバー（🖨️印刷 / ✕閉じる）を fixed 右上に
// 5. PDFは offscreen holder + html2canvas(scale:2) + jsPDF
```
- 色を確実に出す: `-webkit-print-color-adjust:exact`
- 非表示フラグ(isHiddenFromPrint)の行は画面で薄く・印刷では完全除外。
- 帳票タイトルは編集可能なstateを使い、モード別デフォルト（見積=御見積書、価格改定=御見積り）。

## データ・保存のUXルール

- 上書き保存は書き戻し先をID照合で確認。共有データ由来なら共有側マスタを更新（別ファイルを作らない）し、由来をバッジで常時表示。
- 見つからなければ成功トーストを出さずエラー＋代替案内（「名前を付けて保存してください」）。
- 破壊操作は confirm に「何が消え、何が残るか」を明記。フォルダ統合D&Dは「データは削除されません」と書く。
- ドラッグ元IDは useRef で同期保持（onDropのstale closure対策）。

## 品質チェックリスト

- [ ] 行の全セルが同じ高さ・同じtopに並ぶ（実測で確認）
- [ ] 数値列ヘッダーの右端＝入力欄内の数字の右端（diff 0px）
- [ ] 5桁金額がカンマ込みで欠けず表示
- [ ] 印刷docの実測幅=210mm、表がdocからはみ出さない
- [ ] 長い商品名で印刷しても折り返しが崩れない
- [ ] 保存→リロード→読込で全フィールド・モードが復元
- [ ] 非表示行が画面(薄)・印刷(除外)で正しく扱われる
- [ ] エラー0（ErrorBoundary+window.__appErrors計測）
