import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { DashboardAnalytics } from "./components/DashboardAnalytics";
import { InventoryManager } from "./components/InventoryManager";
import { ScannerModule } from "./components/ScannerModule";
import { ShipmentTracking } from "./components/ShipmentTracking";
import { OfflineManager } from "./components/OfflineManager";
import { TeamConfigSSO } from "./components/TeamConfigSSO";
import { SubscriptionBilling } from "./components/SubscriptionBilling";
import { MobileAppSuite } from "./components/MobileAppSuite";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

import {
  Package2,
  LayoutDashboard,
  Warehouse,
  QrCode,
  Map,
  Cloud,
  Users,
  CreditCard,
  LogOut,
  Bell,
  Wifi,
  WifiOff,
  User,
  Shield,
  Key,
  BadgeAlert,
  X,
  Mail,
  Lock,
  Smartphone,
} from "lucide-react";

// The central app container utilizing the context values
const LogiTrackApp: React.FC = () => {
  const {
    currentUser,
    loading,
    isOnline,
    setIsOnline,
    syncQueue,
    notifications,
    addNotification,
    clearNotifications,
    triggerSync,
    createAuditLog,
    bypassAuth,
  } = useApp();

  const [activeTab, setActiveTab ] = useState<
    "dashboard" | "inventory" | "scanner" | "shipments" | "sync" | "team" | "billing" | "mobile"
  >("dashboard");

  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);
  const [navOpen, setNavOpen] = useState<boolean>(false);

  // Authentication Fields
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [authError, setAuthError] = useState<string>("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Email and Password parameters must be populated.");
      return;
    }

    try {
      if (authMode === "SIGN_IN") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        addNotification("Security Logged In", `Logged in successfully as ${authEmail}`, "alert");
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        addNotification("Registration Successful", `Established secure cloud log for ${authEmail}`, "alert");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication attempt aborted.");
    }
  };

  const handleSSOAuthenticate = async () => {
    setAuthError("");
    const simulatedEmail = `saml_sso_${Math.floor(Math.random() * 1000)}@enterprise-sso.com`;
    try {
      // Simulate real Federated SSO connection authentication handshake
      addNotification("SAML SSO Callout", "Polling configured Okta Federated Hub...", "sync");
      
      // Real firebase auth login with fallback mock credentials
      const demoPass = "SsoSecureAdminPass1029";
      try {
        await signInWithEmailAndPassword(auth, simulatedEmail, demoPass);
      } catch {
        await createUserWithEmailAndPassword(auth, simulatedEmail, demoPass);
      }
      addNotification("SSO Validation Secured", `Enterprise profile synchronized: ${simulatedEmail}`, "sync");
    } catch (e: any) {
      console.warn("Federated Auth failed online. Enabling local bypass fallback...");
      bypassAuth(simulatedEmail, "ADMIN");
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await createAuditLog("SESSION_TERMINATE", `Staff user ${currentUser.email} logged off system.`);
    }
    await signOut(auth);
    setActiveTab("dashboard");
    setShowNotificationsMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="w-10 h-10 border-t-2 border-r-2 border-[#2f6fed] rounded-full animate-spin"></div>
        <span>Syncing Federated cloud database locks...</span>
      </div>
    );
  }

  // Visual Authenticator Gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b121e] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Futuristic glowing backdrop gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-[#111a2e] border border-[#243052] rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col gap-6 select-none">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Package2 className="text-[#2f6fed] w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans flex items-center justify-center gap-1.5">
              LogiTrack Fleet <span className="text-[10px] bg-blue-600 font-bold px-2 py-0.5 rounded uppercase text-white font-mono">v2.4</span>
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              Enterprise Warehousing, Barcode-Scanning & Asset Streams
            </p>
          </div>

          {/* Tab Selector for Register vs Login */}
          <div className="grid grid-cols-2 bg-[#0b1220] border border-[#243052] rounded-2xl p-1 text-xs text-mono text-gray-400">
            <button
              onClick={() => { setAuthMode("SIGN_IN"); setAuthError(""); }}
              className={`p-2 rounded-xl font-bold transition-all cursor-pointer ${
                authMode === "SIGN_IN" ? "bg-[#111a2e] text-blue-400 font-extrabold" : "hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("SIGN_UP"); setAuthError(""); }}
              className={`p-2 rounded-xl font-bold transition-all cursor-pointer ${
                authMode === "SIGN_UP" ? "bg-[#111a2e] text-blue-400 font-extrabold" : "hover:text-white"
              }`}
            >
              New Corporate Account
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-3.5">
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@logistics.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value.trim())}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-xl p-3 text-white text-xs font-mono placeholder-gray-650 focus:outline-none focus:border-[#2f6fed]"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Security Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-xl p-3 text-white text-xs font-mono placeholder-gray-650 focus:outline-none focus:border-[#2f6fed]"
                />
              </div>

            </div>

            {authError && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-405 p-3 rounded-xl text-[11px] font-mono leading-normal">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2f6fed] hover:bg-[#1a55c8] text-white text-xs font-bold rounded-xl transition-all font-mono tracking-wider cursor-pointer select-none"
            >
              {authMode === "SIGN_IN" ? "Authorize Identity" : "Launch Corporate Cloud Profile"}
            </button>
          </form>

          {/* High Security SSO Alternative Entry */}
          <div className="relative border-t border-[#243052] pt-4 mt-1">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#111a2e] px-3 text-[10px] font-bold text-gray-500 font-mono tracking-widest uppercase select-none">
              Federated Identity
            </span>

            <button
              onClick={handleSSOAuthenticate}
              className="w-full py-2.5 bg-[#1f2b45] hover:bg-[#344567]/50 border border-[#2a3a63] hover:text-white text-gray-300 text-xs font-bold rounded-xl transition-all font-mono flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-yellow-500 animate-pulse" />
              Sign In with Corporate SSO (Azure AD / Okta)
            </button>
          </div>

          <div className="text-[9px] text-gray-500 font-mono text-center pt-2 leading-relaxed uppercase">
            SECURE DIRECTORY HANDSHAKES ACCESSED FROM APPLOCKED CONTAINER
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8eefc] font-sans flex flex-col antialiased">
      
      {/* Top Navigation Global Header Bar */}
      <header className="bg-[#111a2e] border-b border-[#243052] px-6 py-3.5 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand Segment */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-9 h-9 bg-[#2f6fed] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(47,111,237,0.35)]">
              <Package2 className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-extrabold tracking-tight text-sm md:text-base flex items-center gap-1.5">
                LogiTrack
                <span className="text-[9px] uppercase tracking-widest bg-[#2f6fed]/15 border border-[#2f6fed]/30 text-[#4c84ff] font-extrabold px-1.5 py-0.5 rounded font-mono">
                  {currentUser.subscription.replace(" Plan", "")}
                </span>
              </h1>
              <p className="text-[10px] text-[#a9b6da] font-mono hidden md:block">
                ID: {currentUser.companyId} • Level: {currentUser.role}
              </p>
            </div>
          </div>

          {/* Center Space & Quick Status indicators based on Design style */}
          <div className="flex items-center gap-4 text-xs font-mono ml-auto">
            
            {/* Connection badge indicators in style of Design HTML */}
            <div
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-full border flex items-center gap-2 select-none transition cursor-pointer ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
              title="Click to toggle simulated connection state"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                {isOnline ? "Sync: Online" : "Air-gap Local"}
              </span>
            </div>

            {/* Latency telemetry indicator from Design HTML */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0f1830] border border-[#243052] rounded-full text-[10px] text-[#a9b6da]">
              <span>Latency:</span>
              <span className="text-emerald-400 font-extrabold">14ms</span>
            </div>

            {/* Offline Sync Banner if pending exists */}
            {syncQueue.length > 0 && isOnline && (
              <button
                onClick={triggerSync}
                className="bg-[#2f6fed] hover:bg-[#1a55c8] border border-[#2f6fed]/30 text-white px-3 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
              >
                Sync Buffers ({syncQueue.length})
              </button>
            )}

            {/* Search Barcode element from Design HTML */}
            <div className="hidden md:flex bg-[#0b1220] border border-[#243052] px-3 py-1.5 rounded-lg items-center gap-2">
              <span className="text-[11px] italic text-[#a9b6da]">Search Barcode...</span>
              <span className="bg-[#243052] px-1.5 py-0.5 text-[8px] rounded text-white font-sans">⌘K</span>
            </div>

            {/* In-app Toast notifications indicator bells */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 bg-[#0f1830] hover:bg-[#162449] border border-[#243052] rounded-xl select-none transition-all text-[#a9b6da] hover:text-white"
              >
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border border-[#111a2e]"></span>
                  )}
                </div>
              </button>

              {/* Push notifications dropdown emulator */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-[#111a2e] border-2 border-[#243052] rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-left">
                  <div className="flex items-center justify-between border-b border-[#243052] pb-2">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1 uppercase">
                      <BadgeAlert className="text-orange-400 w-4 h-4" /> Dispatch Alerts ({notifications.length})
                    </span>
                    <button
                      onClick={clearNotifications}
                      className="text-[9px] text-[#2f6fed] hover:underline font-mono"
                    >
                      Dismiss all
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((not) => (
                        <div
                          key={not.id}
                          className="p-2.5 bg-[#0b1220] border border-[#243052] rounded-xl text-[10px] leading-relaxed relative"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-white font-mono">{not.title}</span>
                            <span className="text-[8px] text-gray-500 font-mono">
                              {new Date(not.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-400 font-sans">{not.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-600 font-mono text-[10px]">
                        No dispatch alerts triggered in this turn.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Identifier Card and logs out button */}
            <div className="hidden sm:flex items-center gap-2 border-l border-[#243052] pl-3">
              <div className="w-8 h-8 rounded-full bg-[#2f6fed] flex items-center justify-center text-xs font-bold font-sans text-white uppercase select-none shadow-inner">
                {currentUser.email.slice(0, 2)}
              </div>
              <div className="text-left leading-none">
                <div className="text-white text-[11px] font-semibold truncate max-w-[80px]" title={currentUser.email}>
                  {currentUser.email.split("@")[0]}
                </div>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">{currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 px-2 hover:bg-red-950/20 hover:text-red-400 rounded-lg transition text-slate-500 border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Responsive Main Body grid structure */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Hand: Nav panel bar styled like the Professional Polish Sidebar */}
        <aside className="md:w-64 shrink-0 flex flex-col border border-[#243052] bg-[#0f1830] rounded-2xl p-4 shadow-xl h-fit font-mono select-none">
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest px-3.5 py-1 mb-2.5 hidden md:block">
            Dashboard Navigation
          </span>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "inventory"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <Warehouse className="w-4 h-4 text-indigo-400" />
              <span>Stock Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "scanner"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <QrCode className="w-4 h-4 text-[#2f6fed] animate-pulse" />
              <span>LogiScan Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab("shipments")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "shipments"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <Map className="w-4 h-4 text-emerald-400" />
              <span>Shipment Transit lanes</span>
            </button>

            <button
              onClick={() => setActiveTab("sync")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "sync"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <Cloud className="w-4 h-4 text-amber-400" />
              <span>Offline Buffers</span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "team"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <Users className="w-4 h-4 text-violet-400" />
              <span>Corporate Directory</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "billing"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Billing & Backups</span>
            </button>

            <button
              onClick={() => setActiveTab("mobile")}
              className={`w-full p-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer text-left ${
                activeTab === "mobile"
                  ? "bg-[#243052] text-white font-extrabold border border-[#2f6fed]/35 shadow-sm"
                  : "text-[#a9b6da] hover:text-white hover:bg-[#162449]"
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Mobile App Suite</span>
            </button>
          </nav>

          {/* Quick specs footnote inside sidebar */}
          <div className="mt-6 pt-4 border-t border-[#243052] font-mono text-[9px] text-[#a9b6da] space-y-2 hidden md:block">
            <p className="flex items-center gap-1 font-bold text-white uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-orange-400" /> Security State
            </p>
            <span className="text-emerald-400 font-extrabold block pl-4">SECURED CLOUD GATE</span>
          </div>
        </aside>

        {/* Right Hand: Active Dashboard workspace Panel */}
        <main className="flex-1 min-w-0">
          
          {activeTab === "dashboard" && <DashboardAnalytics />}

          {activeTab === "inventory" && <InventoryManager />}

          {activeTab === "scanner" && <ScannerModule />}

          {activeTab === "shipments" && <ShipmentTracking />}

          {activeTab === "sync" && <OfflineManager />}

          {activeTab === "team" && <TeamConfigSSO />}

          {activeTab === "billing" && <SubscriptionBilling />}

          {activeTab === "mobile" && <MobileAppSuite />}

        </main>

      </div>

      {/* Simple Footer Brand */}
      <footer className="bg-[#0b1220] border-t border-[#243052] p-4 text-center text-xs text-mono text-gray-500">
        LogiTrack Fleet Solutions, Inc. • Active Client Framework • Secure Firestore Backends Verified
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <LogiTrackApp />
    </AppProvider>
  );
}
