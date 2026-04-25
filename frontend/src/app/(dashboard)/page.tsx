const kpiCards = [
  { label: "管理物件数", value: "0", unit: "件", color: "bg-blue-500" },
  { label: "今月売上", value: "¥0", unit: "", color: "bg-green-500" },
  { label: "成約率", value: "0", unit: "%", color: "bg-purple-500" },
  { label: "入居率", value: "0", unit: "%", color: "bg-orange-500" },
];

const modules = [
  {
    title: "マスターデータ",
    items: [
      { name: "物件マスター", href: "/properties", desc: "物件情報の管理" },
      { name: "顧客マスター", href: "/customers", desc: "顧客情報の管理" },
      { name: "取引先マスター", href: "/partners", desc: "取引先情報の管理" },
    ],
  },
  {
    title: "社員統括",
    items: [
      { name: "社員管理", href: "/employees", desc: "社員情報の管理" },
      { name: "部署管理", href: "/departments", desc: "部署・組織の管理" },
    ],
  },
  {
    title: "財務会計",
    items: [
      { name: "勘定科目", href: "/accounting/accounts", desc: "勘定科目体系の管理" },
      { name: "仕訳帳", href: "/accounting/journals", desc: "仕訳の入力・参照" },
      { name: "試算表", href: "/accounting/trial-balance", desc: "勘定科目別残高一覧" },
    ],
  },
  {
    title: "業務管理",
    items: [
      { name: "案件管理", href: "/deals", desc: "案件パイプラインの管理" },
      { name: "KPI", href: "/kpi", desc: "KPI目標・実績の管理" },
      { name: "ドキュメント", href: "/documents", desc: "仕様書・設計書の管理" },
    ],
  },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <span
                className={`w-2 h-2 rounded-full ${card.color}`}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.value}
              {card.unit && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {card.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <div
            key={module.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {module.title}
            </h2>
            <div className="space-y-2">
              {module.items.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-gray-400">&#8250;</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
