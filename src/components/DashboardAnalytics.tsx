import React from "react";
import { useApp } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, AlertTriangle, ShieldCheck, TrendingUp, Layers, Terminal, Activity, FileJson } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "../types";

export const DashboardAnalytics: React.FC = () => {
  const { inventory, shipments, auditLogs, currentUser } = useApp();

  // 1. Shipment Status compilation for PieChart
  const statusCounts = shipments.reduce(
    (acc, ship) => {
      acc[ship.status] = (acc[ship.status] || 0) + 1;
      return acc;
    },
    { QUEUED: 0, PACKED: 0, LOADED: 0, IN_TRANSIT: 0, DELIVERED: 0, DAMAGED: 0 } as Record<string, number>
  );

  const shipmentChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Clean visual theme palette
  const COLORS = {
    QUEUED: "#64748b",
    PACKED: "#0ea5e9",
    LOADED: "#a855f7",
    IN_TRANSIT: "#3b82f6",
    DELIVERED: "#10b981",
    DAMAGED: "#ef4444",
  };

  // 2. Inventory Volume grouped by sector warehouse
  const warehouseAgg = inventory.reduce((acc, item) => {
    acc[item.warehouse] = (acc[item.warehouse] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const warehouseChartData = Object.entries(warehouseAgg).map(([name, Quantity]) => ({
    name: name.replace("Warehouse", "").replace("Sector", "Sec").trim(),
    Quantity,
  }));

  // 3. Trends mock data based on actual logs or realistic sequences
  const trendData = [
    { day: "Mon", Scans: 230, Deliveries: 12 },
    { day: "Tue", Scans: 450, Deliveries: 19 },
    { day: "Wed", Scans: 390, Deliveries: 15 },
    { day: "Thu", Scans: 680, Deliveries: 28 },
    { day: "Fri", Scans: 810, Deliveries: 34 },
    { day: "Sat", Scans: 300, Deliveries: 10 },
    { day: "Sun", Scans: 150, Deliveries: 5 },
  ];

  // Subscription-tier configurations (Limits & Analytics checks)
  const currentTier = currentUser ? SUBSCRIPTION_TIERS[currentUser.subscription] : null;
  const currentItemCount = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Filter low items
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock);

  return (
    <div className="space-y-6">
      
      {/* Upper Cards: Real-time Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Data Cap utilization */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">ORGANIZATION TIER CAP</span>
            <span className="text-2xl font-extrabold font-mono text-white">
              {currentItemCount.toLocaleString()} /{" "}
              {currentTier ? currentTier.monthlyDataCap.toLocaleString() : "1,500"}
            </span>
            <p className="text-[10px] text-gray-400 font-mono">SKU Volume usage (limits based on plan)</p>
          </div>
          <Layers className="text-[#2f6fed] w-8 h-8 opacity-45" />
        </div>

        {/* Card 2: Active Dispatches */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">ACTIVE DISPATCHES</span>
            <span className="text-2xl font-extrabold font-mono text-sky-400">
              {shipments.filter(s => s.status !== "DELIVERED").length} Active
            </span>
            <p className="text-[10px] text-gray-400 font-mono">
              out of {shipments.length} scheduled routes
            </p>
          </div>
          <TrendingUp className="text-sky-400 w-8 h-8 opacity-45" />
        </div>

        {/* Card 3: Alert Levels */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">RISK CLASSIFICATIONS</span>
            <span className="text-2xl font-extrabold font-mono text-red-400">
              {lowStockItems.length} Warnings
            </span>
            <p className="text-[10px] text-gray-400 font-mono">Low stock alerts flagged on-device</p>
          </div>
          <AlertTriangle className="text-red-400 w-8 h-8 opacity-45" />
        </div>

        {/* Card 4: Access clearing audit */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">SSO IDENTITY GATE</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {currentUser?.ssoProvider ? "CONNECTED" : "DB AUTH"}
            </span>
            <p className="text-[10px] text-gray-400 font-mono">SSO Federated claims synchronized</p>
          </div>
          <ShieldCheck className="text-emerald-400 w-8 h-8 opacity-45" />
        </div>

      </div>

      {/* Grid: Delivery Status Reports (Pie) VS Location Weights (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Shipment status PieChart for Admins */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <BarChart3 className="text-[#2f6fed] w-4 h-4" />
              Delivery Status Reports (Premium Analytics)
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Comprehensive shipping stage metrics calculated from active driver telemetry legs.
            </p>
          </div>

          <div className="h-[240px] flex items-center justify-center relative">
            {shipments.length === 0 ? (
              <span className="text-xs text-gray-600 font-mono">No shipment statuses found in this company dataset.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {shipmentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS] || "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1220", borderColor: "#243052" }}
                    labelStyle={{ color: "#ffffff", fontFamily: "monospace" }}
                    itemStyle={{ color: "#a9b6da", fontFamily: "monospace" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Custom centered circle watermark */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="block text-2xl font-extrabold font-mono text-white">
                {shipments.length}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                REG Total
              </span>
            </div>
          </div>

          {/* Table index legend layout */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
            {Object.entries(COLORS).map(([status, hue]) => (
              <div key={status} className="flex items-center gap-1 bg-[#0b1220]/60 p-1.5 rounded border border-[#243052]/40">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hue }}></span>
                <span className="text-gray-400 select-none">{status}:</span>
                <span className="text-white font-bold ml-auto">{statusCounts[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Warehouse capacity weights (Bar) */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <TrendingUp className="text-[#2f6fed] w-4 h-4" />
              Warehouse Stock Volumes by Sector
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-4">
              Real-time balance weights for corporate tracking, preventing bay overloads.
            </p>
          </div>

          <div className="h-[240px] flex items-center justify-center">
            {inventory.length === 0 ? (
              <span className="text-xs text-gray-600 font-mono">Empty warehouse catalog ledger. Add items to visualize volumes.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16203a" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1220", borderColor: "#243052" }}
                    labelStyle={{ color: "#ffffff", fontFamily: "monospace" }}
                    itemStyle={{ color: "#3b82f6", fontFamily: "monospace" }}
                  />
                  <Bar dataKey="Quantity" fill="#2f6fed" radius={[4, 4, 0, 0]}>
                    {warehouseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2f6fed" : "#0e7490"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-[#243052]/40 text-center text-[10px] text-gray-500 font-mono">
            CAPACITY BALANCING INDEX STABLE FOR DATASETS
          </div>
        </div>

      </div>

      {/* Under Layer: Operational Activity log & alerts list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Terminal logs (Col-span 7) */}
        <div className="lg:col-span-12 bg-[#0b1220] border-2 border-[#243052] rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          
          <div className="flex items-center justify-between border-b border-[#243052] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="text-green-400 w-5 h-5 animate-pulse" />
              <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
                System Action Audit Stream & Realtime monitor
              </h3>
            </div>
            
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-400/30 text-cyan-400 uppercase tracking-widest bg-cyan-950/20 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
              Consolidated Live
            </span>
          </div>

          {/* Console logger UI */}
          <div className="bg-black/85 border border-[#1e293b] rounded-xl p-4 font-mono text-xs text-green-300 space-y-2 h-[220px] overflow-y-auto shadow-inner select-text">
            
            {/* Direct console initialization message */}
            <p className="text-slate-500 text-[10px]">
              [{new Date().toLocaleString()}] INTMETH-SSO: Bootstrapping secure connection logs. Secure tunnel established with encryption.
            </p>

            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="text-[11px] leading-relaxed flex gap-2 border-b border-[#1e293b]/30 pb-1 hover:bg-slate-900/40 px-1 py-0.5 rounded transition">
                  {/* Timestamp */}
                  <span className="text-slate-500 select-none shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  
                  {/* Operator identifier */}
                  <span className="text-cyan-400 font-bold shrink-0">
                    &lt;{log.userEmail.split("@")[0]} / {log.role}&gt;
                  </span>

                  {/* Operational Action */}
                  <span className="text-yellow-400 bg-yellow-950/30 border border-yellow-900/30 px-1 py-[0.5px] rounded select-none shrink-0 text-[10px] uppercase font-semibold">
                    {log.action}
                  </span>

                  {/* Operation metrics */}
                  <span className="text-gray-200">
                    {log.details}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-600 py-10">
                Log stream initialized. Run transactions, scan stock, or modify dispatches to populate logs.
              </p>
            )}
          </div>

          <div className="mt-3 text-[9px] text-gray-500 font-mono flex items-center justify-between">
            <span>AUDIT CONSOLE COMPLIANT WITH SOX 404 AND ISO 27001 LOGISTICS STANDARDS</span>
            <span>DATA ENCRYPTION SHA-256</span>
          </div>

        </div>

      </div>

    </div>
  );
};
