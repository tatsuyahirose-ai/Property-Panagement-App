const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  contracted: "bg-blue-100 text-blue-800",
  unavailable: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  prospect: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  review: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  available: "空室",
  contracted: "契約済",
  unavailable: "非公開",
  active: "有効",
  inactive: "無効",
  prospect: "見込み",
  draft: "下書き",
  pending: "承認待ち",
  approved: "承認済",
  rejected: "却下",
  review: "レビュー中",
  archived: "アーカイブ",
  won: "成約",
  lost: "失注",
  cancelled: "キャンセル",
  on_leave: "休職中",
  retired: "退職",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
