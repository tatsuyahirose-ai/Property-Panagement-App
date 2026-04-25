import DataTable from "@/components/data-table";

const columns = [
  { key: "name", label: "部署名" },
  { key: "parent_name", label: "上位部署" },
  { key: "manager_name", label: "管理者" },
  { key: "employee_count", label: "所属人数" },
];

export default function DepartmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">部署管理</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="部署一覧"
        description="組織階層・部署の管理"
        addLabel="部署を追加"
      />
    </div>
  );
}
