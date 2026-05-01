"use client";

import { use } from "react";
import Link from "next/link";
import { useApiDetail } from "@/hooks/use-api";
import DetailSection from "@/components/detail-section";
import StatusBadge from "@/components/status-badge";
import type { Property } from "@/lib/types";

const propertyTypeLabels: Record<string, string> = {
  apartment: "アパート",
  mansion: "マンション",
  house: "一戸建て",
  office: "オフィス",
  store: "店舗",
  land: "土地",
  other: "その他",
};

const statusLabels: Record<string, string> = {
  available: "空室",
  contracted: "契約済",
  unavailable: "非公開",
};

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property, loading, error } = useApiDetail<Property>(
    `/api/v1/properties/${id}`
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error || "物件が見つかりません"}
        </div>
        <Link href="/properties" className="text-blue-600 hover:text-blue-800 text-sm">
          ← 物件一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/properties" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <StatusBadge status={property.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection
          title="基本情報"
          fields={[
            { label: "物件名", value: property.name },
            { label: "所在地", value: property.address },
            { label: "種別", value: propertyTypeLabels[property.property_type] ?? property.property_type },
            { label: "ステータス", value: statusLabels[property.status] ?? property.status },
            { label: "構造", value: property.structure_type },
            { label: "築年", value: property.built_year ? `${property.built_year}年` : null },
          ]}
        />
        <DetailSection
          title="価格・面積"
          fields={[
            { label: "面積", value: property.floor_area ? `${property.floor_area} m\u00b2` : null },
            { label: "賃料", value: property.rent_price ? `\u00a5${property.rent_price.toLocaleString()}` : null },
            { label: "売買価格", value: property.sale_price ? `\u00a5${property.sale_price.toLocaleString()}` : null },
            { label: "備考", value: property.description },
          ]}
        />
        <DetailSection
          title="管理情報"
          fields={[
            { label: "物件ID", value: property.id },
            { label: "登録日", value: new Date(property.created_at).toLocaleDateString("ja-JP") },
            { label: "更新日", value: new Date(property.updated_at).toLocaleDateString("ja-JP") },
          ]}
        />
      </div>
    </div>
  );
}
