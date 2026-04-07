"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/auth-user";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUser() {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch("/auth/me", "GET");
      setUser(response);
    } catch (err) {
      setUser(null);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar usuário.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    reload: loadUser,
  };
}
