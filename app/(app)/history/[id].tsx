import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { fetchHistoryById } from "@/hooks/use-history";
import type { DeliveryHistory, TrackingEvent } from "@/types/delivery";

const { width } = Dimensions.get("window");

const STATUS_ICONS: Record<string, { name: any; color: string }> = {
  Delivered: { name: "checkmark-circle", color: "#059669" },
  "In Transit": { name: "time", color: "#2563EB" },
  Returned: { name: "return-up-back", color: "#64748B" },
  Exception: { name: "alert-circle", color: "#DC2626" },
};

const TIMELINE_STEPS: { key: string; label: string; description: string }[] = [
  { key: "order_placed", label: "Order Placed", description: "Payment confirmed and order accepted." },
  { key: "picked_up", label: "Picked Up", description: "Driver picked up the package." },
  { key: "on_the_way", label: "On the Way", description: "Package is heading to your location." },
  { key: "delivered", label: "Delivered", description: "Package was delivered successfully." },
];

function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildTimeline(history: DeliveryHistory): TrackingEvent[] {
  const stamps: Record<string, string> = (history.status_timestamps as Record<string, string>) ?? {};
  return TIMELINE_STEPS.map((step) => ({
    title: step.label,
    description: step.description,
    time: formatTime(stamps[step.key]),
    completed: Boolean(stamps[step.key]),
  }));
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [history, setHistory] = useState<DeliveryHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rowId = typeof id === "string" ? id : "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchHistoryById(rowId).then((res) => {
      if (!active) return;
      setHistory(res.history);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [rowId]);

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!history) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-5">
            <Ionicons name={error ? "cloud-offline-outline" : "search"} size={36} color="#CBD5E1" />
          </View>
          <Text className="text-xl font-bold text-slate-800 text-center mb-2">
            Order not found
          </Text>
          <Text className="text-slate-500 text-center text-sm mb-6">
            {error ?? "We couldn't find this order."}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#2563EB] py-3 px-8 rounded-2xl"
          >
            <Text className="text-white font-bold">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusIcon = STATUS_ICONS[history.status ?? ""] ?? STATUS_ICONS.Exception;
  const tracking: TrackingEvent[] = buildTimeline(history);
  const deliveredAt = history.delivered_at
    ? new Date(history.delivered_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-white border-b border-slate-100 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
        >
          <Feather name="arrow-left" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-900 tracking-tight">
          Order {history.order_id}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Map Header Preview Section */}
        <View className="h-56 bg-[#E0F2FE] relative overflow-hidden">
          <View className="absolute inset-0 bg-[#EBF4FA]">
            <View className="absolute right-0 top-0 bottom-0 w-2/5 bg-[#BAE6FD] opacity-60" />

            <View
              className="absolute bg-[#2563EB] rounded-full"
              style={{
                width: 5,
                height: 280,
                left: width * 0.2,
                top: -20,
                transform: [{ rotate: "-65deg" }],
              }}
            />

            <View className="absolute right-8 top-12 bg-white p-2 rounded-full border-2 border-slate-700 shadow-md items-center justify-center">
              <FontAwesome5 name="warehouse" size={14} color="#1E293B" />
            </View>

            <View className="absolute left-6 bottom-10 bg-white p-2 rounded-full border-2 border-[#2563EB] shadow-md items-center justify-center">
              <Ionicons name="home" size={16} color="#2563EB" />
            </View>
          </View>

          {/* Floating Status Banner Card on Map */}
          <View className="absolute bottom-3 left-4 right-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex-row justify-between items-center">
            <View>
              <Text className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                STATUS
              </Text>
              <View className="flex-row items-center">
                <Ionicons name={statusIcon.name} size={24} color={statusIcon.color} />
                <Text
                  className="text-2xl font-black ml-2"
                  style={{ color: statusIcon.color }}
                >
                  {history.status}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                {history.status?.toUpperCase()}
              </Text>
              <Text className="text-xl font-bold text-slate-900">
                {deliveredAt}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View className="px-4 pt-5 space-y-4">
          {/* Order Info Card */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                ORDER
              </Text>
              <Text className="text-base font-extrabold text-slate-900">
                {history.order_id ?? "—"}
              </Text>
            </View>
            {history.price != null && (
              <View className="items-end">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  TOTAL
                </Text>
                <Text className="text-lg font-extrabold text-slate-900">
                  ${history.price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Tracking History Section */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <Text className="text-lg font-extrabold text-slate-900 mb-5">
              Tracking History
            </Text>

            {tracking.length === 0 ? (
              <Text className="text-slate-500 text-sm">
                No tracking events available.
              </Text>
            ) : (
              <View className="space-y-6">
                {tracking.map((event, index) => {
                  const isLast = index === tracking.length - 1;
                  return (
                    <View
                      key={`${event.title}-${index}`}
                      className="flex-row items-start relative"
                      style={{ paddingBottom: isLast ? 0 : 20 }}
                    >
                      {!isLast && tracking[index + 1]?.completed && (
                        <View className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-slate-200" />
                      )}
                      <View
                        className={`w-7 h-7 rounded-full border-2 items-center justify-center z-10 mr-3.5 ${
                          event.completed
                            ? "border-[#2563EB] bg-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        <View
                          className={`w-3 h-3 rounded-full ${
                            event.completed ? "bg-[#2563EB]" : "bg-slate-200"
                          }`}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-base font-bold text-slate-900">
                            {event.title}
                          </Text>
                          <Text className="text-xs font-medium text-slate-400">
                            {event.time}
                          </Text>
                        </View>
                        <Text className="text-xs text-slate-500 font-medium mt-1">
                          {event.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Order Summary Section */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <Text className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              ORDER SUMMARY
            </Text>

            {history.price != null && (
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-slate-900 font-extrabold text-base">
                  Total
                </Text>
                <Text className="text-slate-700 font-semibold text-sm">
                  ${history.price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* View Digital Receipt Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-slate-100 py-4 rounded-2xl items-center justify-center flex-row mt-4 mb-2 active:bg-slate-200"
          >
            <Ionicons name="receipt-outline" size={20} color="#2563EB" />
            <Text className="text-[#2563EB] font-bold text-base ml-2.5">
              View Digital Receipt
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
