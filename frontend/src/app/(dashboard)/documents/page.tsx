import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";

const categoryLabels: Record<string, string> = {
  design: "設計書",
  requirements: "要件定義",
  rules: "ルール",
  philosophy: "設計思想",
  specification: "仕様書",
  manual: "マニュアル",
  other: "その他",
};

const columns = [
  { key: "title", label: "タイトル" },
  {
    key: "category",
    label: "カテゴリ",
    render: (item: Record<string, unknown>) =>
      categoryLabels[String(item.category)] ?? String(item.category),
  },
  {
    key: "current_version",
    label: "バージョン",
    render: (item: Record<string, unknown>) => `v${item.current_version}`,
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={String(item.status ?? "")} />
    ),
  },
  { key: "updated_at", label: "最終更新" },
];

export default function DocumentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        ドキュメント管理
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        設計思想・要件定義・ルールをバージョン管理付きで保存し、仕様のブレを防ぎます。
      </p>

      <div className="flex gap-2 mb-6">
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全てのカテゴリ</option>
          <option value="design">設計書</option>
          <option value="requirements">要件定義</option>
          <option value="rules">ルール</option>
          <option value="philosophy">設計思想</option>
          <option value="specification">仕様書</option>
          <option value="manual">マニュアル</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全てのステータス</option>
          <option value="draft">下書き</option>
          <option value="review">レビュー中</option>
          <option value="approved">承認済</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={[]}
        title="ドキュメント一覧"
        description="仕様書・設計書・ルール・設計思想のバージョン管理"
        addLabel="ドキュメントを追加"
      />
    </div>
  );
}
