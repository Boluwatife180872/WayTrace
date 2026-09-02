import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useAuthStore } from "@/stores/auth";

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error: signUpError, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName: name,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsEmailConfirmation) {
      setSuccess(
        "Account created! Check your email to confirm your account before logging in."
      );
    } else {
      router.replace("/(app)");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header Section */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-[#0F172A] rounded-3xl items-center justify-center shadow-lg shadow-blue-500/20 mb-6 p-4 border border-slate-700">
              <View className="relative w-14 h-14 justify-center items-center">
                <Image source={require("../../assets/images/waytrace.jpg")} className="w-12 h-12" />
                <View className="absolute top-1 right-1">
                  <Feather name="trending-up" size={24} color="#0066FF" />
                </View>
                <Text className="text-white font-extrabold text-[10px] mt-1 tracking-tighter">
                  WayTrace
                </Text>
              </View>
            </View>

            <Text className="text-3xl font-extrabold text-[#0066FF] tracking-tight">
              Create Account
            </Text>
            <Text className="text-slate-500 text-sm font-medium mt-1.5">
              Start tracking your shipments
            </Text>
          </View>

          {/* Form Section */}
          <View className="space-y-4">
            {/* Name Field */}
            <View className="mb-4">
              <Text className="text-slate-600 font-semibold text-xs mb-2">
                Full Name
              </Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3.5 py-3 shadow-sm">
                <Feather name="user" size={18} color="#94A3B8" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  className="flex-1 ml-3 text-slate-800 text-sm font-normal p-0"
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-slate-600 font-semibold text-xs mb-2">
                Email
              </Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3.5 py-3 shadow-sm">
                <Feather name="mail" size={18} color="#94A3B8" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-slate-800 text-sm font-normal p-0"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-slate-600 font-semibold text-xs mb-2">
                Password
              </Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3.5 py-3 shadow-sm">
                <Feather name="lock" size={18} color="#94A3B8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-slate-800 text-sm font-normal p-0"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error/Success Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-xs font-medium">{error}</Text>
              </View>
            )}
            {success && (
              <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-green-600 text-xs font-medium">{success}</Text>
              </View>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
              className="bg-[#0066FF] py-3.5 rounded-xl items-center shadow-md shadow-blue-500/30 mb-6"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Sign up</Text>
              )}
            </TouchableOpacity>

            {/* Links */}
            <View className="items-center">
              <View className="flex-row items-center mt-3">
                <Text className="text-slate-500 text-xs">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text className="text-[#0066FF] font-semibold text-xs">
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
