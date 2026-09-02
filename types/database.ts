import type { Profile } from "./profile";
import type { Delivery, DeliveryHistory } from "./delivery";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
      };
      deliveries: {
        Row: Delivery;
        Insert: Omit<Delivery, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Delivery>;
      };
      delivery_history: {
        Row: DeliveryHistory;
        Insert: Omit<DeliveryHistory, "id"> & {
          id?: string;
        };
        Update: Partial<DeliveryHistory>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type { Delivery, DeliveryHistory, Profile };