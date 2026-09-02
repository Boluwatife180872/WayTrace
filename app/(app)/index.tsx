import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
} from "react-native-maps";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useActiveDelivery } from "@/hooks/use-delivery";
import { useNetworkStore } from "@/lib/network-store";
import { useSimulator } from "@/lib/demo";
import { useAuthStore } from "@/stores/auth";
import type { Delivery, RoutePoint } from "@/types/delivery";

const STATUS_LABEL: Record<string, string> = {
  order_placed: "Order Placed",
  picked_up: "Picked Up",
  on_the_way: "On the Way",
  delivered: "Delivered",
};

type LatLng = { latitude: number; longitude: number };

function fitRegion(delivery: Delivery) {
  const points: RoutePoint[] = [];
  if (delivery.route?.length) points.push(...delivery.route);
  if (delivery.current_lat != null && delivery.current_lng != null) {
    points.push({ lat: delivery.current_lat, lng: delivery.current_lng });
  }
  if (points.length === 0) {
    return { latitude: 6.6018, longitude: 3.3515, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max(maxLat - minLat, 0.008) * 1.4;
  const lngDelta = Math.max(maxLng - minLng, 0.008) * 1.4;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

function TrackingMap({ delivery }: { delivery: Delivery }) {
  const lat = delivery.current_lat;
  const lng = delivery.current_lng;
  const mapRef = useRef<MapView>(null);
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: lat ?? 6.6018,
      longitude: lng ?? 3.3515,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  useEffect(() => {
    if (lat == null || lng == null) return;
    animatedCoordinate
      .timing({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0,
        longitudeDelta: 0,
        toValue: 0,
        duration: 1000,
        useNativeDriver: false,
      })
      .start();

    mapRef.current?.animateCamera(
      { center: { latitude: lat, longitude: lng } },
      { duration: 1000 },
    );
  }, [animatedCoordinate, lat, lng]);

  const initialRegion = useMemo(() => fitRegion(delivery), [delivery]);

  const route: LatLng[] = (delivery.route ?? []).map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }));
  const origin = route[0];
  const destination = route[route.length - 1];

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      showsCompass={false}
    >
      {route.length >= 2 && (
        <Polyline
          coordinates={route}
          strokeColor="#2563EB"
          strokeWidth={4}
          lineDashPattern={[8, 8] as number[]}
        />
      )}
      {origin && (
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="w-8 h-8 bg-white rounded-full border-2 border-slate-700 items-center justify-center shadow-md">
            <Ionicons name="cube-outline" size={14} color="#1E293B" />
          </View>
        </Marker>
      )}
      {destination && (
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="w-8 h-8 bg-white rounded-full border-2 border-[#2563EB] items-center justify-center shadow-md">
            <Ionicons name="home" size={14} color="#2563EB" />
          </View>
        </Marker>
      )}
      {lat != null && lng != null && (
        <MarkerAnimated coordinate={animatedCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="w-10 h-10 bg-[#2563EB] rounded-full border-2 border-white items-center justify-center shadow-lg">
            <FontAwesome5 name="truck" size={16} color="#FFFFFF" />
          </View>
        </MarkerAnimated>
      )}
    </MapView>
  );
}

