import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNetworkStore } from "@/lib/network-store";
import { getCachedDelivery, saveDeliveryToCache } from "@/lib/local-db";
import type { Delivery } from "@/types/delivery";

export function useActiveDelivery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["delivery", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Delivery) ?? null;
    },
    enabled: !!userId,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    initialData: () => {
      const cached = userId ? getCachedDelivery(userId) : null;
      return cached?.delivery ?? undefined;
    },
    initialDataUpdatedAt: () => {
      const cached = userId ? getCachedDelivery(userId) : null;
      return cached?.updatedAt;
    },
  });

  // Persist fresh data to SQLite whenever it changes (initial fetch or realtime).
  useEffect(() => {
    if (query.data && userId) {
      saveDeliveryToCache(userId, query.data);
    }
  }, [query.data, userId]);

  useEffect(() => {
    const deliveryId = query.data?.id;
    if (!deliveryId || !userId) return;

    const channel = supabase
      .channel(`delivery-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          queryClient.setQueryData(["delivery", userId], payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        () => {
          queryClient.setQueryData(["delivery", userId], null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.data?.id, userId, queryClient]);

  // "Last updated" banner: prefer the SQLite cache timestamp so a cold,
  // offline relaunch shows the true last-sync time instead of the current time.
  useEffect(() => {
    if (!userId) return;
    const cached = getCachedDelivery(userId);
    const ts = query.dataUpdatedAt || cached?.updatedAt;
    if (ts) {
      useNetworkStore.getState().setLastUpdatedAt(ts);
    }
  }, [userId, query.dataUpdatedAt]);

  useEffect(() => {
    return useNetworkStore.subscribe((state, prevState) => {
      if (state.isConnected && !prevState.isConnected) {
        queryClient.invalidateQueries({ queryKey: ["delivery", userId] });
      }
    });
  }, [queryClient, userId]);

  return {
    delivery: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
  };
}
