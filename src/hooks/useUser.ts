"use client";

import { useAccount } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { User } from "@/types";

export function useUser() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!address) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      setUser(data as User | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const createUser = useCallback(async () => {
    if (!address) return null;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: createError } = await supabase
        .from("users")
        .insert({
          wallet_address: address.toLowerCase(),
        })
        .select()
        .single();

      if (createError) throw createError;

      setUser(data as User);
      return data as User;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const updateUser = useCallback(
    async (updates: Partial<Pick<User, "username" | "avatarUrl" | "bio">>) => {
      if (!address || !user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data, error: updateError } = await supabase
          .from("users")
          .update({
            username: updates.username,
            avatar_url: updates.avatarUrl,
            bio: updates.bio,
          })
          .eq("wallet_address", address.toLowerCase())
          .select()
          .single();

        if (updateError) throw updateError;

        setUser(data as User);
        return data as User;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update user");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, user]
  );

  // Fetch user when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUser();
    } else {
      setUser(null);
    }
  }, [isConnected, address, fetchUser]);

  return {
    user,
    isLoading,
    error,
    isConnected,
    address,
    fetchUser,
    createUser,
    updateUser,
  };
}






