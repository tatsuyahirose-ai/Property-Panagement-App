"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";
import Modal from "@/components/modal";
import ConfirmDialog from "@/components/confirm-dialog";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Customer } from "@/lib/types";

const typeLabels: Record<string, string> = {
  individual: "個人",
  corporate: "法人",
};

const statusMap: Record<string, string> = {
  prospect: "prospect",
  active: "active",
  inactive: "inactive",
};

const columns = [
  { key: "name", label: "氏名" },
  { key: "email", label: "メール" },
  { key: "phone", label: "電話番号" },
  {
    key: "customer_type",
    label: "種別",
    render: (item: Record<string, unknown>) =>
      typeLabels[String(item.customer_type)] ?? String(item.customer_type),
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={statusMap[String(item.status)] ?? String(item.status)} />
    ),
  },
];

const typeOptions = [
  { value: "individual", label: "個人" },
  { value: "corporate", label: "法人" },
];

const statusOptions = [
  { value: "prospect", label: "見込み" },
  { value: "active", label: "有効" },
  { value: "inactive", label: "無効" },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  customer_type: string;
  status: string;
  address: string;
  company_name: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  customer_type: "",
  status: "prospect",
  address: "",
  company_name: "",
  notes: "",
};

function toPayload(form: FormState) {
  return {
    name: form.name,
    email: form.email || null,
    phone: form.phone || null,
    customer_type: form.customer_type,
    status: form.status,
    address: form.address || null,
    company_name: form.company_name || null,
    notes: form.notes || null,
  };
}

export default function CustomersPage() {
  const { data, loading, error, refetch } = useApiList<Customer>("/api/v1/customers/");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    const c = item as unknown as Customer;
    setEditTarget(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      customer_type: c.customer_type,
      status: c.status,
      address: c.address ?? "",
      company_name: c.company_name ?? "",
      notes: c.notes ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editTarget) {
        await mutate(`/api/v1/customers/${editTarget.id}`, { method: "PUT", body: toPayload(form) });
      } else {
        await mutate("/api/v1/customers/", { method: "POST", body: toPayload(form) });
      }
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mutate(`/api/v1/customers/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      refetch();
    } catch {
      // handled by hook
    }
  };

  const updateField = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">顧客管理</h1>
      <DataTable
        columns={columns}
        data={data as unknown as Record<string, unknown>[]}
        title="顧客一覧"
        description="個人・法人の顧客管理"
        addLabel="顧客を追加"
        loading={loading}
        error={error}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(item) => setDeleteTarget(item as unknown as Customer)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "顧客を編集" : "顧客を追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="氏名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="メール" name="email" type="email" value={form.email} onChange={updateField("email")} />
          <FormField label="電話番号" name="phone" value={form.phone} onChange={updateField("phone")} />
          <FormField label="種別" name="customer_type" value={form.customer_type} onChange={updateField("customer_type")} required options={typeOptions} />
          <FormField label="ステータス" name="status" value={form.status} onChange={updateField("status")} options={statusOptions} />
          <FormField label="住所" name="address" value={form.address} onChange={updateField("address")} />
          <FormField label="会社名" name="company_name" value={form.company_name} onChange={updateField("company_name")} />
          <FormField label="メモ" name="notes" type="textarea" value={form.notes} onChange={updateField("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="顧客を削除" message={`「${deleteTarget?.name ?? ""}」を削除しますか？`} loading={saving} />
    </div>
  );
}
