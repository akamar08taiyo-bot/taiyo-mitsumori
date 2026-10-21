// 見積・提案書作成をブラウザで動かして、帳票の Excel・PDF・画面を書き出す（架空のデータ。本番の Firebase などにはつながない）。
// 使い方: node harness.js <url> <mode> <outdir> <actions...>
//   mode: quote（見積）・proposal（提案書）・kaitei（価格改定）。データは環境変数 TESTDATA（既定はこのフォルダの testdata.js）
//   actions: download=ボタン名 / dlsel=CSS / btn=ボタン名 / click=文字 / sel=CSS@n / fillall=placeholder|値,値 / holdershot=名前 / closeholder / iframeshot=名前 / shot=名前 / wait=ms / eval=式
// Playwright はリポジトリの依存に入れていない。場所は環境変数 PLAYWRIGHT_DIR（既定はこの作業環境の全体のもの）
const fs = require('fs'); const path = require('path');
const PW = process.env.PLAYWRIGHT_DIR || ['/opt/node-tools/node_modules/playwright', '/opt/node22/lib/node_modules/playwright'].find((p) => fs.existsSync(p));
const { chromium } = require(PW);
const DATA = process.env.TESTDATA ? path.resolve(process.env.TESTDATA) : path.join(__dirname, 'testdata.js');
const { login, officeInfo, draftFor } = require(DATA);
(async () => {
  const [url, mode, outdir, ...actions] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  // 文字の設定のない環境では、日本語のファイル名のダウンロードが「download」になるので UTF-8 にする
  const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1500, height: 1000 }, locale: 'ja-JP' });
  // 本番の Firebase 等に一切つながないよう、localhost 以外の通信はすべて遮断
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue(); return route.abort(); });
  const SAVED = require(DATA).saved || null;
  await ctx.addInitScript(([l, o, d, saved]) => {
    if (saved && !sessionStorage.getItem('__seeded')) localStorage.setItem('taiyo_proposals_v1', JSON.stringify(saved));
    window.print = () => { window.__printCalls = (window.__printCalls || 0) + 1; };
    // a.download に付けたファイル名を記録（Playwright 側で名前が取れない場合の確認用）
    const _click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dlNames = (window.__dlNames || []).concat(this.download); } return _click.apply(this, arguments); };
    if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('taiyo_login_v1', JSON.stringify(l));
    localStorage.setItem('taiyo_office_info_v1', JSON.stringify(o));
    localStorage.setItem('taiyo_draft_v1', JSON.stringify(d));
    localStorage.setItem('taiyo_users_v1', JSON.stringify([{ key: '行橋__' + l.userName, officeCode: '行橋', name: l.userName, hash: 'x', createdAt: 1 }]));
  }, [login, officeInfo, draftFor(mode), SAVED]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__appMounted || (document.getElementById('root') && document.getElementById('root').children.length > 0), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  // 初回ガイド等のモーダルが出ていれば閉じる
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  for (const a of actions) {
    const eq = a.indexOf('='); const kind = eq < 0 ? a : a.slice(0, eq); const arg = eq < 0 ? '' : a.slice(eq + 1);
    if (kind === 'shot') { await page.screenshot({ path: path.join(outdir, arg + '.png'), fullPage: false }); }
    else if (kind === 'click') { await page.getByText(arg, { exact: false }).first().click(); await page.waitForTimeout(800); }
    else if (kind === 'sel') { const [css, nth] = arg.split('@'); await page.locator(css).nth(Number(nth || 0)).click({ force: true }); await page.waitForTimeout(600); }
    else if (kind === 'btn') { await page.getByRole('button', { name: arg, exact: true }).first().click(); await page.waitForTimeout(800); }
    else if (kind === 'download') {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByRole('button', { name: arg, exact: true }).first().click()]);
      let sug = dl.suggestedFilename(); if (sug === 'download') sug = (await page.evaluate(() => (window.__dlNames || []).slice(-1)[0])) || (mode + '.bin');
      const tmp = path.join(outdir, '__tmp'); await dl.saveAs(tmp);
      const isPdf = fs.readFileSync(tmp).slice(0, 4).toString() === '%PDF';
      const fn = path.join(outdir, isPdf ? sug.replace(/\.(xlsx|bin|pdf)$/, '') + '.pdf' : sug);
      fs.renameSync(tmp, fn); console.log('downloaded', fn); await page.waitForTimeout(1000);
    }
    else if (kind === 'holdershot') {
      await page.waitForSelector('#print-content-holder', { timeout: 10000 });
      await page.waitForTimeout(800);
      const el = await page.$('#print-content-holder .page, #print-content-holder .kaitei-doc, #print-content-holder .internal-doc, #print-content-holder');
      await el.screenshot({ path: path.join(outdir, arg + '.png') });
      fs.writeFileSync(path.join(outdir, arg + '.html'), await page.$eval('#print-content-holder', e => e.innerHTML));
    }
    else if (kind === 'closeholder') { await page.evaluate(() => ['print-content-holder','print-injected-style','print-toolbar'].forEach(id => document.getElementById(id)?.remove())); }
    else if (kind === 'dlsel') {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.locator(arg).first().click()]);
      let sug = dl.suggestedFilename(); if (sug === 'download') sug = (await page.evaluate(() => (window.__dlNames || []).slice(-1)[0])) || (mode + '.bin');
      const fn = path.join(outdir, sug); await dl.saveAs(fn); console.log('downloaded', fn); await page.waitForTimeout(1000);
    }
    else if (kind === 'fillall') {
      const [ph, vals] = arg.split('|'); const vs = vals.split(',');
      const loc = page.getByPlaceholder(ph, { exact: true }); const n = await loc.count();
      for (let i = 0; i < n && i < vs.length; i++) { if (vs[i] !== '') await loc.nth(i).fill(vs[i]); }
      await page.waitForTimeout(300);
    }
    else if (kind === 'iframeshot') {
      const fh = await page.waitForSelector('#proposal-doc-frame'); await page.waitForTimeout(800);
      const frame = await fh.contentFrame();
      await page.setViewportSize({ width: 1500, height: 1600 }); await page.waitForTimeout(500);
      const html = await frame.content(); fs.writeFileSync(path.join(outdir, arg + '.html'), html);
      // iframe の中身を単独ページとして実寸で撮る
      const p2 = await ctx.newPage(); await p2.setContent(html); await p2.setViewportSize({ width: 900, height: 1300 });
      await p2.screenshot({ path: path.join(outdir, arg + '.png'), fullPage: true }); await p2.close();
    }
    else if (kind === 'wait') { await page.waitForTimeout(Number(arg)); }
    else if (kind === 'eval') { console.log(await page.evaluate(arg)); }
  }
  if (errors.length) console.log('PAGE ERRORS:', errors.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
