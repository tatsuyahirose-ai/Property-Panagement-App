"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApiDetail } from "@/hooks/use-api";
import DetailSection from "@/components/detail-section";
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

const statusLabels: Record<string, string> = {
  draft: "下書き",
  review: "レビュー中",
  approved: "承認済",
  archived: "アーカイブ",
};

interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content: string;
  change_summary: string | null;
  created_by: number | null;
  created_at: string;
}

interface DocumentWithVersions {
  id: number;
  tenant_id: number;
  title: string;
  category: string;
  status: string;
  current_version: number;
  created_by: number | null;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: doc, loading, error } = useApiDetail<DocumentWithVersions>(
    `/api/v1/documents/${id}`
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error || "ドキュメントが見つかりません"}
        </div>
        <Link href="/documents" className="text-blue-600 hover:text-blue-800 text-sm">
          ← ドキュメント一覧に戻る
        </Link>
      </div>
    );
  }

  const currentVersionData = doc.versions.find(
    (v) => v.version === (selectedVersion ?? doc.current_version)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documents" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection
            title="ドキュメント情報"
            fields={[
              { label: "タイトル", value: doc.title },
              { label: "カテゴリ", value: categoryLabels[doc.category] ?? doc.category },
              { label: "ステータス", value: statusLabels[doc.status] ?? doc.status },
              { label: "現在のバージョン", value: `v${doc.current_version}` },
              { label: "登録日", value: new Date(doc.created_at).toLocaleDateString("ja-JP") },
              { label: "更新日", value: new Date(doc.updated_at).toLocaleDateString("ja-JP") },
            ]}
          />

          {currentVersionData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                コンテンツ (v{currentVersionData.version})
              </h2>
              {currentVersionData.change_summary && (
                <p className="text-sm text-gray-500 mb-4">
                  変更概要: {currentVersionData.change_summary}
                </p>
              )}
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800 max-h-96 overflow-y-auto">
                {currentVersionData.content}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">バージョン履歴</h2>
            {doc.versions.length === 0 ? (
              <p className="text-sm text-gray-500">バージョンがありません</p>
            ) : (
              <div className="space-y-3">
                {doc.versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version.version)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      (selectedVersion ?? doc.current_version) === version.version
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        v{version.version}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(version.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    {version.change_summary && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {version.change_summary}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
