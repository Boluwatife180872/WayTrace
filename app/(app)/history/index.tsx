import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Feather, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useHistory } from "@/hooks/use-history";
import { useNetworkStore } from "@/lib/network-store";
import { useAuthStore } from "@/stores/auth";
import type { DeliveryHistory } from "@/types/delivery";

type ScreenState = "loading" | "success" | "empty" | "error" | "offline" | "refreshing";

const STATUS_STYLE: Record<string, { badgeBg: string; badgeText: string }> = {
  Delivered: { badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  "In Transit": { badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  Returned: { badgeBg: "bg-slate-200", badgeText: "text-slate-600" },
  Exception: { badgeBg: "bg-red-100", badgeText: "text-red-700" },
};

const HistoryRow = memo(function HistoryRow({ item }: { item: DeliveryHistory }) {
  const router = useRouter();
  const style = STATUS_STYLE[item.status ?? ""] ?? STATUS_STYLE.Exception;
  const deliveredAt = item.delivered_at
    ? new Date(item.delivered_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/history/${item.id}`)}
      className="bg-white rounded-2xl p-3.5 flex-row items-center justify-between shadow-sm border border-slate-100 mb-3"
    >
      {/* Thumbnail */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200"
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      ) : (
        <View className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 justify-center items-center relative">
          <View className="absolute inset-0 bg-[#EBF4FA]" />
          <View className="w-10 h-0.5 bg-[#2563EB] transform -rotate-12" />
          <Ionicons
            name="location-sharp"
            size={14}
            color="#2563EB"
            style={{ position: "absolute", top: 8, right: 12 }}
          />
        </View>
      )}

      {/* Order Info */}
      <View className="flex-1 ml-3.5">
        <Text className="text-slate-900 font-extrabold text-base">
          {item.order_id}
        </Text>
        <Text className="text-slate-400 text-xs font-medium mt-0.5">
          {deliveredAt}
        </Text>
        <Text className="text-slate-500 text-[11px] font-medium mt-0.5">
          {item.order_id ?? item.status ?? ""}
        </Text>
      </View>

      {/* Price & Status Badge */}
      <View className="items-end">
        <Text className="text-slate-900 font-extrabold text-base mb-1">
          {item.price != null ? `$${item.price.toFixed(2)}` : ""}
        </Text>
        <View className={`px-2.5 py-1 rounded-full ${style.badgeBg}`}>
          <Text className={`text-xs font-bold ${style.badgeText}`}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function HistorySkeleton() {
  return (
    <View className="flex-1 px-5 pt-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="bg-white rounded-2xl p-3.5 flex-row items-center border border-slate-100 mb-3"
        >
          <View className="w-14 h-14 rounded-xl bg-slate-200 animate-pulse" />
          <View className="flex-1 ml-3.5">
            <View className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <View className="h-3 w-16 bg-slate-100 rounded mt-2 animate-pulse" />
            <View className="h-3 w-28 bg-slate-100 rounded mt-2 animate-pulse" />
          </View>
          <View className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
        </View>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const session = useAuthStore((s) => s.session);
  const query = useHistory(session?.user?.id);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const [searchQuery, setSearchQuery] = useState("");

  const history = query.data ?? [];
  const hasData = history.length > 0;
  const isOffline = !isConnected;

  const state: ScreenState = useMemo<ScreenState>(() => {
    if (isOffline && !hasData) return "offline";
    if (query.isPending && !hasData) return "loading";
    if (query.isError && !hasData) return "error";
    if (!hasData) return "empty";
    return query.isFetching ? "refreshing" : "success";
  }, [isOffline, hasData, query.isPending, query.isError, query.isFetching]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.order_id?.toLowerCase().includes(q) ||
        h.status?.toLowerCase().includes(q) ||
        new Date(h.delivered_at ?? "").toDateString().toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  const handleRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const keyExtractor = useCallback((item: DeliveryHistory) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: DeliveryHistory }) => <HistoryRow item={item} />,
    []
  );
  const handleChangeSearch = useCallback(
    (text: string) => setSearchQuery(text),
    []
  );
  const handleClearSearch = useCallback(() => setSearchQuery(""), []);

  const listHeader = useMemo(
    () => (
      <View className="flex-row items-center justify-between mb-4 px-0">
        <Text className="text-2xl font-extrabold text-slate-900">History</Text>
        <Text className="text-slate-400 text-xs font-semibold">
          {filtered.length} {filtered.length === 1 ? "order" : "orders"}
        </Text>
      </View>
    ),
    [filtered.length]
  );

  const listEmpty = useMemo(
    () => (
      <View className="items-center justify-center py-16">
        <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-5">
          <Ionicons name="search" size={32} color="#CBD5E1" />
        </View>
        <Text className="text-slate-800 font-bold text-base mb-1">
          No orders found
        </Text>
        <Text className="text-slate-500 text-sm text-center px-8">
          Try a different search term or order ID.
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
      {/* HEADER BAR */}
      <View className="flex-row justify-between items-center px-5 py-3 bg-white border-b border-slate-100">
        <FontAwesome5 name="truck" size={20} color="#2563EB" />
        <Text className="text-xl font-extrabold text-slate-900 tracking-tight">
          WayTrace
        </Text>
        <TouchableOpacity className="relative w-10 h-10 items-center justify-center rounded-full active:bg-slate-100">
          <Ionicons name="notifications-outline" size={24} color="#2563EB" />
          <View className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2 border border-white" />
        </TouchableOpacity>
      </View>

      {/* SEARCH INPUT BAR */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm mb-5">
          <Feather name="search" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={handleChangeSearch}
            placeholder="Search orders..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-slate-800 text-sm font-normal p-0"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* OFFLINE BANNER */}
      {isOffline && hasData && (
        <View className="mx-5 mb-4 bg-[#D95300] rounded-xl p-3 flex-row items-center">
          <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold ml-2 flex-1">
            You're offline — showing cached orders
          </Text>
        </View>
      )}

      {/* STATE: LOADING */}
      {state === "loading" && <HistorySkeleton />}

      {/* STATE: OFFLINE (no data) */}
      {state === "offline" && (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-3xl w-full items-center shadow-xl border border-slate-100">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="cloud-offline-outline" size={36} color="#CBD5E1" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center mb-2">
              You're offline
            </Text>
            <Text className="text-slate-500 text-center text-sm mb-5">
              Connect to the internet to load your order history.
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="bg-[#2563EB] py-3 px-8 rounded-2xl"
            >
              <Text className="text-white font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE: ERROR (no data) */}
      {state === "error" && (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-3xl w-full items-center shadow-xl border border-slate-100">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle-outline" size={36} color="#CBD5E1" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center mb-2">
              Couldn't load history
            </Text>
            <Text className="text-slate-500 text-center text-sm mb-5">
              {query.error instanceof Error ? query.error.message : "Something went wrong."}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="bg-[#2563EB] py-3 px-8 rounded-2xl"
            >
              <Text className="text-white font-bold">Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE: SUCCESS / REFRESHING / EMPTY (list) */}
      {(state === "success" || state === "refreshing") && (
        <FlashList
          style={{ flex: 1 }}
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          refreshing={query.isFetching && hasData}
          onRefresh={handleRefresh}
          ListEmptyComponent={listEmpty}
        />
      )}

      {/* STATE: EMPTY (list scrolls under header) */}
      {state === "empty" && <>{listHeader}{listEmpty}</>}
    </SafeAreaView>
  );
}