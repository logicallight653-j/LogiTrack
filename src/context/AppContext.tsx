import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import {
  LogiUser,
  UserRole,
  SubscriptionTier,
  ProductItem,
  ShipmentRecord,
  ShipmentEvent,
  AuditLog,
  NotificationItem,
  SyncQueueItem,
  SUBSCRIPTION_TIERS,
} from "../types";

const DEFAULT_INVENTORY = (companyId: string): ProductItem[] => [
  {
    id: "SKU-A892",
    sku: "SKU-A892",
    barcode: "5012345678901",
    name: "High-Density Forklift Batteries",
    quantity: 24,
    minStock: 25,
    warehouse: "Main Hub Sector 4",
    category: "Machinery",
    currentStatus: "Low Stock",
    description: "Industrial grade rechargeable 48V power packs for warehouse reach trucks.",
    lastUpdated: new Date().toISOString(),
    companyId: companyId
  },
  {
    id: "SKU-B129",
    sku: "SKU-B129",
    barcode: "5012345678918",
    name: "Carbon Fiber Cargo Straps",
    quantity: 450,
    minStock: 100,
    warehouse: "Western Depot Sector 9",
    category: "Safety Gear",
    currentStatus: "In Stock",
    description: "Heavy duty ratcheting tie-downs for flatbed trailer securing.",
    lastUpdated: new Date().toISOString(),
    companyId: companyId
  },
  {
    id: "SKU-C048",
    sku: "SKU-C048",
    barcode: "5012345678925",
    name: "RFID Transit Pallet Tags",
    quantity: 0,
    minStock: 50,
    warehouse: "East Terminal Sector 1",
    category: "Electronics",
    currentStatus: "Out of Stock",
    description: "UHF passive tracking transponders with dual adhesive backing.",
    lastUpdated: new Date().toISOString(),
    companyId: companyId
  },
  {
    id: "SKU-D812",
    sku: "SKU-D812",
    barcode: "5012345678932",
    name: "Ergonomic Scanning Terminals",
    quantity: 18,
    minStock: 10,
    warehouse: "Main Hub Sector 2",
    category: "Hardware",
    currentStatus: "In Stock",
    description: "Rugged Android handheld terminal with built-in zebra scanning engine.",
    lastUpdated: new Date().toISOString(),
    companyId: companyId
  }
];

const DEFAULT_SHIPMENTS = (companyId: string): ShipmentRecord[] => [
  {
    id: "SH-99283-X",
    origin: "Singapore Terminal",
    destination: "Los Angeles Port",
    carrier: "Fleet Unit 42 (Tesla Semi)",
    status: "IN_TRANSIT",
    vehicleId: "V-TESLA-042",
    driverName: "Marcus Vance",
    lastLocation: { lat: 34.0522, lng: -118.2437 },
    items: [
      { sku: "SKU-A892", name: "High-Density Forklift Batteries", quantity: 12 },
      { sku: "SKU-B129", name: "Carbon Fiber Cargo Straps", quantity: 80 }
    ],
    routeStats: {
      distanceMeters: 8800000,
      durationSeconds: 1036800,
      distanceText: "8,800 km",
      durationText: "12 days"
    },
    timeline: [
      {
        id: "ev_1",
        eventType: "QUEUED",
        notes: "Shipment scheduled and uploaded to LogiTrack network.",
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        lat: null,
        lng: null,
        operator: "demo@logitrack.com"
      },
      {
        id: "ev_2",
        eventType: "IN_TRANSIT",
        notes: "Cargo vessel completed channel lock and is currently navigating ocean lanes.",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        lat: 34.0522,
        lng: -118.2437,
        operator: "demo@logitrack.com"
      }
    ],
    companyId: companyId,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "SH-99104-Y",
    origin: "London Central Hub",
    destination: "Munich Warehouse",
    carrier: "External Partner (API Tier)",
    status: "DELIVERED",
    vehicleId: "V-VOLVO-881",
    driverName: "Dieter Klose",
    lastLocation: { lat: 48.1351, lng: 11.582 },
    items: [
      { sku: "SKU-D812", name: "Ergonomic Scanning Terminals", quantity: 4 }
    ],
    routeStats: {
      distanceMeters: 1100000,
      durationSeconds: 39600,
      distanceText: "1,100 km",
      durationText: "11 hours"
    },
    timeline: [
      {
        id: "ev_3",
        eventType: "QUEUED",
        notes: "Shipment registered via API gateway.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        lat: null,
        lng: null,
        operator: "billing-system@logitrack.com"
      },
      {
        id: "ev_4",
        eventType: "DELIVERED",
        notes: "Safe drop and digital signature received at Munich loading dock.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        lat: 48.1351,
        lng: 11.582,
        operator: "Dieter Klose"
      }
    ],
    companyId: companyId,
    lastUpdated: new Date().toISOString()
  }
];

