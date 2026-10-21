// 端のケース：長い品名・改行・記号、大きな金額、税込のみ、空カテゴリ、多数行（複数ページ）
// （quoteNewItems＝入力途中の行は、下書きから画面の入力欄には戻らない。試すときは harness の fillall で入力欄に打つ）
const base = require('./testdata.js');
const it = (o) => Object.assign({ id: 'itm-' + Math.random().toString(36).slice(2, 9), name: '', memo: '', volume: '', packSize: '', price: '', casePrice: '', cost: '', caseCost: '', targetMargin: '', priceOld: '', priceNew: '', caseOld: '', caseNew: '', isHighlighted: false, isHiddenFromPrint: false, memoOpen: false, taxMode: 'exclusive' }, o);
const many = [];
for (let i = 0; i < 38; i++) many.push(it({ name: `介護用ベッド 付属品 No.${i + 1} <特価> & "限定" 品（${i % 3 === 0 ? 'とても長い商品名の例：スーパーラクラク電動リクライニングベッド 3モーター 背上げ・膝上げ・高さ調整付き 幅91cm' : '標準'}）`, volume: (i % 4) + 1, price: 123456 * ((i % 5) + 1), cost: 100000, taxMode: i % 7 === 0 ? 'inclusive' : (i % 11 === 0 ? 'nontax' : 'exclusive'), memo: i % 6 === 0 ? '備考1行目\n備考2行目（改行あり）' : '', isHighlighted: i % 9 === 0, isRedText: i % 13 === 0 }));
const quoteGroups = [
  { id: 'g-1', title: '福祉用具（大型）🛏', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '台', baseScale: 1, items: many },
  { id: 'g-2', title: '空のカテゴリ', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '個', baseScale: 1, items: [] },
  { id: 'g-3', title: '', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '個', baseScale: 1, items: [it({ name: '小数の数量', volume: 1.55, price: 333, cost: 100 }), it({ name: '単価に小数', volume: 3, price: 99.5, cost: 50 })] },
];
const kaiteiGroups = [
  { id: 'g-1', title: '', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: 'ml', baseScale: 100, items: [
    it({ name: '容量なし商品', volume: '', priceOld: 500, priceNew: 550 }),
    it({ name: '容量あり 1000ml', volume: 1000, priceOld: 3333, priceNew: 3456 }),
    it({ name: '改定前なし', volume: 500, priceOld: '', priceNew: 800 }),
    it({ name: '値下げ 750ml', volume: 750, priceOld: 2000, priceNew: 1875 }),
  ] },
];
function draftFor(mode) {
  const d = base.draftFor(mode);
  if (mode === 'quote') return Object.assign(d, { taxMode: 'exclusive', clientName2: '', remarks: '', proposalNumber: '', quoteGroups, groups: quoteGroups, quoteNewItems: { 'g-3': { name: '入力途中の行（未追加）', volume: '2', price: '1000', memo: '', packSize: '', taxMode: 'exclusive' } }, bottomRemarks: '長い備考です。'.repeat(20) });
  if (mode === 'kaitei') return Object.assign(d, { groups: kaiteiGroups });
  return d;
}
module.exports = { login: base.login, officeInfo: base.officeInfo, draftFor };
