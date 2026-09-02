export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface TrackingEvent {
  title: string;
  time: string;
  description: string;
  completed: boolean;
}

export interface DeliveryHistory {
  id: string;
  user_id: string;
  order_id: string | null;
  status: string | null;
  price: number | null;
  thumbnail_url: string | null;
  delivered_at: string | null;
  route_snapshot: RoutePoint[] | null;
  status_timestamps: Record<string, string> | null;
}

export interface Delivery {
  id: string;
  user_id: string;
  status: string;
  driver_name: string | null;
  driver_avatar_url: string | null;
  current_lat: number | null;
  current_lng: number | null;
  route: RoutePoint[] | null;
  route_progress: number;
  eta_minutes: number | null;
  created_at: string;
  updated_at: string;
}