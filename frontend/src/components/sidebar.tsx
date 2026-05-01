"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: "📊" },
  { name: "物件管理", href: "/properties", icon: "🏠" },
  { name: "顧客管理", href: "/customers", icon: "👥" },
  { name: "取引先管理", href: "/partners", icon: "🤝" },
  { name: "社員管理", href: "/employees", icon: "👤" },
  { name: "部署管理", href: "/departments", icon: "🏢" },
  { name: "勘定科目", href: "/accounting/accounts", icon: "📋" },
  { name: "仕訳帳", href: "/accounting/journals", icon: "📝" },
  { name: "試算表", href: "/accounting/trial-balance", icon: "📈" },
  { name: "KPI", href: "/kpi", icon: "🎯" },
  { name: "案件管理", href: "/deals", icon: "💼" },
  { name: "ドキュメント", href: "/documents", icon: "📄" },
  { name: "設定", href: "/settings", icon: "⚙️" },
];

const roleLabels: Record<string, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧者",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">不動産業務管理</h1>
          <p className="text-xs text-gray-500 mt-1">マルチテナント対応</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {roleLabels[user.role] || user.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white shadow-md border border-gray-200"
        aria-label="メニューを開く"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200 min-h-screen shrink-0">
        {navContent}
      </aside>
    </>
  );
}
