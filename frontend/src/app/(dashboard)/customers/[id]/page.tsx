"use client";

import { use } from "react";
import Link from "next/link";
import { useApiDetail } from "@/hooks/use-api";
import DetailSection from "@/components/detail-section";
import StatusBadge from "@/components/status-badge";
import type { Customer } from "@/lib/types";

const typeLabels: Record<string, string> = {
  individual: "個人",
  corporate: "法人",
};

const statusLabels: Record<string, string> = {
  prospect: "見込み",
  active: "有効",
  inactive: "無効",
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer, loading, error } = useApiDetail<Customer>(
    `/api/v1/customers/${id}`
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error || "顧客が見つかりません"}
        </div>
        <Link href="/customers" className="text-blue-600 hover:text-blue-800 text-sm">
          ← 顧客一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <StatusBadge status={customer.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection
          title="基本情報"
          fields={[
            { label: "顧客名", value: customer.name },
            { label: "顧客種別", value: typeLabels[customer.customer_type] ?? customer.customer_type },
            { label: "ステータス", value: statusLabels[customer.status] ?? customer.status },
            { label: "会社名", value: customer.company_name },
          ]}
        />
        <DetailSection
          title="連絡先"
          fields={[
            { label: "メール", value: customer.email },
            { label: "電話番号", value: customer.phone },
            { label: "住所", value: customer.address },
          ]}
        />
        <DetailSection
          title="その他"
          fields={[
            { label: "備考", value: customer.notes },
            { label: "顧客ID", value: customer.id },
            { label: "登録日", value: new Date(customer.created_at).toLocaleDateString("ja-JP") },
            { label: "更新日", value: new Date(customer.updated_at).toLocaleDateString("ja-JP") },
          ]}
        />
      </div>
    </div>
  );
}
