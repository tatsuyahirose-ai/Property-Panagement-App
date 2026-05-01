"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";

const modules = [
  {
    title: "マスターデータ",
    items: [
      { name: "物件マスター", href: "/properties", desc: "物件情報の管理" },
      { name: "顧客マスター", href: "/customers", desc: "顧客情報の管理" },
      { name: "取引先マスター", href: "/partners", desc: "取引先情報の管理" },
    ],
  },
  {
    title: "社員統括",
    items: [
      { name: "社員管理", href: "/employees", desc: "社員情報の管理" },
      { name: "部署管理", href: "/departments", desc: "部署・組織の管理" },
    ],
  },
  {
    title: "財務会計",
    items: [
      { name: "勘定科目", href: "/accounting/accounts", desc: "勘定科目体系の管理" },
      { name: "仕訳帳", href: "/accounting/journals", desc: "仕訳の入力・参照" },
      { name: "試算表", href: "/accounting/trial-balance", desc: "勘定科目別残高一覧" },
    ],
  },
  {
    title: "業務管理",
    items: [
      { name: "案件管理", href: "/deals", desc: "案件パイプラインの管理" },
      { name: "KPI", href: "/kpi", desc: "KPI目標・実績の管理" },
      { name: "ドキュメント", href: "/documents", desc: "仕様書・設計書の管理" },
    ],
  },
];

interface DashboardSummary {
  total_properties: number;
  total_customers: number;
  total_deals: number;
  active_deals: number;
  monthly_revenue: { month: string; revenue: number }[];
  deal_stages: { stage: string; count: number }[];
  property_types: { property_type: string; count: number }[];
  recent_activities: {
    id: number;
    action: string;
    resource_type: string;
    resource_name: string | null;
    employee_name: string | null;
    created_at: string;
  }[];
}

const stageLabels: Record<string, string> = {
  inquiry: "問合せ",
  viewing: "内見",
  application: "申込",
  screening: "審査",
  contract: "契約",
  completed: "完了",
};

const propertyTypeLabels: Record<string, string> = {
  apartment: "アパート",
  mansion: "マンション",
  house: "戸建て",
  office: "オフィス",
  store: "店舗",
  land: "土地",
  other: "その他",
};

const actionLabels: Record<string, string> = {
  create: "作成",
  update: "更新",
  delete: "削除",
  stage_update: "ステージ変更",
};

const resourceTypeLabels: Record<string, string> = {
  property: "物件",
  customer: "顧客",
  deal: "案件",
  document: "ドキュメント",
  employee: "社員",
};

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<DashboardSummary>("/api/v1/dashboard/summary", { tenantId: user.tenant_id })
      .then(setSummary)
      .catch(() => {});
  }, [user]);

  const kpiCards = [
    { label: "管理物件数", value: summary?.total_properties ?? "-", unit: "件", color: "bg-blue-500" },
    { label: "顧客数", value: summary?.total_customers ?? "-", unit: "件", color: "bg-green-500" },
    { label: "全案件数", value: summary?.total_deals ?? "-", unit: "件", color: "bg-purple-500" },
    { label: "進行中案件", value: summary?.active_deals ?? "-", unit: "件", color: "bg-orange-500" },
  ];

  const stageData = (summary?.deal_stages ?? []).map((d) => ({
    name: stageLabels[d.stage] || d.stage,
    value: d.count,
  }));

  const propertyData = (summary?.property_types ?? []).map((d) => ({
    name: propertyTypeLabels[d.property_type] || d.property_type,
    value: d.count,
  }));

  const revenueData = (summary?.monthly_revenue ?? []).map((d) => ({
    month: d.month,
    revenue: d.revenue,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <span className={`w-2 h-2 rounded-full ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.value}
              <span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">月別売上推移</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v) => [`¥${Number(v).toLocaleString()}`, "売上"]} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              データがありません
            </div>
          )}
        </div>

        {/* Deal Stages Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">案件ステージ分布</h2>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name ?? ""}: ${value}`}
                >
                  {stageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* Property Types + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Property Types Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">物件種別分布</h2>
          {propertyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={propertyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name ?? ""}: ${value}`}
                >
                  {propertyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              データがありません
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
          {(summary?.recent_activities ?? []).length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {summary!.recent_activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-900">
                      <span className="font-medium">{activity.employee_name ?? "システム"}</span>
                      {" が "}
                      <span className="font-medium">{resourceTypeLabels[activity.resource_type] || activity.resource_type}</span>
                      {` 「${activity.resource_name ?? "-"}」を`}
                      <span className="font-medium">{actionLabels[activity.action] || activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              アクティビティがありません
            </div>
          )}
        </div>
      </div>

      {/* Module Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <div
            key={module.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {module.title}
            </h2>
            <div className="space-y-2">
              {module.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-gray-400">&#8250;</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
