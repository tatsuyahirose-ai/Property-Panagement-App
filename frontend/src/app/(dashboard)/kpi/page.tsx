"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { KpiTarget } from "@/lib/types";

const kpiTypeLabels: Record<string, { label: string; unit: string }> = {
  sales_target: { label: "売上目標達成率", unit: "%" },
  close_rate: { label: "成約率", unit: "%" },
  customer_acquisition_cost: { label: "顧客獲得コスト", unit: "円" },
  average_close_days: { label: "平均成約期間", unit: "日" },
  occupancy_rate: { label: "物件稼働率", unit: "%" },
  rent_collection_rate: { label: "家賃回収率", unit: "%" },
};

const kpiTypeOptions = Object.entries(kpiTypeLabels).map(([v, { label }]) => ({ value: v, label }));
const periodOptions = [
  { value: "monthly", label: "月次" },
  { value: "quarterly", label: "四半期" },
  { value: "yearly", label: "年次" },
];

interface FormState {
  kpi_type: string;
  period: string;
  period_start: string;
  target_value: string;
  actual_value: string;
}

const emptyForm: FormState = { kpi_type: "", period: "monthly", period_start: "", target_value: "", actual_value: "" };

export default function KpiPage() {
  const { data, loading, error, refetch } = useApiList<KpiTarget>("/api/v1/kpi/targets");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await mutate("/api/v1/kpi/targets", {
        method: "POST",
        body: {
          kpi_type: form.kpi_type,
          period: form.period,
          period_start: form.period_start,
          target_value: Number(form.target_value),
          actual_value: form.actual_value ? Number(form.actual_value) : null,
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const updateField = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const kpiCards = Object.entries(kpiTypeLabels).map(([key, meta]) => {
    const targets = data.filter((t) => t.kpi_type === key);
    const latest = targets.length > 0 ? targets[targets.length - 1] : null;
    const achievement = latest && latest.actual_value != null && latest.target_value > 0
      ? Math.round((latest.actual_value / latest.target_value) * 100)
      : null;
    return { key, ...meta, latest, achievement };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">KPIダッシュボード</h1>
      <div className="mb-4">
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">KPI目標を追加</button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {kpiCards.map((kpi) => (
            <div key={kpi.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-2">{kpi.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {kpi.latest?.actual_value != null ? kpi.latest.actual_value.toLocaleString() : "-"}
                </span>
                <span className="text-sm text-gray-500 mb-1">{kpi.unit}</span>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(kpi.achievement ?? 0, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">実績: {kpi.latest?.actual_value != null ? kpi.latest.actual_value.toLocaleString() : "-"}</span>
                <span className="text-xs text-gray-400">目標: {kpi.latest?.target_value != null ? kpi.latest.target_value.toLocaleString() : "-"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="KPI目標を追加">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="KPI種別" name="kpi_type" value={form.kpi_type} onChange={updateField("kpi_type")} required options={kpiTypeOptions} />
          <FormField label="期間" name="period" value={form.period} onChange={updateField("period")} options={periodOptions} />
          <FormField label="期間開始" name="period_start" value={form.period_start} onChange={updateField("period_start")} required placeholder="例: 2025-04" />
          <FormField label="目標値" name="target_value" type="number" value={form.target_value} onChange={updateField("target_value")} required />
          <FormField label="実績値" name="actual_value" type="number" value={form.actual_value} onChange={updateField("actual_value")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
