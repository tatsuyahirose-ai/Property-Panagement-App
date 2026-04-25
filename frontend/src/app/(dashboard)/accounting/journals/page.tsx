"use client";

import { useState } from "react";
import DataTable from "@/components/data-table";
import StatusBadge from "@/components/status-badge";
import Modal from "@/components/modal";
import FormField from "@/components/form-field";
import { useApiList, useApiMutate } from "@/hooks/use-api";
import type { JournalEntry } from "@/lib/types";

const statusMap: Record<string, string> = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const columns = [
  { key: "entry_date", label: "日付" },
  { key: "description", label: "摘要" },
  {
    key: "total_amount",
    label: "金額",
    render: (item: Record<string, unknown>) => {
      const lines = item.lines as Array<{ debit_amount: number }> | undefined;
      if (!lines || lines.length === 0) return "-";
      const total = lines.reduce((sum, l) => sum + l.debit_amount, 0);
      return `\u00a5${total.toLocaleString()}`;
    },
  },
  {
    key: "status",
    label: "ステータス",
    render: (item: Record<string, unknown>) => (
      <StatusBadge status={statusMap[String(item.status)] ?? String(item.status)} />
    ),
  },
];

interface LineForm {
  account_id: string;
  debit_amount: string;
  credit_amount: string;
  description: string;
}

interface FormState {
  entry_date: string;
  description: string;
  lines: LineForm[];
}

const emptyLine: LineForm = { account_id: "", debit_amount: "0", credit_amount: "0", description: "" };
const emptyForm: FormState = { entry_date: "", description: "", lines: [{ ...emptyLine }, { ...emptyLine }] };

export default function JournalsPage() {
  const { data, loading, error, refetch } = useApiList<JournalEntry>("/api/v1/journal-entries");
  const { mutate, loading: saving } = useApiMutate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => { setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await mutate("/api/v1/journal-entries", {
        method: "POST",
        body: {
          entry_date: form.entry_date,
          description: form.description,
          lines: form.lines.map((l) => ({
            account_id: Number(l.account_id),
            debit_amount: Number(l.debit_amount),
            credit_amount: Number(l.credit_amount),
            description: l.description || null,
          })),
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const updateLine = (index: number, key: keyof LineForm, value: string) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [key]: value };
      return { ...prev, lines };
    });
  };

  const addLine = () => setForm((prev) => ({ ...prev, lines: [...prev.lines, { ...emptyLine }] }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仕訳帳</h1>
      <DataTable columns={columns} data={data as unknown as Record<string, unknown>[]} title="仕訳一覧" description="仕訳の入力・承認・検索" addLabel="仕訳を追加" loading={loading} error={error} onAdd={openAdd} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="仕訳を追加">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <FormField label="日付" name="entry_date" type="date" value={form.entry_date} onChange={(v) => setForm((p) => ({ ...p, entry_date: v }))} required />
          <FormField label="摘要" name="description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">仕訳明細</label>
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input type="number" placeholder="科目ID" value={line.account_id} onChange={(e) => updateLine(i, "account_id", e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" required />
                <input type="number" placeholder="借方" value={line.debit_amount} onChange={(e) => updateLine(i, "debit_amount", e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <input type="number" placeholder="貸方" value={line.credit_amount} onChange={(e) => updateLine(i, "credit_amount", e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <input type="text" placeholder="摘要" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            ))}
            <button type="button" onClick={addLine} className="text-sm text-blue-600 hover:text-blue-800">+ 行を追加</button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
