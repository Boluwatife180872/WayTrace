export type OrderStatus =
  | "Delivered"
  | "In Transit"
  | "Returned"
  | "Exception";

export interface TrackingEvent {
  title: string;
  time: string;
  description: string;
  completed: boolean;
}

export interface OrderItem {
  id: string;
  price: string;
  date: string;
  status: OrderStatus;
  badgeBg: string;
  badgeText: string;
  accentBorder?: string;
  driverName: string;
  driverRating: string;
  driverAvatar: string;
  items: { name: string; quantity: number }[];
  totalWeight: string;
  timeline: TrackingEvent[];
}

const DRIVER_MARCUS = {
  name: "Marcus J.",
  rating: "4.9",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
};

const DRIVER_SAMANTHA = {
  name: "Samantha L.",
  rating: "4.8",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
};

const DRIVER_DARIUS = {
  name: "Darius K.",
  rating: "4.7",
  avatar:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
};

const DELIVERED_TIMELINE: TrackingEvent[] = [
  {
    title: "Delivered",
    time: "2:15 PM",
    description: "Package left at front door.",
    completed: true,
  },
  {
    title: "Out for Delivery",
    time: "9:42 AM",
    description: "Driver is in your neighborhood.",
    completed: true,
  },
  {
    title: "Arrived at Local Facility",
    time: "6:10 AM",
    description: "San Francisco Distribution Center.",
    completed: true,
  },
  {
    title: "Shipped",
    time: "Yesterday",
    description: "Package has left the origin facility.",
    completed: true,
  },
];

const IN_TRANSIT_TIMELINE: TrackingEvent[] = [
  {
    title: "In Transit",
    time: "2:30 PM",
    description: "Driver is en route to your location.",
    completed: true,
  },
  {
    title: "Arrived at Local Facility",
    time: "11:20 AM",
    description: "San Francisco Distribution Center.",
    completed: true,
  },
  {
    title: "Departed Origin Facility",
    time: "Today, 4:05 AM",
    description: "Package has left the origin facility.",
    completed: true,
  },
  {
    title: "Order Placed",
    time: "Yesterday",
    description: "Payment confirmed and order accepted.",
    completed: true,
  },
];

export const ORDERS: OrderItem[] = [
  {
    id: "#WT-8821",
    price: "$24.50",
    date: "Today, 2:15 PM",
    status: "In Transit",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    accentBorder: "border-l-4 border-l-[#2563EB]",
    driverName: DRIVER_MARCUS.name,
    driverRating: DRIVER_MARCUS.rating,
    driverAvatar: DRIVER_MARCUS.avatar,
    items: [
      { name: "Wireless Noise-Cancelling Headphones", quantity: 1 },
      { name: "USB-C Fast Charging Cable (2m)", quantity: 2 },
    ],
    totalWeight: "1.4 lbs",
    timeline: IN_TRANSIT_TIMELINE,
  },
  {
    id: "#WT-7712",
    price: "$24.50",
    date: "Oct 24",
    status: "Delivered",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    driverName: DRIVER_MARCUS.name,
    driverRating: DRIVER_MARCUS.rating,
    driverAvatar: DRIVER_MARCUS.avatar,
    items: [
      { name: "Wireless Noise-Cancelling Headphones", quantity: 1 },
      { name: "USB-C Fast Charging Cable (2m)", quantity: 2 },
    ],
    totalWeight: "1.4 lbs",
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: "#WT-7804",
    price: "$18.00",
    date: "Today, 2:30 PM",
    status: "In Transit",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    accentBorder: "border-l-4 border-l-[#2563EB]",
    driverName: DRIVER_SAMANTHA.name,
    driverRating: DRIVER_SAMANTHA.rating,
    driverAvatar: DRIVER_SAMANTHA.avatar,
    items: [{ name: "Organic Coffee Beans (1kg)", quantity: 1 }],
    totalWeight: "2.2 lbs",
    timeline: IN_TRANSIT_TIMELINE,
  },
  {
    id: "#WT-7690",
    price: "$45.00",
    date: "Oct 18",
    status: "Returned",
    badgeBg: "bg-slate-200",
    badgeText: "text-slate-600",
    driverName: DRIVER_DARIUS.name,
    driverRating: DRIVER_DARIUS.rating,
    driverAvatar: DRIVER_DARIUS.avatar,
    items: [
      { name: "Smart Home Security Camera", quantity: 1 },
      { name: "Wall Mount Bracket", quantity: 1 },
    ],
    totalWeight: "3.1 lbs",
    timeline: [
      {
        title: "Returned to Sender",
        time: "Oct 18",
        description: "Package returned due to delivery refusal.",
        completed: true,
      },
      {
        title: "Delivery Attempted",
        time: "Oct 17",
        description: "No one was available to receive the package.",
        completed: true,
      },
      {
        title: "Out for Delivery",
        time: "Oct 17",
        description: "Driver attempted delivery.",
        completed: true,
      },
    ],
  },
  {
    id: "#WT-7642",
    price: "$12.75",
    date: "Oct 15",
    status: "Delivered",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    driverName: DRIVER_SAMANTHA.name,
    driverRating: DRIVER_SAMANTHA.rating,
    driverAvatar: DRIVER_SAMANTHA.avatar,
    items: [{ name: "Hardcover Novel", quantity: 1 }],
    totalWeight: "1.1 lbs",
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: "#WT-7588",
    price: "$32.10",
    date: "Oct 10",
    status: "Delivered",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    driverName: DRIVER_DARIUS.name,
    driverRating: DRIVER_DARIUS.rating,
    driverAvatar: DRIVER_DARIUS.avatar,
    items: [
      { name: "Stainless Steel Water Bottle", quantity: 2 },
      { name: "Insulated Lunch Bag", quantity: 1 },
    ],
    totalWeight: "2.8 lbs",
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: "#WT-7411",
    price: "$8.50",
    date: "Oct 02",
    status: "Exception",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    accentBorder: "border border-red-200",
    driverName: DRIVER_MARCUS.name,
    driverRating: DRIVER_MARCUS.rating,
    driverAvatar: DRIVER_MARCUS.avatar,
    items: [{ name: "Phone Case (Clear)", quantity: 1 }],
    totalWeight: "0.5 lbs",
    timeline: [
      {
        title: "Delivery Exception",
        time: "Oct 02",
        description: "Address issue detected. Contact support.",
        completed: true,
      },
      {
        title: "Out for Delivery",
        time: "9:15 AM",
        description: "Driver attempted delivery.",
        completed: true,
      },
    ],
  },
  {
    id: "#WT-7350",
    price: "$55.00",
    date: "Sep 28",
    status: "Delivered",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    driverName: DRIVER_SAMANTHA.name,
    driverRating: DRIVER_SAMANTHA.rating,
    driverAvatar: DRIVER_SAMANTHA.avatar,
    items: [{ name: "Mechanical Keyboard (RGB)", quantity: 1 }],
    totalWeight: "3.4 lbs",
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: "#WT-7201",
    price: "$19.99",
    date: "Sep 14",
    status: "Delivered",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    driverName: DRIVER_DARIUS.name,
    driverRating: DRIVER_DARIUS.rating,
    driverAvatar: DRIVER_DARIUS.avatar,
    items: [{ name: "Fitness Resistance Bands Set", quantity: 1 }],
    totalWeight: "1.8 lbs",
    timeline: DELIVERED_TIMELINE,
  },
];

export function getOrderById(id: string): OrderItem | undefined {
  return ORDERS.find((order) => order.id.toLowerCase() === id.toLowerCase());
}
