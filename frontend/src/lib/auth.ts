const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  department_id: number | null;
  position: string | null;
  role: "admin" | "manager" | "staff" | "viewer";
  status: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginApi(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail || "メールアドレスまたはパスワードが正しくありません"
    );
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("認証情報が無効です");
  }
  return res.json();
}
