"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Employee } from "@/lib/types";

const roleLabels: Record<string, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧者",
};

const statusMap: Record<string, string> = {
  active: "active",
  on_leave: "on_leave",
  retired: "retired",
};

const columns = [
  { key: "name", label: "氏名" },
  { key: "email", label: "メール" },
  { key: "position", label: "役職" },
  {
    key: "role",
    label: "権限",
    render: (item: Record<string, unknown>) =>
      roleLabels[String(item.role)] ?? String(item.role),
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={statusMap[String(item.status)] ?? String(item.status)} />
    ),
  },
];

const roleOptions = [
  { value: "admin", label: "管理者" },
  { value: "manager", label: "マネージャー" },
  { value: "staff", label: "スタッフ" },
  { value: "viewer", label: "閲覧者" },
];

const statusOptions = [
  { value: "active", label: "有効" },
  { value: "on_leave", label: "休職中" },
  { value: "retired", label: "退職" },
];

interface FormState {
  name: string;
  email: string;
  password: string;
  position: string;
  role: string;
  status: string;
  hire_date: string;
  license_info: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  position: "",
  role: "staff",
  status: "active",
  hire_date: "",
  license_info: "",
};

export default function EmployeesPage() {
  const { data, loading, error, refetch } = useApiList<Employee>("/api/v1/employees/");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    const e = item as unknown as Employee;
    setEditTarget(e);
    setForm({
      name: e.name,
      email: e.email,
      password: "",
      position: e.position ?? "",
      role: e.role,
      status: e.status,
      hire_date: e.hire_date ?? "",
      license_info: e.license_info ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    try {
      if (editTarget) {
        await mutate(`/api/v1/employees/${editTarget.id}`, {
          method: "PUT",
          body: {
            name: form.name,
            email: form.email,
            position: form.position || null,
            role: form.role,
            status: form.status,
            hire_date: form.hire_date || null,
            license_info: form.license_info || null,
          },
        });
      } else {
        await mutate("/api/v1/employees/", {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            password: form.password,
            position: form.position || null,
            role: form.role,
            status: form.status,
            hire_date: form.hire_date || null,
            license_info: form.license_info || null,
          },
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const updateField = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">社員管理</h1>
      <DataTable
        columns={columns}
        data={data as unknown as Record<string, unknown>[]}
        title="社員一覧"
        description="社員情報・資格・権限の管理"
        addLabel="社員を追加"
        loading={loading}
        error={error}
        onAdd={openAdd}
        onEdit={openEdit}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "社員を編集" : "社員を追加"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="氏名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="メール" name="email" type="email" value={form.email} onChange={updateField("email")} required />
          {!editTarget && (
            <FormField label="パスワード" name="password" type="password" value={form.password} onChange={updateField("password")} required />
          )}
          <FormField label="役職" name="position" value={form.position} onChange={updateField("position")} placeholder="例: 営業部長" />
          <FormField label="権限" name="role" value={form.role} onChange={updateField("role")} options={roleOptions} />
          <FormField label="ステータス" name="status" value={form.status} onChange={updateField("status")} options={statusOptions} />
          <FormField label="入社日" name="hire_date" type="date" value={form.hire_date} onChange={updateField("hire_date")} />
          <FormField label="資格情報" name="license_info" value={form.license_info} onChange={updateField("license_info")} placeholder="例: 宅地建物取引士" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