export default function TrackingScreen() {
  const [showDemo, setShowDemo] = useState(false);
  const session = useAuthStore((s) => s.session);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const lastUpdatedAt = useNetworkStore((s) => s.lastUpdatedAt);
  const router = useRouter();

  const { delivery, loading, error } = useActiveDelivery(session?.user?.id);
  const sim = useSimulator(delivery?.id);

  const isDelivered = delivery?.status === "delivered";

  const lastUpdated = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : delivery?.updated_at
      ? new Date(delivery.updated_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  const arrivedAt = delivery?.updated_at
    ? new Date(delivery.updated_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const driverName = delivery?.driver_name ?? "Marcus J.";
  const eta = delivery?.eta_minutes ?? 8;

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      {/* MAP */}
      <View className="absolute inset-0 bg-[#EBF4FA]">
        {delivery && <TrackingMap delivery={delivery} />}
      </View>

      {/* TOP FLOATING NAVIGATION BAR */}
      <SafeAreaView edges={["top"]} className="z-20">
        <View className="flex-row justify-between items-center px-5 pt-1">
          <TouchableOpacity
            onPress={() => {}}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md shadow-slate-300"
          >
            <Feather name="menu" size={22} color="#0F172A" />
          </TouchableOpacity>

          {/* Demo launcher */}
          <TouchableOpacity
            onPress={() => setShowDemo((v) => !v)}
            className="bg-white/90 px-3 py-1.5 rounded-full border border-slate-200 items-center flex-row shadow-sm"
          >
            <Ionicons name="play-circle" size={16} color="#2563EB" />
            <Text className="ml-1 text-[11px] font-bold text-[#2563EB]">Demo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {}}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md shadow-slate-300 relative"
          >
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
            <View className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-3 right-3 border border-white" />
          </TouchableOpacity>
        </View>

        {/* STATUS ALERT BANNERS */}
        {!isConnected && (
          <View className="mx-4 mt-3 bg-[#D95300] rounded-xl p-4 shadow-lg flex-row items-center">
            <MaterialCommunityIcons name="wifi-off" size={28} color="#FFFFFF" />
            <View className="ml-3 flex-1">
              <Text className="text-white font-bold text-base">You&apos;re offline</Text>
              <Text className="text-white/90 text-xs mt-0.5">
                {lastUpdated
                  ? `Last updated ${lastUpdated}`
                  : "Reconnecting..."}
              </Text>
            </View>
          </View>
        )}

        {/* DEMO FLOATING CARD */}
        {showDemo && delivery && (
          <View className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-lg border border-slate-100 z-30">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-slate-900">Demo simulation</Text>
              <TouchableOpacity onPress={() => setShowDemo(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 font-medium mb-4">
              Run a live test delivery or reset to replay it from the start.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  sim.reset();
                  setShowDemo(false);
                }}
                disabled={sim.busy}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl py-3 items-center justify-center flex-row"
              >
                {sim.busy && delivery ? (
                  <ActivityIndicator size="small" color="#334155" />
                ) : (
                  <>
                    <Feather name="rotate-ccw" size={18} color="#334155" />
                    <Text className="ml-1.5 text-slate-700 font-bold text-sm">Reset</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  sim.run();
                  setShowDemo(false);
                }}
                disabled={sim.busy}
                className="flex-1 bg-[#2563EB] rounded-xl py-3 items-center justify-center flex-row shadow-sm shadow-blue-200"
              >
                {sim.busy && delivery ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play" size={18} color="#FFFFFF" />
                    <Text className="ml-1.5 text-white font-bold text-sm">
                      {isDelivered ? "Re-run" : "Run"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* LOADING */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {/* ERROR / NO DELIVERY */}
      {!loading && (error || !delivery) && (
        <View className="flex-1 justify-center items-center px-6 z-20">
          <View className="bg-white p-6 rounded-3xl w-full items-center shadow-xl border border-slate-100">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="cube-outline" size={40} color="#CBD5E1" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center mb-2">
              No active delivery
            </Text>
            <Text className="text-slate-500 text-center text-sm leading-5">
              {error ?? "You don't have any deliveries in progress right now."}
            </Text>
          </View>
        </View>
      )}

      {/* BOTTOM SHEET / DELIVERY STATUS */}
      {!loading && delivery && (
        <View
          className="rounded-t-[32px] pt-6 px-6 pb-3 shadow-2xl border-t border-slate-100"
          style={{
            backgroundColor: "#FFF",
            marginTop: "auto",
            paddingBottom: Platform.OS === "ios" ? 8 : 12,
          }}
        >
          {isDelivered ? (
            <>
              {/* Delivered confirmation */}
              <View className="items-center mb-5">
                <View className="w-16 h-16 bg-[#16A34A] rounded-full items-center justify-center mb-4 shadow-md shadow-green-200">
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </View>
                <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Delivered!
                </Text>
                <View className="flex-row items-center mt-2 mb-1">
                  <Ionicons name="location" size={14} color="#F97316" />
                  <Text className="text-slate-500 text-sm font-medium ml-1">
                    Arrived at your doorstep
                  </Text>
                </View>
                <Text className="text-slate-400 text-xs font-semibold">
                  Delivered by {driverName}
                  {arrivedAt ? ` · ${arrivedAt}` : ""}
                </Text>
              </View>

              {/* Driver Profile Card */}
              <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 mb-5">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{ uri: delivery.driver_avatar_url ?? undefined }}
                    className="w-12 h-12 rounded-full bg-slate-300"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-slate-900 text-base">
                      {driverName}
                    </Text>
                    <Text className="text-xs text-slate-500 font-medium">
                      Your driver
                    </Text>
                  </View>
                </View>

                <View className="flex-row bg-[#16A34A]/10 rounded-full px-3 py-1.5 items-center">
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text className="text-xs font-bold text-[#16A34A] ml-1">
                    Completed
                  </Text>
                </View>
              </View>

              {/* Primary action: view history */}
              <TouchableOpacity
                onPress={() => router.push("/history")}
                className="bg-[#2563EB] rounded-2xl py-4 items-center shadow-md shadow-blue-200"
              >
                <Text className="text-white font-bold text-base">
                  View delivery history
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Main Arrival Header */}
              <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Driver arriving in {eta} min
              </Text>
              <View className="flex-row items-center mt-1 mb-5">
                <Text className="text-slate-500 text-sm font-medium">
                  Home delivery
                </Text>
                <View className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-2" />
                <Text className="text-[#2563EB] text-sm font-semibold">
                  {STATUS_LABEL[delivery.status] ?? delivery.status}
                </Text>
              </View>

              {/* Driver Profile Card */}
              <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 mb-5">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{ uri: delivery.driver_avatar_url ?? undefined }}
                    className="w-12 h-12 rounded-full bg-slate-300"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-slate-900 text-base">
                      {driverName}
                    </Text>
                    <Text className="text-xs text-slate-500 font-medium">
                      Your driver
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row">
                  <TouchableOpacity className="w-10 h-10 bg-[#2563EB] rounded-full items-center justify-center shadow-sm mr-2">
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity className="w-10 h-10 bg-slate-200 rounded-full items-center justify-center">
                    <Ionicons name="call-sharp" size={18} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

{/* Order Progress Bar */}
      <View className="flex-row items-center">
        <View className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#2563EB] rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, delivery.route_progress))}%` }}
          />
        </View>
        <Text className="ml-3 text-xs font-bold text-slate-600">
          {Math.max(0, Math.min(100, delivery.route_progress))}%
        </Text>
      </View>
      <Text className="text-slate-500 text-xs font-medium mt-2 mb-1">
        {STATUS_LABEL[delivery.status] ?? delivery.status} • {eta} min away
      </Text>
    </>
          )}
        </View>
      )}
    </View>
  );
}
