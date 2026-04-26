"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import Modal from "@/components/modal";
import ConfirmDialog from "@/components/confirm-dialog";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { BusinessPartner } from "@/lib/types";

const typeLabels: Record<string, string> = {
  management_company: "管理会社",
  contractor: "工事業者",
  financial_institution: "金融機関",
  other: "その他",
};

const columns = [
  { key: "name", label: "取引先名" },
  {
    key: "partner_type",
    label: "種別",
    render: (item: Record<string, unknown>) =>
      typeLabels[String(item.partner_type)] ?? String(item.partner_type),
  },
  { key: "contact_person", label: "担当者" },
  { key: "phone", label: "電話番号" },
  { key: "email", label: "メール" },
];

const typeOptions = [
  { value: "management_company", label: "管理会社" },
  { value: "contractor", label: "工事業者" },
  { value: "financial_institution", label: "金融機関" },
  { value: "other", label: "その他" },
];

interface FormState {
  name: string;
  partner_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: FormState = { name: "", partner_type: "", contact_person: "", phone: "", email: "", address: "", notes: "" };

export default function PartnersPage() {
  const { data, loading, error, refetch } = useApiList<BusinessPartner>("/api/v1/partners/");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BusinessPartner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessPartner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const openEdit = (item: Record<string, unknown>) => {
    const p = item as unknown as BusinessPartner;
    setEditTarget(p);
    setForm({ name: p.name, partner_type: p.partner_type, contact_person: p.contact_person ?? "", phone: p.phone ?? "", email: p.email ?? "", address: p.address ?? "", notes: p.notes ?? "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const body = { name: form.name, partner_type: form.partner_type, contact_person: form.contact_person || null, phone: form.phone || null, email: form.email || null, address: form.address || null, notes: form.notes || null };
      if (editTarget) {
        await mutate(`/api/v1/partners/${editTarget.id}`, { method: "PUT", body });
      } else {
        await mutate("/api/v1/partners/", { method: "POST", body });
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
      await mutate(`/api/v1/partners/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      refetch();
    } catch { /* handled */ }
  };

  const updateField = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">取引先管理</h1>
      <DataTable columns={columns} data={data as unknown as Record<string, unknown>[]} title="取引先一覧" description="管理会社・工事業者・金融機関の管理" addLabel="取引先を追加" loading={loading} error={error} onAdd={openAdd} onEdit={openEdit} onDelete={(item) => setDeleteTarget(item as unknown as BusinessPartner)} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "取引先を編集" : "取引先を追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="取引先名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="種別" name="partner_type" value={form.partner_type} onChange={updateField("partner_type")} required options={typeOptions} />
          <FormField label="担当者" name="contact_person" value={form.contact_person} onChange={updateField("contact_person")} />
          <FormField label="電話番号" name="phone" value={form.phone} onChange={updateField("phone")} />
          <FormField label="メール" name="email" type="email" value={form.email} onChange={updateField("email")} />
          <FormField label="住所" name="address" value={form.address} onChange={updateField("address")} />
          <FormField label="メモ" name="notes" type="textarea" value={form.notes} onChange={updateField("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="取引先を削除" message={`「${deleteTarget?.name ?? ""}」を削除しますか？`} loading={saving} />
    </div>
  );
}
