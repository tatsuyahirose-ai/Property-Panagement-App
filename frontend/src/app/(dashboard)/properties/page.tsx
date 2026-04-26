"use client";

import { useCallback, useState } from "react";
import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";
import Modal from "@/components/modal";
import ConfirmDialog from "@/components/confirm-dialog";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
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

const columns = [
  { key: "name", label: "物件名", sortable: true },
  { key: "address", label: "所在地", sortable: true },
  {
    key: "property_type",
    label: "種別",
    render: (item: Record<string, unknown>) =>
      propertyTypeLabels[String(item.property_type)] ?? String(item.property_type),
  },
  {
    key: "rent_price",
    label: "賃料",
    sortable: true,
    render: (item: Record<string, unknown>) =>
      item.rent_price ? `\u00a5${Number(item.rent_price).toLocaleString()}` : "-",
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={statusLabels[String(item.status)] ?? String(item.status)} />
    ),
  },
];

const typeOptions = [
  { value: "apartment", label: "アパート" },
  { value: "mansion", label: "マンション" },
  { value: "house", label: "一戸建て" },
  { value: "office", label: "オフィス" },
  { value: "store", label: "店舗" },
  { value: "land", label: "土地" },
  { value: "other", label: "その他" },
];

const statusOptions = [
  { value: "available", label: "空室" },
  { value: "contracted", label: "契約済" },
  { value: "unavailable", label: "非公開" },
];

const filters = [
  { key: "property_type", label: "全ての種別", options: typeOptions },
  { key: "status", label: "全てのステータス", options: statusOptions },
];

interface FormState {
  name: string;
  address: string;
  property_type: string;
  structure_type: string;
  built_year: string;
  floor_area: string;
  rent_price: string;
  sale_price: string;
  status: string;
  description: string;
}

const emptyForm: FormState = {
  name: "",
  address: "",
  property_type: "",
  structure_type: "",
  built_year: "",
  floor_area: "",
  rent_price: "",
  sale_price: "",
  status: "available",
  description: "",
};

function toPayload(form: FormState) {
  return {
    name: form.name,
    address: form.address,
    property_type: form.property_type,
    structure_type: form.structure_type || null,
    built_year: form.built_year ? Number(form.built_year) : null,
    floor_area: form.floor_area ? Number(form.floor_area) : null,
    rent_price: form.rent_price ? Number(form.rent_price) : null,
    sale_price: form.sale_price ? Number(form.sale_price) : null,
    status: form.status,
    description: form.description || null,
  };
}

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useState<Record<string, string | undefined>>({});
  const { data, loading, error, refetch } = useApiList<Property>("/api/v1/properties/", searchParams);
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchParams((prev) => ({ ...prev, q: query || undefined }));
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [key]: value || undefined }));
  }, []);

  const handleSort = useCallback((key: string, order: "asc" | "desc") => {
    setSearchParams((prev) => ({ ...prev, sort_by: key, sort_order: order }));
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    const p = item as unknown as Property;
    setEditTarget(p);
    setForm({
      name: p.name,
      address: p.address,
      property_type: p.property_type,
      structure_type: p.structure_type ?? "",
      built_year: p.built_year ? String(p.built_year) : "",
      floor_area: p.floor_area ? String(p.floor_area) : "",
      rent_price: p.rent_price ? String(p.rent_price) : "",
      sale_price: p.sale_price ? String(p.sale_price) : "",
      status: p.status,
      description: p.description ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editTarget) {
        await mutate(`/api/v1/properties/${editTarget.id}`, {
          method: "PUT",
          body: toPayload(form),
        });
      } else {
        await mutate("/api/v1/properties/", {
          method: "POST",
          body: toPayload(form),
        });
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
      await mutate(`/api/v1/properties/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      refetch();
    } catch {
      // error is handled by useApiMutate
    }
  };

  const updateField = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">物件管理</h1>
      <DataTable
        columns={columns}
        data={data as unknown as Record<string, unknown>[]}
        title="物件一覧"
        description="賃貸・売買物件の管理"
        addLabel="物件を追加"
        loading={loading}
        error={error}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(item) => setDeleteTarget(item as unknown as Property)}
        onSearch={handleSearch}
        searchPlaceholder="物件名・所在地で検索..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        detailPath="/properties"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "物件を編集" : "物件を追加"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
          )}
          <FormField label="物件名" name="name" value={form.name} onChange={updateField("name")} required />
          <FormField label="所在地" name="address" value={form.address} onChange={updateField("address")} required />
          <FormField label="種別" name="property_type" value={form.property_type} onChange={updateField("property_type")} required options={typeOptions} />
          <FormField label="構造" name="structure_type" value={form.structure_type} onChange={updateField("structure_type")} placeholder="例: RC造" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="築年" name="built_year" type="number" value={form.built_year} onChange={updateField("built_year")} placeholder="例: 2020" />
            <FormField label="面積 (m2)" name="floor_area" type="number" value={form.floor_area} onChange={updateField("floor_area")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="賃料" name="rent_price" type="number" value={form.rent_price} onChange={updateField("rent_price")} />
            <FormField label="売買価格" name="sale_price" type="number" value={form.sale_price} onChange={updateField("sale_price")} />
          </div>
          <FormField label="ステータス" name="status" value={form.status} onChange={updateField("status")} options={statusOptions} />
          <FormField label="備考" name="description" type="textarea" value={form.description} onChange={updateField("description")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="物件を削除"
        message={`「${deleteTarget?.name ?? ""}」を削除しますか？この操作は取り消せません。`}
        loading={saving}
      />
    </div>
  );
}
