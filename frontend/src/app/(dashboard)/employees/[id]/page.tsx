"use client";

import { use } from "react";
import Link from "next/link";
import { useApiDetail } from "@/hooks/use-api";
import DetailSection from "@/components/detail-section";
import StatusBadge from "@/components/status-badge";
import type { Employee } from "@/lib/types";

const roleLabels: Record<string, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧者",
};

const statusLabels: Record<string, string> = {
  active: "在籍",
  on_leave: "休職中",
  retired: "退職",
};

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: employee, loading, error } = useApiDetail<Employee>(
    `/api/v1/employees/${id}`
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error || "社員が見つかりません"}
        </div>
        <Link href="/employees" className="text-blue-600 hover:text-blue-800 text-sm">
          ← 社員一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
          <StatusBadge status={statusLabels[employee.status] ?? employee.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection
          title="基本情報"
          fields={[
            { label: "氏名", value: employee.name },
            { label: "メール", value: employee.email },
            { label: "役職", value: employee.position },
            { label: "ロール", value: roleLabels[employee.role] ?? employee.role },
            { label: "ステータス", value: statusLabels[employee.status] ?? employee.status },
          ]}
        />
        <DetailSection
          title="所属・資格"
          fields={[
            { label: "部署ID", value: employee.department_id },
            { label: "入社日", value: employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("ja-JP") : null },
            { label: "資格情報", value: employee.license_info },
          ]}
        />
        <DetailSection
          title="管理情報"
          fields={[
            { label: "社員ID", value: employee.id },
            { label: "登録日", value: new Date(employee.created_at).toLocaleDateString("ja-JP") },
            { label: "更新日", value: new Date(employee.updated_at).toLocaleDateString("ja-JP") },
          ]}
        />
      </div>
    </div>
  );
}
