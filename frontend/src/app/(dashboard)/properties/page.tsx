import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";

const columns = [
  { key: "name", label: "物件名" },
  { key: "address", label: "所在地" },
  { key: "property_type", label: "種別" },
  {
    key: "rent_price",
    label: "賃料",
    render: (item: Record<string, unknown>) =>
      item.rent_price ? `¥${Number(item.rent_price).toLocaleString()}` : "-",
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={String(item.status ?? "")} />
    ),
  },
];

export default function PropertiesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">物件管理</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="物件一覧"
        description="賃貸・売買物件の管理"
        addLabel="物件を追加"
      />
    </div>
  );
}
