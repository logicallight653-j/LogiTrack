export type UserRole = "ADMIN" | "WAREHOUSE_STAFF" | "DRIVER";

export type SubscriptionTier = "Silver Plan" | "Gold Plan" | "Enterprise SSO Suite";

export interface LogiUser {
  uid: string;
  email: string;
  role: UserRole;
  companyId: string;
  subscription: SubscriptionTier;
  ssoProvider?: string;
}

export interface ProductItem {
  id: string; // SKU or Barcode
  sku: string;
  barcode: string;
  name: string;
  quantity: number;
  minStock: number;
  warehouse: string;
  category: string;
  currentStatus: "In Stock" | "Low Stock" | "Out of Stock";
  description: string;
  lastUpdated: string;
  companyId: string;
}

export interface ShipmentEvent {
  id: string;
  eventType: "QUEUED" | "PACKED" | "LOADED" | "IN_TRANSIT" | "DELIVERED" | "DAMAGED";
  notes: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  operator: string;
}

export interface ShipmentRecord {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  status: "QUEUED" | "PACKED" | "LOADED" | "IN_TRANSIT" | "DELIVERED" | "DAMAGED";
  vehicleId: string;
  driverName: string;
  lastLocation: { lat: number; lng: number } | null;
  items: Array<{ sku: string; name: string; quantity: number }>;
  routeStats: {
    distanceMeters: number;
    durationSeconds: number;
    distanceText: string;
    durationText: string;
  } | null;
  timeline: ShipmentEvent[];
  companyId: string;
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  role: string;
  companyId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "low_stock" | "shipment" | "sync" | "alert";
  read: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: "INVENTORY_ADD" | "INVENTORY_UPDATE" | "ADD_EVENT" | "SHIPMENT_CREATE" | "SHIPMENT_UPDATE";
  collection: string;
  docId: string;
  nestedPath?: string; // For adding to items/X/events
  data: any;
  timestamp: number;
}

export interface TierDetails {
  name: SubscriptionTier;
  monthlyDataCap: number; // Max items
  maxVehicles: number;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierDetails> = {
  "Silver Plan": {
    name: "Silver Plan",
    monthlyDataCap: 1500,
    maxVehicles: 5,
    price: 199,
    features: ["Real-time Sync", "Basic Scanner Support", "Up to 5 Vehicles", "Local Offloads"],
  },
  "Gold Plan": {
    name: "Gold Plan",
    monthlyDataCap: 15000,
    maxVehicles: 25,
    price: 499,
    features: [
      "Real-time Sync",
      "Advanced Barcode Scans",
      "Up to 25 Vehicles",
      "Historical Routes Tracking",
      "Low Stock Notifications",
    ],
  },
  "Enterprise SSO Suite": {
    name: "Enterprise SSO Suite",
    monthlyDataCap: 1000000,
    maxVehicles: 100,
    price: 1499,
    features: [
      "100 Included Vehicles",
      "Overage: R 100 / 25 extra vehicles",
      "Unlimited Scans & Scaling",
      "Custom Data Export & Automated PDFs",
      "Enterprise Connection SSO Support (Azure AD / Okta)",
      "Audit Logs & Action Streams",
      "Dedicated Technical Response",
    ],
  },
};
