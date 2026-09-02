import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

let initialized = false;

function initAuthListener(set: (partial: Partial<AuthState>) => void) {
  if (initialized) return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    set({ session: data.session, isLoading: false });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, isLoading: false });
  });
}

export const useAuthStore = create<AuthState>((set) => {
  initAuthListener(set);

  return {
    session: null,
    isLoading: true,

    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error ? error.message : null };
    },

    signUp: async ({ email, password, fullName }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error) {
        return { error: error.message, needsEmailConfirmation: false };
      }

      if (data.session?.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.session.user.id,
            name: fullName.trim(),
            email: data.session.user.email,
          },
          { onConflict: "id" }
        );
        return { error: null, needsEmailConfirmation: false };
      }

      return {
        error: null,
        needsEmailConfirmation: true,
      };
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ session: null });
    },
  };
});
