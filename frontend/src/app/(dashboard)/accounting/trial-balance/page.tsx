"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import type { TrialBalanceResponse } from "@/lib/types";

const typeLabels: Record<string, string> = {
  ASSET: "資産",
  LIABILITY: "負債",
  EQUITY: "純資産",
  REVENUE: "収益",
  EXPENSE: "費用",
};

export default function TrialBalancePage() {
  const { user } = useAuth();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [data, setData] = useState<TrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!user || !periodStart || !periodEnd) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<TrialBalanceResponse>("/api/v1/reports/trial-balance", {
        params: { period_start: periodStart, period_end: periodEnd },
        tenantId: user.tenant_id,
      });
      setData(result);
    } catch {
      setError("試算表の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">試算表</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">勘定科目別残高一覧</h2>
          <div className="flex gap-3">
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <button onClick={handleFetch} disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "取得中..." : "表示"}
            </button>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">コード</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">科目名</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">区分</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">借方合計</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">貸方合計</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">残高</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!data || data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                  {data ? "該当するデータがありません" : "期間を指定して表示してください"}
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.account_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-900">{item.account_code}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">{item.account_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{typeLabels[item.account_type] ?? item.account_type}</td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">{`\u00a5${item.debit_total.toLocaleString()}`}</td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">{`\u00a5${item.credit_total.toLocaleString()}`}</td>
                  <td className={`px-5 py-3 text-sm text-right font-medium ${item.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>{`\u00a5${item.balance.toLocaleString()}`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