const DEFAULT_AUDIT_LOGS = (companyId: string): AuditLog[] => [
  {
    id: "log_1",
    timestamp: new Date().toISOString(),
    userId: "bypass-uid",
    userEmail: "demo@logitrack.com",
    role: "ADMIN",
    action: "SYSTEM_INITIALIZED",
    details: "Established secure corporate database directory logs.",
    companyId: companyId
  }
];

interface AppContextType {
  currentUser: LogiUser | null;
  fbUser: User | null;
  loading: boolean;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  syncQueue: SyncQueueItem[];
  queueOfflineAction: (type: SyncQueueItem["type"], collection: string, docId: string, data: any, nestedPath?: string) => void;
  triggerSync: () => Promise<void>;
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type: NotificationItem["type"]) => void;
  clearNotifications: () => void;
  inventory: ProductItem[];
  shipments: ShipmentRecord[];
  auditLogs: AuditLog[];
  createAuditLog: (action: string, details: string) => Promise<void>;
  updateUserRole: (newRole: UserRole) => Promise<void>;
  changeSubscriptionTier: (newTier: SubscriptionTier) => Promise<void>;
  fetchRealtimeData: () => void;
  addInventoryItem: (item: Omit<ProductItem, "companyId" | "currentStatus">) => Promise<void>;
  updateInventoryQty: (id: string, newQty: number) => Promise<void>;
  addShipment: (shipment: Omit<ShipmentRecord, "companyId" | "lastUpdated" | "timeline">) => Promise<void>;
  addShipmentTimelineEvent: (shipmentId: string, eventType: ShipmentRecord["status"], notes: string, lat: number | null, lng: number | null) => Promise<void>;
  bypassAuth: (email?: string, role?: UserRole) => void;
  seedSampleData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside active AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<LogiUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Offline Synchronization & Simulation Controls
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  
  // Real-time collections in storage
  const [inventory, setInventory] = useState<ProductItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Track standard browser connection changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Load local storage queue
    const savedQueue = localStorage.getItem("logitrack_sync_queue");
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Queue restore failed:", e);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync to local storage whenever queue changes
  useEffect(() => {
    localStorage.setItem("logitrack_sync_queue", JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Auth subscription & initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFbUser(user);
        // Load custom user profile, create one if missing
        const userDocRef = doc(db, "users", user.uid);
        let role: UserRole = "ADMIN";
        let companyId = "C-" + user.email?.split("@")[0].toUpperCase() || "C-ENTERPRISE";
        let subscription: SubscriptionTier = "Enterprise SSO Suite"; // default to highest to showcase advanced analytics

        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            role = data.role || "ADMIN";
            companyId = data.companyId || companyId;
            subscription = data.subscription || "Enterprise SSO Suite";
          } else {
            // New register - establish default profile
            const newProfile = {
              uid: user.uid,
              email: user.email!,
              role,
              companyId,
              subscription,
            };
            await setDoc(userDocRef, newProfile);
          }
          
          const profile: LogiUser = {
            uid: user.uid,
            email: user.email!,
            role,
            companyId,
            subscription,
          };
          setCurrentUser(profile);
          addNotification(
            "Session Established",
            `Authenticated as ${profile.email} (${profile.role})`,
            "alert"
          );
        } catch (err) {
          console.error("Error setting up user profile in auth", err);
          // Fallback UI profile
          setCurrentUser({
            uid: user.uid,
            email: user.email!,
            role: "ADMIN",
            companyId: "C-TEMP_OFFLINE",
            subscription: "Enterprise SSO Suite",
          });
        }
      } else {
        setFbUser(null);
        setCurrentUser(null);
        setInventory([]);
        setShipments([]);
        setAuditLogs([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch real-time data when online, filter by company ID
  useEffect(() => {
    if (!currentUser) return;
    
    let unsubInventory: () => void;
    let unsubShipments: () => void;
    let unsubAuditLogs: () => void;

    if (isOnline) {
      try {
        // 1. Live Inventory Sync
        const invCol = collection(db, "inventory");
        const invQ = query(invCol, where("companyId", "==", currentUser.companyId));
        unsubInventory = onSnapshot(invQ, (snap) => {
          const items: ProductItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({ id: docSnap.id, ...data } as ProductItem);
          });
          if (items.length === 0) {
            setInventory(DEFAULT_INVENTORY(currentUser.companyId));
          } else {
            setInventory(items);
          }
          
          // Check stock limits & push alerts for low inventory
          const activeItems = items.length === 0 ? DEFAULT_INVENTORY(currentUser.companyId) : items;
          activeItems.forEach((item) => {
            if (item.quantity === 0) {
              triggerLowStockPush(item, "Out of Stock");
            } else if (item.quantity <= item.minStock) {
              triggerLowStockPush(item, "Low Stock Alert");
            }
          });
        });

        // 2. Live Shipments Sync
        const shipCol = collection(db, "shipments");
        const shipQ = query(shipCol, where("companyId", "==", currentUser.companyId));
        unsubShipments = onSnapshot(shipQ, (snap) => {
          const list: ShipmentRecord[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as ShipmentRecord);
          });
          if (list.length === 0) {
            setShipments(DEFAULT_SHIPMENTS(currentUser.companyId));
          } else {
            setShipments(list);
          }
        });

        // 3. Live Audit Logs Sync
        const audCol = collection(db, "audit_logs");
        const audQ = query(
          audCol,
          where("companyId", "==", currentUser.companyId),
          orderBy("timestamp", "desc"),
          limit(55)
        );
        unsubAuditLogs = onSnapshot(audQ, (snap) => {
          const list: AuditLog[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
          });
          if (list.length === 0) {
            setAuditLogs(DEFAULT_AUDIT_LOGS(currentUser.companyId));
          } else {
            setAuditLogs(list);
          }
        });

      } catch (err) {
        console.error("Firestore live listener failed", err);
      }
    } else {
      // Offline mode - retrieve what is in local state or fallback standard list
      console.log("Device is offline. Data listening frozen. Offline state running.");
    }

    return () => {
      if (unsubInventory) unsubInventory();
      if (unsubShipments) unsubShipments();
      if (unsubAuditLogs) unsubAuditLogs();
    };
  }, [currentUser, isOnline]);

  // Handle auto-syncing when switching back online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      triggerSync();
    }
  }, [isOnline]);

  // Helper to send push notifications for low items
  const triggerLowStockPush = (item: ProductItem, type: string) => {
    const notifyId = `low_${item.sku}_${Date.now()}`;
    const message = `SKU: ${item.sku} (${item.name}) is at ${item.quantity} units in ${item.warehouse}!`;
    
    // Prevent duplicated notification prompts within short intervals
    setNotifications((prev) => {
      const alreadyHasMatched = prev.some(
        (n) => n.title.includes(item.sku) && (Date.now() - new Date(n.timestamp).getTime() < 30000)
      );
      if (alreadyHasMatched) return prev;
      return [
        {
          id: notifyId,
          title: `⚠️ ${type} [${item.sku}]`,
          message,
          timestamp: new Date().toISOString(),
          type: "low_stock",
          read: false,
        },
        ...prev,
      ];
    });
  };

  const addNotification = (title: string, message: string, type: NotificationItem["type"]) => {
    const fresh: NotificationItem = {
      id: "not_" + Math.random().toString(36).substr(2, 9),
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };
    setNotifications((prev) => [fresh, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Push local items into synchronization queue when offline
  const queueOfflineAction = (
    type: SyncQueueItem["type"],
    collectionName: string,
    docId: string,
    data: any,
    nestedPath?: string
  ) => {
    const activeItem: SyncQueueItem = {
      id: "sync_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now(),
      type,
      collection: collectionName,
      docId,
      nestedPath,
      data,
      timestamp: Date.now(),
    };
    setSyncQueue((prev) => [...prev, activeItem]);
    addNotification("Operation Buffered", `Action queued offline: ${type}`, "sync");
  };

  // Run synchronization of actions queued in offline gaps
  const triggerSync = async () => {
    if (!isOnline || syncQueue.length === 0) return;
    
    addNotification("Synchronizing Logs", `Re-launching ${syncQueue.length} buffered actions to FireStore...`, "sync");
    
    const failedOnes: SyncQueueItem[] = [];
    
    for (const action of syncQueue) {
      try {
        if (action.type === "INVENTORY_ADD") {
          await setDoc(doc(db, action.collection, action.docId), action.data);
        } else if (action.type === "INVENTORY_UPDATE") {
          await setDoc(doc(db, action.collection, action.docId), action.data, { merge: true });
        } else if (action.type === "SHIPMENT_CREATE") {
          await setDoc(doc(db, action.collection, action.docId), action.data);
        } else if (action.type === "SHIPMENT_UPDATE") {
          await setDoc(doc(db, action.collection, action.docId), action.data, { merge: true });
        } else if (action.type === "ADD_EVENT") {
          // Log inside Shipment timeline subcollection or array
          const shipmentDocRef = doc(db, "shipments", action.docId);
          const shipmentSnap = await getDoc(shipmentDocRef);
          if (shipmentSnap.exists()) {
            const currentShipment = shipmentSnap.data() as ShipmentRecord;
            const updatedTimeline = [...(currentShipment.timeline || []), action.data];
            await setDoc(shipmentDocRef, {
              status: action.data.eventType,
              timeline: updatedTimeline,
              lastLocation: action.data.lat && action.data.lng ? { lat: action.data.lat, lng: action.data.lng } : currentShipment.lastLocation,
            }, { merge: true });
          }
        }
      } catch (err) {
        console.error("Single action sync failing", action, err);
        failedOnes.push(action); // keep in queue for retry if fatal db interruption
      }
    }

    setSyncQueue(failedOnes);
    if (failedOnes.length === 0) {
      addNotification("Cloud Synchronized", `Successfully updated cloud backend!`, "sync");
    } else {
      addNotification("Sync Unfinished", `Could not synchronize ${failedOnes.length} records. Re-queued.`, "alert");
    }
  };

  const createAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    const payload: AuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      userId: currentUser.uid,
      userEmail: currentUser.email,
      role: currentUser.role,
      action,
      details,
      companyId: currentUser.companyId,
    };

    if (isOnline) {
      try {
        await setDoc(doc(db, "audit_logs", logId), payload);
      } catch (err) {
        console.error("Save audit failed online", err);
      }
    } else {
      // Buffered logic for audit
      queueOfflineAction("INVENTORY_UPDATE", "audit_logs", logId, payload);
      // Simulate optimistic insert
      setAuditLogs((prev) => [payload, ...prev]);
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    
    if (isOnline) {
      await setDoc(doc(db, "users", currentUser.uid), { role: newRole }, { merge: true });
    }
    setCurrentUser(updated);
    addNotification("Access Level Altered", `Switching role clearances to [${newRole}]`, "alert");
    createAuditLog("ROLE_OVERRIDE", `User overridden permissions role to [${newRole}]`);
  };

  const changeSubscriptionTier = async (newTier: SubscriptionTier) => {
    if (!currentUser) return;
    const updated = { ...currentUser, subscription: newTier };
    
    if (isOnline) {
      await setDoc(doc(db, "users", currentUser.uid), { subscription: newTier }, { merge: true });
    }
    setCurrentUser(updated);
    addNotification("Billing Tier Changed", `Successfully upgraded company to [${newTier}]`, "sync");
    createAuditLog("BILLING_UPGRADE", `Subscribed company organization to ${newTier}`);
  };

  // Inventory logic integrations with offline backup
  const addInventoryItem = async (item: Omit<ProductItem, "companyId" | "currentStatus">) => {
    if (!currentUser) return;

    let qtyStatus: ProductItem["currentStatus"] = "In Stock";
    if (item.quantity === 0) qtyStatus = "Out of Stock";
    else if (item.quantity <= item.minStock) qtyStatus = "Low Stock";

    const payload: ProductItem = {
      ...item,
      currentStatus: qtyStatus,
      companyId: currentUser.companyId,
    };

    if (isOnline) {
      await setDoc(doc(db, "inventory", item.sku), payload);
    } else {
      queueOfflineAction("INVENTORY_ADD", "inventory", item.sku, payload);
      // Synchronize in-client view immediately (optimistic offline state)
      setInventory((prev) => {
        const filtered = prev.filter((i) => i.sku !== item.sku);
        return [payload, ...filtered];
      });
    }

    addNotification("Inventory Added", `SKU: ${payload.sku} catalogued in ${payload.warehouse}`, "low_stock");
    createAuditLog("INVENTORY_CATALOGUE", `Item catalogued in system: [${payload.sku}] ${payload.name} (Qty: ${payload.quantity})`);
  };

  const updateInventoryQty = async (id: string, newQty: number) => {
    if (!currentUser) return;
    const currentItem = inventory.find((i) => i.id === id);
    if (!currentItem) return;

    let qtyStatus: ProductItem["currentStatus"] = "In Stock";
    if (newQty === 0) qtyStatus = "Out of Stock";
    else if (newQty <= currentItem.minStock) qtyStatus = "Low Stock";

    const updated = {
      ...currentItem,
      quantity: newQty,
      currentStatus: qtyStatus,
      lastUpdated: new Date().toISOString(),
    };

    if (isOnline) {
      await setDoc(doc(db, "inventory", id), { quantity: newQty, currentStatus: qtyStatus, lastUpdated: updated.lastUpdated }, { merge: true });
    } else {
      queueOfflineAction("INVENTORY_UPDATE", "inventory", id, { quantity: newQty, currentStatus: qtyStatus, lastUpdated: updated.lastUpdated });
      // Optimistic state
      setInventory((prev) => prev.map((item) => (item.id === id ? updated : item)));
    }

    createAuditLog("QUANTITY_ADJUST", `Adjusted [${currentItem.sku}] stock level from ${currentItem.quantity} to ${newQty}`);
  };

  // Shipments logic integrations
  const addShipment = async (shipment: Omit<ShipmentRecord, "companyId" | "lastUpdated" | "timeline">) => {
    if (!currentUser) return;
    
    const initialEvent: ShipmentEvent = {
      id: "ev_" + Date.now(),
      eventType: "QUEUED",
      notes: "Shipment scheduled and uploaded to LogiTrack network.",
      timestamp: new Date().toISOString(),
      lat: null,
      lng: null,
      operator: currentUser.email,
    };

    const payload: ShipmentRecord = {
      ...shipment,
      companyId: currentUser.companyId,
      lastUpdated: new Date().toISOString(),
      timeline: [initialEvent],
    };

    if (isOnline) {
      await setDoc(doc(db, "shipments", shipment.id), payload);
    } else {
      queueOfflineAction("SHIPMENT_CREATE", "shipments", shipment.id, payload);
      setShipments((prev) => [payload, ...prev]);
    }

    addNotification("Shipment Scheduled", `Shipment route: ${payload.origin} -> ${payload.destination} setup.`, "shipment");
    createAuditLog("SHIPMENT_SCHEDULE", `Shipment setup [${payload.id}] assigned to driver ${payload.driverName}`);
  };

  const addShipmentTimelineEvent = async (
    shipmentId: string,
    eventType: ShipmentRecord["status"],
    notes: string,
    lat: number | null,
    lng: number | null
  ) => {
    if (!currentUser) return;
    const target = shipments.find((s) => s.id === shipmentId);
    if (!target) return;

    const newEvent: ShipmentEvent = {
      id: "ev_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      eventType,
      notes,
      timestamp: new Date().toISOString(),
      lat,
      lng,
      operator: currentUser.email,
    };

    const updatedTimeline = [...(target.timeline || []), newEvent];
    const updatedShipment: ShipmentRecord = {
      ...target,
      status: eventType,
      timeline: updatedTimeline,
      lastLocation: lat !== null && lng !== null ? { lat, lng } : target.lastLocation,
      lastUpdated: new Date().toISOString(),
    };

    if (isOnline) {
      await setDoc(doc(db, "shipments", shipmentId), {
        status: eventType,
        timeline: updatedTimeline,
        lastLocation: updatedShipment.lastLocation,
        lastUpdated: updatedShipment.lastUpdated,
      }, { merge: true });
    } else {
      queueOfflineAction("ADD_EVENT", "shipments", shipmentId, newEvent);
      // Apply offline sync state
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updatedShipment : s)));
    }

    addNotification("Shipment Update", `Shipment [${shipmentId}] switched status to: ${eventType}`, "shipment");
    createAuditLog("SHIPMENT_EVENT", `Logged update status [${eventType}] on shipment ${shipmentId}. Coordinates: (${lat || "-"}, ${lng || "-"})`);
  };

  const fetchRealtimeData = () => {
    // Manually fetch fallback mock records if offline inside tests or startup
    console.log("Triggered data refresh");
  };

  const bypassAuth = (email: string = "demo@logitrack.com", role: UserRole = "ADMIN") => {
    setLoading(true);
    const profile: LogiUser = {
      uid: "bypass-uid-" + Date.now(),
      email: email,
      role: role,
      companyId: "C-DEMO",
      subscription: "Enterprise SSO Suite",
    };
    // Pre-populate with default fallback data immediately
    setInventory(DEFAULT_INVENTORY("C-DEMO"));
    setShipments(DEFAULT_SHIPMENTS("C-DEMO"));
    setAuditLogs(DEFAULT_AUDIT_LOGS("C-DEMO"));
    
    setCurrentUser(profile);
    addNotification("Bypass Mode Enabled", `Logged in locally as ${email}`, "alert");
    setLoading(false);
  };

  const seedSampleData = async () => {
    if (!currentUser) return;
    addNotification("Seeding Depot", "Uploading default catalogue models to cloud...", "sync");
    
    const companyId = currentUser.companyId;
    const inv = DEFAULT_INVENTORY(companyId);
    const sh = DEFAULT_SHIPMENTS(companyId);
    const logs = DEFAULT_AUDIT_LOGS(companyId);

    if (isOnline) {
      try {
        for (const item of inv) {
          await setDoc(doc(db, "inventory", item.sku), item);
        }
        for (const s of sh) {
          await setDoc(doc(db, "shipments", s.id), s);
        }
        for (const l of logs) {
          await setDoc(doc(db, "audit_logs", l.id), l);
        }
        addNotification("Seeding Complete", "Sample data successfully persisted in cloud repository.", "alert");
      } catch (err: any) {
        console.error("Online seeding failed: ", err);
        addNotification("Seeding Failed Online", "Using in-memory sample backup.", "alert");
      }
    }

    setInventory(inv);
    setShipments(sh);
    setAuditLogs(logs);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        fbUser,
        loading,
        isOnline,
        setIsOnline,
        syncQueue,
        queueOfflineAction,
        triggerSync,
        notifications,
        addNotification,
        clearNotifications,
        inventory,
        shipments,
        auditLogs,
        createAuditLog,
        updateUserRole,
        changeSubscriptionTier,
        fetchRealtimeData,
        addInventoryItem,
        updateInventoryQty,
        addShipment,
        addShipmentTimelineEvent,
        bypassAuth,
        seedSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
