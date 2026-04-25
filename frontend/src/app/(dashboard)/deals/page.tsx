const stages = [
  { key: "inquiry", label: "問合せ" },
  { key: "viewing", label: "物件案内" },
  { key: "application", label: "申込" },
  { key: "screening", label: "審査" },
  { key: "contract", label: "契約" },
  { key: "completed", label: "完了" },
];

export default function DealsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">案件管理</h1>

      <div className="flex gap-2 mb-6">
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          案件を追加
        </button>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全ての種別</option>
          <option value="rental_brokerage">賃貸仲介</option>
          <option value="sales_brokerage">売買仲介</option>
          <option value="property_management">賃貸管理</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  {stage.label}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                  0
                </span>
              </div>
            </div>
            <div className="p-3 min-h-[200px]">
              <p className="text-xs text-gray-400 text-center mt-10">
                案件なし
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
