import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
    } else {
      setProfile(data as Profile | null);
    }
    setLoading(false);
  }, [userId]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, "name" | "avatar_url">>) => {
      if (!userId) return null;
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select("*")
        .maybeSingle();

      if (updateError) return updateError;
      setProfile(data as Profile);
      return null;
    },
    [userId]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile, updateProfile };
}