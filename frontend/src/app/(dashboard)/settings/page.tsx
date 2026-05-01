"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";

interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  is_active: boolean;
}

const planLabels: Record<string, string> = {
  free: "フリー",
  standard: "スタンダード",
  premium: "プレミアム",
};

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "tenant">("profile");

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePosition, setProfilePosition] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tenant
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantMsg, setTenantMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfilePosition(user.position ?? "");

    apiFetch<TenantInfo>(`/api/v1/tenants/${user.tenant_id}`)
      .then((t) => {
        setTenant(t);
        setTenantName(t.name);
        setTenantDomain(t.domain ?? "");
      })
      .catch(() => {});
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await apiFetch("/api/v1/auth/me", {
        method: "PUT",
        tenantId: user?.tenant_id,
        body: { name: profileName, email: profileEmail, position: profilePosition || null },
      });
      refreshUser();
      setProfileMsg({ type: "success", text: "プロフィールを更新しました" });
    } catch (err: unknown) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "更新に失敗しました" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "新しいパスワードが一致しません" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "パスワードは8文字以上にしてください" });
      return;
    }
    setPwSaving(true);
    try {
      await apiFetch<{ message: string }>("/api/v1/auth/change-password", {
        method: "POST",
        tenantId: user?.tenant_id,
        body: { current_password: currentPassword, new_password: newPassword },
      });
      setPwMsg({ type: "success", text: "パスワードを変更しました" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwMsg({ type: "error", text: err instanceof Error ? err.message : "変更に失敗しました" });
    } finally {
      setPwSaving(false);
    }
  };

  const handleTenantSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setTenantSaving(true);
    setTenantMsg(null);
    try {
      const updated = await apiFetch<TenantInfo>(`/api/v1/tenants/${tenant.id}`, {
        method: "PUT",
        tenantId: user?.tenant_id,
        body: { name: tenantName, domain: tenantDomain || null },
      });
      setTenant(updated);
      setTenantMsg({ type: "success", text: "テナント情報を更新しました" });
    } catch (err: unknown) {
      setTenantMsg({ type: "error", text: err instanceof Error ? err.message : "更新に失敗しました" });
    } finally {
      setTenantSaving(false);
    }
  };

  const tabs = [
    { key: "profile" as const, label: "プロフィール" },
    { key: "password" as const, label: "パスワード変更" },
    { key: "tenant" as const, label: "テナント設定" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="max-w-lg">
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileMsg && (
              <div className={`p-3 text-sm rounded-lg ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {profileMsg.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
              <input
                type="text"
                value={profilePosition}
                onChange={(e) => setProfilePosition(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
              <input
                type="text"
                value={user?.role ?? ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                disabled
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {profileSaving ? "保存中..." : "保存"}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="max-w-lg">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwMsg && (
              <div className={`p-3 text-sm rounded-lg ${pwMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {pwMsg.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">8文字以上</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={pwSaving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {pwSaving ? "変更中..." : "パスワードを変更"}
            </button>
          </form>
        </div>
      )}

      {/* Tenant Tab */}
      {activeTab === "tenant" && (
        <div className="max-w-lg">
          {tenant && (
            <form onSubmit={handleTenantSave} className="space-y-4">
              {tenantMsg && (
                <div className={`p-3 text-sm rounded-lg ${tenantMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {tenantMsg.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">スラッグ</label>
                <input
                  type="text"
                  value={tenant.slug}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ドメイン</label>
                <input
                  type="text"
                  value={tenantDomain}
                  onChange={(e) => setTenantDomain(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プラン</label>
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {planLabels[tenant.plan] || tenant.plan}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">テナントID</label>
                <input
                  type="text"
                  value={tenant.id}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
              <button
                type="submit"
                disabled={tenantSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {tenantSaving ? "保存中..." : "保存"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
