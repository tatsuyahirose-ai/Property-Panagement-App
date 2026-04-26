"use client";

import { use } from "react";
import Link from "next/link";
import { useApiDetail } from "@/hooks/use-api";
import DetailSection from "@/components/detail-section";
import StatusBadge from "@/components/status-badge";
import type { Deal } from "@/lib/types";

const dealTypeLabels: Record<string, string> = {
  rental_brokerage: "賃貸仲介",
  sales_brokerage: "売買仲介",
  property_management: "賃貸管理",
};

const statusLabels: Record<string, string> = {
  active: "進行中",
  won: "成約",
  lost: "失注",
  cancelled: "キャンセル",
};

const stageLabels: Record<string, string> = {
  inquiry: "問合せ",
  viewing: "物件案内",
  application: "申込",
  screening: "審査",
  contract: "契約",
  completed: "完了",
};

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: deal, loading, error } = useApiDetail<Deal>(
    `/api/v1/deals/${id}`
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error || "案件が見つかりません"}
        </div>
        <Link href="/deals" className="text-blue-600 hover:text-blue-800 text-sm">
          ← 案件一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/deals" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            案件 #{deal.id}
          </h1>
          <StatusBadge status={statusLabels[deal.status] ?? deal.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection
          title="案件情報"
          fields={[
            { label: "種別", value: dealTypeLabels[deal.deal_type] ?? deal.deal_type },
            { label: "ステータス", value: statusLabels[deal.status] ?? deal.status },
            { label: "ステージ", value: stageLabels[deal.stage] ?? deal.stage },
            { label: "物件ID", value: deal.property_id },
            { label: "顧客ID", value: deal.customer_id },
            { label: "担当者ID", value: deal.assigned_staff_id },
          ]}
        />
        <DetailSection
          title="金額"
          fields={[
            { label: "見込み金額", value: deal.expected_revenue ? `\u00a5${deal.expected_revenue.toLocaleString()}` : null },
            { label: "実績金額", value: deal.actual_revenue ? `\u00a5${deal.actual_revenue.toLocaleString()}` : null },
            { label: "備考", value: deal.notes },
          ]}
        />
        <DetailSection
          title="日程"
          fields={[
            { label: "開始日", value: deal.started_at ? new Date(deal.started_at).toLocaleDateString("ja-JP") : null },
            { label: "完了日", value: deal.closed_at ? new Date(deal.closed_at).toLocaleDateString("ja-JP") : null },
            { label: "登録日", value: new Date(deal.created_at).toLocaleDateString("ja-JP") },
            { label: "更新日", value: new Date(deal.updated_at).toLocaleDateString("ja-JP") },
          ]}
        />
      </div>
    </div>
  );
}
