"use client";

import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";

const columns = [
  { key: "name", label: "氏名" },
  { key: "email", label: "メール" },
  { key: "phone", label: "電話番号" },
  { key: "customer_type", label: "種別" },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={String(item.status ?? "")} />
    ),
  },
];

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">顧客管理</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="顧客一覧"
        description="個人・法人の顧客管理"
        addLabel="顧客を追加"
      />
    </div>
  );
}
