"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">不動産業務管理</h1>
        <p className="text-xs text-gray-500 mt-1">マルチテナント対応</p>
      </div>
      <nav className="p-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
