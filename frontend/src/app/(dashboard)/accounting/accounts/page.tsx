"use client";

import DataTable from "@/components/data-table";

const columns = [
  { key: "code", label: "コード" },
  { key: "name", label: "科目名" },
  { key: "account_type", label: "区分" },
  { key: "tax_category", label: "消費税区分" },
  {
    key: "is_active",
    label: "状態",
    render: (item: Record<string, unknown>) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.is_active
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {item.is_active ? "有効" : "無効"}
      </span>
    ),
  },
];

export default function AccountsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">勘定科目</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="勘定科目一覧"
        description="不動産業向け勘定科目体系の管理"
        addLabel="科目を追加"
      />
    </div>
  );
}
