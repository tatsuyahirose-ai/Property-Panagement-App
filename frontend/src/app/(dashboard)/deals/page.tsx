"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { Deal, DealStage } from "@/lib/types";

const stages: { key: DealStage; label: string }[] = [
  { key: "INQUIRY", label: "問合せ" },
  { key: "VIEWING", label: "物件案内" },
  { key: "APPLICATION", label: "申込" },
  { key: "SCREENING", label: "審査" },
  { key: "CONTRACT", label: "契約" },
  { key: "COMPLETED", label: "完了" },
];

const dealTypeLabels: Record<string, string> = {
  RENTAL_BROKERAGE: "賃貸仲介",
  SALES_BROKERAGE: "売買仲介",
  PROPERTY_MANAGEMENT: "賃貸管理",
};

const typeOptions = [
  { value: "RENTAL_BROKERAGE", label: "賃貸仲介" },
  { value: "SALES_BROKERAGE", label: "売買仲介" },
  { value: "PROPERTY_MANAGEMENT", label: "賃貸管理" },
];

const stageOptions = stages.map((s) => ({ value: s.key, label: s.label }));

interface FormState {
  deal_type: string;
  stage: string;
  expected_revenue: string;
  notes: string;
}

const emptyForm: FormState = { deal_type: "", stage: "INQUIRY", expected_revenue: "", notes: "" };

export default function DealsPage() {
  const { data, loading, error, refetch } = useApiList<Deal>("/api/v1/deals/");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filteredDeals = filter ? data.filter((d) => d.deal_type === filter) : data;
  const dealsByStage = stages.map((s) => ({
    ...s,
    deals: filteredDeals.filter((d) => d.stage === s.key),
  }));

  const openAdd = () => { setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await mutate("/api/v1/deals/", {
        method: "POST",
        body: {
          deal_type: form.deal_type,
          stage: form.stage,
          expected_revenue: form.expected_revenue ? Number(form.expected_revenue) : null,
          notes: form.notes || null,
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const updateField = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">案件管理</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">案件を追加</button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">全ての種別</option>
          {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {dealsByStage.map((stage) => (
            <div key={stage.key} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{stage.deals.length}</span>
                </div>
              </div>
              <div className="p-3 min-h-[200px] space-y-2">
                {stage.deals.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center mt-10">案件なし</p>
                ) : (
                  stage.deals.map((deal) => (
                    <div key={deal.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium text-gray-700">{dealTypeLabels[deal.deal_type] ?? deal.deal_type}</p>
                      {deal.expected_revenue != null && (
                        <p className="text-xs text-gray-500 mt-1">{`\u00a5${deal.expected_revenue.toLocaleString()}`}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="案件を追加">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="種別" name="deal_type" value={form.deal_type} onChange={updateField("deal_type")} required options={typeOptions} />
          <FormField label="ステージ" name="stage" value={form.stage} onChange={updateField("stage")} options={stageOptions} />
          <FormField label="予想売上" name="expected_revenue" type="number" value={form.expected_revenue} onChange={updateField("expected_revenue")} />
          <FormField label="メモ" name="notes" type="textarea" value={form.notes} onChange={updateField("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
