"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import Modal from "@/components/modal";
import ConfirmDialog from "@/components/confirm-dialog";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Department } from "@/lib/types";

const columns = [
  { key: "name", label: "部署名" },
  { key: "parent_id", label: "上位部署ID" },
  { key: "manager_id", label: "管理者ID" },
];

interface FormState {
  name: string;
  parent_id: string;
  manager_id: string;
}

const emptyForm: FormState = { name: "", parent_id: "", manager_id: "" };

export default function DepartmentsPage() {
  const { data, loading, error, refetch } = useApiList<Department>("/api/v1/departments/");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const openEdit = (item: Record<string, unknown>) => {
    const d = item as unknown as Department;
    setEditTarget(d);
    setForm({ name: d.name, parent_id: d.parent_id ? String(d.parent_id) : "", manager_id: d.manager_id ? String(d.manager_id) : "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const body = { name: form.name, parent_id: form.parent_id ? Number(form.parent_id) : null, manager_id: form.manager_id ? Number(form.manager_id) : null };
      if (editTarget) {
        await mutate(`/api/v1/departments/${editTarget.id}`, { method: "PUT", body });
      } else {
        await mutate("/api/v1/departments/", { method: "POST", body });
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
      await mutate(`/api/v1/departments/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      refetch();
    } catch { /* handled */ }
  };

  const updateField = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">部署管理</h1>
      <DataTable columns={columns} data={data as unknown as Record<string, unknown>[]} title="部署一覧" description="組織階層・部署の管理" addLabel="部署を追加" loading={loading} error={error} onAdd={openAdd} onEdit={openEdit} onDelete={(item) => setDeleteTarget(item as unknown as Department)} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "部署を編集" : "部署を追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="部署名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="上位部署ID" name="parent_id" type="number" value={form.parent_id} onChange={updateField("parent_id")} />
          <FormField label="管理者ID" name="manager_id" type="number" value={form.manager_id} onChange={updateField("manager_id")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="部署を削除" message={`「${deleteTarget?.name ?? ""}」を削除しますか？`} loading={saving} />
    </div>
  );
}
