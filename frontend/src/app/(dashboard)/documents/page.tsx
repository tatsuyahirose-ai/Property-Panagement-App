"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Document } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  design: "設計書",
  requirements: "要件定義",
  rules: "ルール",
  philosophy: "設計思想",
  specification: "仕様書",
  manual: "マニュアル",
  other: "その他",
};

const statusMap: Record<string, string> = {
  draft: "draft",
  review: "review",
  approved: "approved",
  archived: "archived",
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
      <StatusBadge status={statusMap[String(item.status)] ?? String(item.status)} />
    ),
  },
  {
    key: "updated_at",
    label: "最終更新",
    render: (item: Record<string, unknown>) => {
      const d = item.updated_at;
      if (!d) return "-";
      return new Date(String(d)).toLocaleDateString("ja-JP");
    },
  },
];

const categoryOptions = Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }));
const statusOptions = [
  { value: "draft", label: "下書き" },
  { value: "review", label: "レビュー中" },
  { value: "approved", label: "承認済" },
  { value: "archived", label: "アーカイブ" },
];

interface FormState {
  title: string;
  category: string;
  status: string;
  content: string;
}

const emptyForm: FormState = { title: "", category: "", status: "draft", content: "" };

export default function DocumentsPage() {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const params: Record<string, string | undefined> = {};
  if (filterCategory) params.category = filterCategory;
  if (filterStatus) params.status = filterStatus;

  const { data, loading, error, refetch } = useApiList<Document>("/api/v1/documents/", params);
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const openEdit = (item: Record<string, unknown>) => {
    const doc = item as unknown as Document;
    setEditTarget(doc);
    setForm({ title: doc.title, category: doc.category, status: doc.status, content: "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editTarget) {
        await mutate(`/api/v1/documents/${editTarget.id}`, {
          method: "PUT",
          body: { title: form.title, category: form.category, status: form.status },
        });
      } else {
        await mutate("/api/v1/documents/", {
          method: "POST",
          body: { title: form.title, category: form.category, status: form.status, content: form.content },
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const updateField = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ドキュメント管理</h1>
      <p className="text-sm text-gray-500 mb-4">設計思想・要件定義・ルールをバージョン管理付きで保存し、仕様のブレを防ぎます。</p>
      <div className="flex gap-2 mb-6">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全てのカテゴリ</option>
          {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全てのステータス</option>
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data as unknown as Record<string, unknown>[]} title="ドキュメント一覧" description="仕様書・設計書・ルール・設計思想のバージョン管理" addLabel="ドキュメントを追加" loading={loading} error={error} onAdd={openAdd} onEdit={openEdit} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "ドキュメントを編集" : "ドキュメントを追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="タイトル" name="title" value={form.title} onChange={updateField("title")} required />
          <FormField label="カテゴリ" name="category" value={form.category} onChange={updateField("category")} required options={categoryOptions} />
          <FormField label="ステータス" name="status" value={form.status} onChange={updateField("status")} options={statusOptions} />
          {!editTarget && <FormField label="内容" name="content" type="textarea" value={form.content} onChange={updateField("content")} required />}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
