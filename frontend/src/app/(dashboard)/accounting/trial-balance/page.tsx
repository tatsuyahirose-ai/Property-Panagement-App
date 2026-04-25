export default function TrialBalancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">試算表</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            勘定科目別残高一覧
          </h2>
          <div className="flex gap-3">
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="開始日"
            />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="終了日"
            />
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              表示
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                コード
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                科目名
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                借方合計
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                貸方合計
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                残高
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={5}
                className="px-5 py-8 text-center text-sm text-gray-500"
              >
                期間を指定して表示してください
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
