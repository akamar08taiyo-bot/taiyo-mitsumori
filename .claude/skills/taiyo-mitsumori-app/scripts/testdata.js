// テスト用の見積データ（ブラウザの localStorage に入れる）。名前・宛先はすべて架空。本物のお客様・価格表は入れない
const login = { office: '行橋営業所', officeCode: '行橋', userName: '見積 太郎', passwordHash: 'x', masterFound: true, loggedInAt: Date.now() };
const officeInfo = {
  companyName: '太陽シルバーサービス㈱', officeName: '行橋営業所',
  postal: '824-0043', address: '福岡県行橋市大字流末1327番地',
  phone: '0930-26-9640', fax: '0930-26-9641', manager: '見本 一郎',
  staffName: '見積 太郎', email: '',
};
const it = (o) => Object.assign({ id: 'itm-' + Math.random().toString(36).slice(2, 9), name: '', memo: '', volume: '', packSize: '', price: '', casePrice: '', cost: '', caseCost: '', targetMargin: '', priceOld: '', priceNew: '', caseOld: '', caseNew: '', isHighlighted: false, isHiddenFromPrint: false, memoOpen: false, taxMode: 'exclusive' }, o);
const quoteGroups = [
  { id: 'g-1', title: '介護用品（おむつ・パッド）', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '個', baseScale: 1, items: [
    it({ name: 'リフレ 簡単テープ止めタイプ 横モレ防止 Mサイズ 24枚入', volume: 12, packSize: 4, price: 3280, cost: 2450 }),
    it({ name: 'アテント 夜1枚安心パッド 仕上げ用 4回吸収 30枚', volume: 8, packSize: 6, price: 2150, cost: 1580, memo: '夜間用。ケース単位での納品となります', isHighlighted: true }),
    it({ name: 'ライフリー さわやかパッド 多くても長時間安心用 400cc 18枚入', volume: 6, packSize: 12, price: 1180, cost: 820 }),
    it({ name: 'お試し値引き', volume: 1, packSize: 1, price: -1500, cost: 0, isRedText: true }),
  ] },
  { id: 'g-2', title: '衛生用品', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '箱', baseScale: 1, items: [
    it({ name: 'プラスチック手袋 パウダーフリー M 100枚入', volume: 20, packSize: 20, price: 680, cost: 410 }),
    it({ name: '清拭用ウェットタオル（大判・厚手）60枚×12個 ケース販売', volume: 3, packSize: 1, price: 5400, cost: 3900, taxMode: 'inclusive' }),
    it({ name: '印刷しない参考行', volume: 1, packSize: 1, price: 999, cost: 500, isHiddenFromPrint: true }),
  ] },
];
const proposalGroups = [
  { id: 'g-1', title: 'ハンドソープ（泡）', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: 'ml', baseScale: 100, items: [
    it({ name: '現状品：キレイキレイ 薬用泡ハンドソープ 詰替 2000ml', volume: 2000, packSize: 6, price: 2480, cost: 1900 }),
    it({ name: 'ご提案品：ビオレu 泡ハンドソープ 業務用 詰替 4L', volume: 4000, packSize: 3, price: 3980, cost: 2980, isHighlighted: true, memo: '同等品・医薬部外品' }),
    it({ name: 'ご提案品：サラヤ シャボネット 泡ハンドソープ 2.5L', volume: 2500, packSize: 4, price: 2650, cost: 1990 }),
  ] },
  { id: 'g-2', title: 'ペーパータオル', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: '枚', baseScale: 100, items: [
    it({ name: '現状品：エリエール ペーパータオル 200枚×40', volume: 8000, packSize: 1, price: 6200, cost: 4800 }),
    it({ name: 'ご提案品：スコットティシュー ペーパータオル 200枚×42', volume: 8400, packSize: 1, price: 5600, cost: 4300 }),
  ] },
];
const kaiteiGroups = [
  { id: 'g-1', title: '', catalogMemo: '', baseVolume: 100, baseQuantity: 1, unit: 'ml', baseScale: 100, items: [
    it({ name: 'サニーナ 本体 220ml', volume: 220, priceOld: 980, priceNew: 1080 }),
    it({ name: 'サニーナ つめかえ用 680ml（ケース 12本入）', volume: 680, priceOld: 1680, priceNew: 1780, memo: '4月1日出荷分より' }),
    it({ name: 'リモイス バリア 30g', volume: 30, priceOld: 1350, priceNew: 1350 }),
    it({ name: 'セキューラ ML 保湿クリーム 290g', volume: 290, priceOld: 2900, priceNew: 2750 }),
  ] },
];
const base = {
  clientName: '医療法人 見本会', clientName2: '見本中央病院', clientHonorific: '御中',
  proposalDate: '2026-10-21', proposalDateText: '2026年10月21日', proposalNumber: 'YK-2026-0158',
  validityPeriod: 'お見積日より30日間', paymentTerms: '月末締め翌月末払い', deliveryInfo: 'ご注文後、通常2〜3営業日',
  remarks: '消費税は含まれておりません。', bottomRemarks: '本見積書の記載金額には、消費税は含まれておりません。\n配送料は当社負担です。',
  taxMode: 'exclusive', showGrandTotal: true,
};
function draftFor(mode) {
  if (mode === 'quote') return Object.assign({}, base, { proposalTitle: '御見積書', appMode: 'quote', quoteGroups, groups: quoteGroups });
  if (mode === 'proposal') return Object.assign({}, base, { proposalTitle: '御提案書', appMode: 'proposal', proposalGroups, groups: proposalGroups, showGrandTotal: false });
  if (mode === 'kaitei') return Object.assign({}, base, { proposalTitle: '価格改定のご案内', appMode: 'kaitei', groups: kaiteiGroups, bottomRemarks: '2026年4月1日ご注文分より、上記の価格に改定させていただきます。' });
}
module.exports = { login, officeInfo, draftFor };
