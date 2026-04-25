"use client";

import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";

const columns = [
  { key: "entry_date", label: "日付" },
  { key: "description", label: "摘要" },
  {
    key: "total_amount",
    label: "金額",
    render: (item: Record<string, unknown>) =>
      item.total_amount
        ? `¥${Number(item.total_amount).toLocaleString()}`
        : "-",
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={String(item.status ?? "")} />
    ),
  },
];

export default function JournalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仕訳帳</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="仕訳一覧"
        description="仕訳の入力・承認・検索"
        addLabel="仕訳を追加"
      />
    </div>
  );
}
