import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCachedHistory, saveHistoryToCache } from "@/lib/local-db";
import type { DeliveryHistory } from "@/types/delivery";

export function useHistory(userId?: string) {
  const query = useQuery({
    queryKey: ["history", userId],
    queryFn: async () => {
      if (!userId) return [] as DeliveryHistory[];
      const { data, error } = await supabase
        .from("delivery_history")
        .select("*")
        .eq("user_id", userId)
        .order("delivered_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      return (data as DeliveryHistory[]) ?? [];
    },
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    initialData: () => {
      if (!userId) return undefined;
      const cached = getCachedHistory(userId);
      return cached.length ? cached : undefined;
    },
  });

  // Persist fresh data to SQLite whenever it changes.
  useEffect(() => {
    if (query.data && userId && query.data.length) {
      saveHistoryToCache(userId, query.data);
    }
  }, [query.data, userId]);

  return query;
}

export async function fetchHistoryById(id: string): Promise<{
  history: DeliveryHistory | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("delivery_history")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { history: null, error: error.message };
  }
  return { history: (data as DeliveryHistory) ?? null, error: null };
}