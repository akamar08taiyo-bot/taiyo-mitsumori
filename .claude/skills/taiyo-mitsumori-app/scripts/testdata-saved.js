// 見積もり一覧（保存済み）からの Excel 出力テスト：今開いているのは空、保存済みに価格改定と見積の2件
const base = require('./testdata.js');
const t = require('./testdata.js');
module.exports = { login: base.login, officeInfo: base.officeInfo, draftFor: (mode) => ({ appMode: 'quote', clientName: '', groups: [] }),
  saved: [
    Object.assign({ id: 'prop-saved-1', name: '保存済み価格改定', createdAt: 1, updatedAt: 1 }, t.draftFor('kaitei'), { clientName: '保存済みの宛先（改定）' }),
    Object.assign({ id: 'prop-saved-2', name: '保存済み見積', createdAt: 2, updatedAt: 2 }, t.draftFor('quote'), { clientName: '保存済みの宛先（見積）' }),
  ] };
