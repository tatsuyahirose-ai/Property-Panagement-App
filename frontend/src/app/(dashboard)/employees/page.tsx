import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";

const columns = [
  { key: "name", label: "氏名" },
  { key: "email", label: "メール" },
  { key: "position", label: "役職" },
  { key: "role", label: "権限" },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={String(item.status ?? "")} />
    ),
  },
];

export default function EmployeesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">社員管理</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="社員一覧"
        description="社員情報・資格・権限の管理"
        addLabel="社員を追加"
      />
    </div>
  );
}
