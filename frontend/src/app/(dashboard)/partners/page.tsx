import DataTable from "@/components/data-table";

const columns = [
  { key: "name", label: "取引先名" },
  { key: "partner_type", label: "種別" },
  { key: "contact_person", label: "担当者" },
  { key: "phone", label: "電話番号" },
  { key: "email", label: "メール" },
];

export default function PartnersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">取引先管理</h1>
      <DataTable
        columns={columns}
        data={[]}
        title="取引先一覧"
        description="管理会社・工事業者・金融機関の管理"
        addLabel="取引先を追加"
      />
    </div>
  );
}
