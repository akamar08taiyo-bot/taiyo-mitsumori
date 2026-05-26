// JSX を事前コンパイルしてブラウザ読込を高速化するビルドスクリプト
// 入力: ../index.html (text/babel ブロックを含む)
// 出力: ./index.html (text/babel → text/module + 圧縮済み JS, Babel CDN除去)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = process.argv[2] || path.join(__dirname, '..', 'index.html');
const DST = process.argv[3] || path.join(__dirname, 'index.html');

(async () => {
  const html = fs.readFileSync(SRC, 'utf8');
  const re = /(<script type="text\/babel"[^>]*>)([\s\S]*?)(<\/script>)/;
  const m = html.match(re);
  if (!m) { console.error('text/babel script not found'); process.exit(1); }
  const jsx = m[2];
  console.log(`JSX size: ${jsx.length} bytes`);

  // esbuild で JSX → ES2020 に変換（依存はインライン化せず importmap で解決）
  const built = await esbuild.transform(jsx, {
    loader: 'jsx',
    format: 'esm',
    target: 'es2020',
    jsx: 'transform',
    minify: true,
    legalComments: 'none',
  });
  console.log(`Compiled size: ${built.code.length} bytes (minified)`);

  let out = html.replace(m[0], `<script type="module">${built.code}</script>`);
  // Babel-standalone のCDN読込を削除（不要になったため）
  out = out.replace(/<script src="https:\/\/unpkg.com\/@babel\/standalone[^"]*"><\/script>\s*\n?/g, '');
  // ローディングテキストを更新（プリコンパイル版）
  out = out.replace(/見積書作成システムを読み込み中…<\/div>\s*<div style="font-size:12px;color:#64748b;">初回読込は10〜20秒かかります<\/div>/, '見積書作成システムを読み込み中…</div><div style="font-size:12px;color:#64748b;">初回数秒で表示されます</div>');

  fs.writeFileSync(DST, out);
  console.log(`Built: ${DST} (${out.length} bytes)`);
})().catch(e => { console.error(e); process.exit(1); });
