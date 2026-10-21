// スマホ（iPhone 13 の幅）で開いて、「📗 Excel保存」と印刷のプレビューを確かめる。使い方: node mobile.js <出力フォルダ> [url]
const fs = require('fs'); const path = require('path');
const PW = process.env.PLAYWRIGHT_DIR || ['/opt/node-tools/node_modules/playwright', '/opt/node22/lib/node_modules/playwright'].find((p) => fs.existsSync(p));
const { chromium, devices } = require(PW);
const { login, officeInfo, draftFor } = require(process.env.TESTDATA ? path.resolve(process.env.TESTDATA) : path.join(__dirname, 'testdata.js'));
const OUT = process.argv[2] || 'mobile-out'; const URL = process.argv[3] || 'http://localhost:5599/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue(); return route.abort(); });
  await ctx.addInitScript(([l, o, d]) => {
    window.print = () => {};
    if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('taiyo_login_v1', JSON.stringify(l)); localStorage.setItem('taiyo_office_info_v1', JSON.stringify(o)); localStorage.setItem('taiyo_draft_v1', JSON.stringify(d));
  }, [login, officeInfo, draftFor('quote')]);
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(2500); await page.keyboard.press('Escape').catch(() => {});
  await page.screenshot({ path: path.join(OUT, 'mobile_top.png') });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.getByRole('button', { name: '📗 Excel保存', exact: true }).click()]);
  console.log('mobile download ok', (await dl.path()) ? 'saved' : 'none');
  await page.getByRole('button', { name: '印刷', exact: true }).click(); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'mobile_preview.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
