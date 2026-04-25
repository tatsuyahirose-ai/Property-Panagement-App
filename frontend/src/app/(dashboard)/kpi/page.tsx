const kpiTypes = [
  { key: "sales_target", label: "売上目標達成率", unit: "%" },
  { key: "close_rate", label: "成約率", unit: "%" },
  { key: "customer_acquisition_cost", label: "顧客獲得コスト", unit: "円" },
  { key: "average_close_days", label: "平均成約期間", unit: "日" },
  { key: "occupancy_rate", label: "物件稼働率", unit: "%" },
  { key: "rent_collection_rate", label: "家賃回収率", unit: "%" },
];

export default function KpiPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        KPIダッシュボード
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiTypes.map((kpi) => (
          <div
            key={kpi.key}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500 mb-2">{kpi.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">-</span>
              <span className="text-sm text-gray-500 mb-1">{kpi.unit}</span>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full">
              <div className="h-full w-0 bg-blue-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">実績: -</span>
              <span className="text-xs text-gray-400">目標: -</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
