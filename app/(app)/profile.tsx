import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth";
import { useProfile } from "@/hooks/use-profile";

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const [loading, setLoading] = useState(false);

  const user = session?.user;
  const userId = user?.id;

  const { profile, refresh } = useProfile(userId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const displayEmail = user?.email ?? "";
  const displayName =
    profile?.name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await signOut();
          setLoading(false);
        },
      },
    ]);
  };

  const menuItems = [
    { icon: "notifications-outline" as const, label: "Notifications" },
    { icon: "shield-checkmark-outline" as const, label: "Privacy & Security" },
    { icon: "headset-outline" as const, label: "Help & Support" },
  ];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
      >
        <Text className="text-2xl font-extrabold text-slate-900 mb-5">
          Profile
        </Text>

        {/* User Card */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex-row items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-[#2563EB] items-center justify-center shadow-md shadow-blue-200">
            <Text className="text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-slate-900">
              {displayName}
            </Text>
            <Text className="text-slate-500 text-xs font-medium mt-0.5">
              {displayEmail}
            </Text>
            <View className="mt-2 bg-blue-50 border border-blue-200 self-start px-2.5 py-0.5 rounded-full">
              <Text className="text-[#2563EB] text-[10px] font-bold">
                PRO ACCOUNT
              </Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center p-4 active:bg-slate-50 ${
                index < menuItems.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
                <Ionicons name={item.icon} size={20} color="#2563EB" />
              </View>
              <Text className="text-slate-800 font-semibold text-sm flex-1">
                {item.label}
              </Text>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loading}
          className="bg-red-50 py-4 rounded-2xl items-center border border-red-100 flex-row justify-center active:bg-red-100"
        >
          {loading ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <MaterialIcons name="logout" size={18} color="#DC2626" />
              <Text className="text-red-600 font-bold text-sm ml-2">Log out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
