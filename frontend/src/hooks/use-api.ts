"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";

interface UseApiListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiList<T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
): UseApiListResult<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const paramsKey = JSON.stringify(params ?? {});

  const doFetch = useCallback(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    const parsedParams = JSON.parse(paramsKey) as typeof params;
    apiFetch<T[]>(path, { params: parsedParams, tenantId: user.tenant_id })
      .then((result) => {
        if (id === fetchIdRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (id === fetchIdRef.current) {
          setError(err instanceof ApiError ? err.detail : "データの取得に失敗しました");
          setLoading(false);
        }
      });
  }, [path, user, paramsKey]);

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      doFetch();
      return;
    }
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}

interface UseApiDetailResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiDetail<T>(
  path: string | null
): UseApiDetailResult<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const doFetch = useCallback(() => {
    if (!user || !path) {
      setData(null);
      setLoading(false);
      return;
    }
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    apiFetch<T>(path, { tenantId: user.tenant_id })
      .then((result) => {
        if (id === fetchIdRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (id === fetchIdRef.current) {
          setError(err instanceof ApiError ? err.detail : "データの取得に失敗しました");
          setLoading(false);
        }
      });
  }, [path, user]);

  const mountedRef2 = useRef(false);

  useEffect(() => {
    if (!mountedRef2.current) {
      mountedRef2.current = true;
      doFetch();
      return;
    }
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}

interface MutateOptions {
  method: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
}

interface UseApiMutateResult {
  mutate: (path: string, options: MutateOptions) => Promise<unknown>;
  loading: boolean;
  error: string | null;
}

export function useApiMutate(): UseApiMutateResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (path: string, options: MutateOptions) => {
      if (!user) throw new Error("認証が必要です");
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(path, {
          ...options,
          tenantId: user.tenant_id,
        });
        setLoading(false);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.detail : "操作に失敗しました";
        setError(msg);
        setLoading(false);
        throw err;
      }
    },
    [user]
  );

  return { mutate, loading, error };
}
