"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Account } from "@/lib/types";

const typeLabels: Record<string, string> = {
  ASSET: "資産",
  LIABILITY: "負債",
  EQUITY: "純資産",
  REVENUE: "収益",
  EXPENSE: "費用",
};

const taxLabels: Record<string, string> = {
  TAXABLE: "課税",
  TAX_EXEMPT: "非課税",
  NON_TAXABLE: "不課税",
  TAX_FREE_EXPORT: "免税",
};

const columns = [
  { key: "code", label: "コード" },
  { key: "name", label: "科目名" },
  {
    key: "account_type",
    label: "区分",
    render: (item: Record<string, unknown>) =>
      typeLabels[String(item.account_type)] ?? String(item.account_type),
  },
  {
    key: "tax_category",
    label: "消費税区分",
    render: (item: Record<string, unknown>) =>
      taxLabels[String(item.tax_category)] ?? String(item.tax_category),
  },
  {
    key: "is_active",
    label: "状態",
    render: (item: Record<string, unknown>) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
        {item.is_active ? "有効" : "無効"}
      </span>
    ),
  },
];

const typeOptions = Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }));
const taxOptions = Object.entries(taxLabels).map(([v, l]) => ({ value: v, label: l }));

interface FormState {
  code: string;
  name: string;
  account_type: string;
  tax_category: string;
  description: string;
}

const emptyForm: FormState = { code: "", name: "", account_type: "", tax_category: "TAXABLE", description: "" };

export default function AccountsPage() {
  const { data, loading, error, refetch } = useApiList<Account>("/api/v1/accounts");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const openEdit = (item: Record<string, unknown>) => {
    const a = item as unknown as Account;
    setEditTarget(a);
    setForm({ code: a.code, name: a.name, account_type: a.account_type, tax_category: a.tax_category, description: a.description ?? "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const body = { code: form.code, name: form.name, account_type: form.account_type, tax_category: form.tax_category, description: form.description || null };
      if (editTarget) {
        await mutate(`/api/v1/accounts/${editTarget.id}`, { method: "PUT", body });
      } else {
        await mutate("/api/v1/accounts", { method: "POST", body });
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">勘定科目</h1>
      <DataTable columns={columns} data={data as unknown as Record<string, unknown>[]} title="勘定科目一覧" description="不動産業向け勘定科目体系の管理" addLabel="科目を追加" loading={loading} error={error} onAdd={openAdd} onEdit={openEdit} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "勘定科目を編集" : "勘定科目を追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="コード" name="code" value={form.code} onChange={updateField("code")} required placeholder="例: 1010" />
          <FormField label="科目名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="区分" name="account_type" value={form.account_type} onChange={updateField("account_type")} required options={typeOptions} />
          <FormField label="消費税区分" name="tax_category" value={form.tax_category} onChange={updateField("tax_category")} options={taxOptions} />
          <FormField label="説明" name="description" type="textarea" value={form.description} onChange={updateField("description")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
