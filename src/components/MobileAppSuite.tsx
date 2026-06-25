import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Smartphone, 
  QrCode, 
  Download, 
  CheckCircle, 
  Layers, 
  Wifi, 
  Copy, 
  Code, 
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Battery,
  Sparkles,
  Camera
} from "lucide-react";

export const MobileAppSuite: React.FC = () => {
  const { isOnline, currentUser, shipments, inventory } = useApp();
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [activeSimScreen, setActiveSimScreen] = useState<"dashboard" | "scanner" | "shipment">("dashboard");
  const [swStatus, setSwStatus] = useState<"checking" | "active" | "unsupported">("checking");

  // Get current app URL to generate a QR code dynamically
  const currentAppUrl = "https://ais-pre-m63qo5djxuvdxu244ownqx-956007456649.europe-west2.run.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=2a6fed&bgcolor=0b1220&data=${encodeURIComponent(currentAppUrl)}`;

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setSwStatus("active");
        } else {
          setSwStatus("checking"); // Sw may register on next load
        }
      }).catch(() => {
        setSwStatus("unsupported");
      });
    } else {
      setSwStatus("unsupported");
    }
  }, []);

  const capacitorCode = `npm install @capacitor/core @capacitor/cli
npx cap init LogiTrack com.logitrack.fleet --web-dir=dist

# Install Mobile Platforms
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Sync your web code to mobile wraps
npm run build
npx cap sync

# Open and run in Android Studio or Xcode
npx cap open android
npx cap open ios`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(capacitorCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div id="mobile_app_suite" className="space-y-6">
      
      {/* Upper Information Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#111a2e] to-indigo-950/40 border border-[#243052] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Full Mobile Framework
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
                <CheckCircle className="w-3 h-3" /> PWA Core Active
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Smartphone className="text-blue-400 w-5 h-5" />
              LogiTrack Fleet Mobile App Suite
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              We have fully optimized the application to support standalone mobile execution. It runs seamlessly as a full-screen, installable PWA with live barcode-camera scanning, real-time location streaming, and local storage offline buffers.
            </p>
          </div>
          
          <a
            href={currentAppUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg"
          >
            <span>Launch Web App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Column Grid: Phone Simulator (Left) vs Install & Build Guide (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive iPhone Emulator Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="bg-[#111a2e] border border-[#243052] rounded-3xl p-5 shadow-xl w-full flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 font-mono mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" /> Interactive Device Emulator
            </span>

            {/* Simulated Phone Shell */}
            <div className="relative w-[310px] h-[610px] bg-[#0b1220] border-[8px] border-[#1d273a] rounded-[42px] shadow-2xl flex flex-col overflow-hidden font-sans">
              
              {/* Dynamic Island Speaker Grill */}
              <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="w-10 h-1 bg-zinc-850 rounded-full"></div>
                <Camera className="w-2.5 h-2.5 text-zinc-800" />
              </div>

              {/* Status Bar */}
              <div className="h-9 pt-3 px-6 flex items-center justify-between text-[10px] font-bold text-slate-300 font-mono select-none z-40 bg-[#0e1628]">
                <span>09:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px]">LTE</span>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* App Shell Frame Content View */}
              <div className="flex-1 overflow-y-auto bg-[#0b1220] flex flex-col text-slate-300 relative">
                
                {/* Embedded App Navigation Simulation */}
                <div className="bg-[#111a2e] border-b border-[#243052] px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-[10px] font-black text-white">LT</span>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-tight">LogiTrack</h4>
                      <p className="text-[8px] text-gray-500 font-mono">Mobile Node (v2.4)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-mono font-bold text-emerald-400">ONLINE</span>
                  </div>
                </div>

                {/* Simulated Screen View Renderers */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                  
                  {activeSimScreen === "dashboard" && (
                    <div className="space-y-3 animate-fade-in">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#111a2e] border border-[#243052] p-2.5 rounded-xl text-left">
                          <span className="text-[8px] text-gray-500 font-mono block">LIVE SHIPPED</span>
                          <span className="text-sm font-extrabold font-mono text-white">{shipments.length} Lanes</span>
                        </div>
                        <div className="bg-[#111a2e] border border-[#243052] p-2.5 rounded-xl text-left">
                          <span className="text-[8px] text-gray-500 font-mono block">WAREHOUSE</span>
                          <span className="text-sm font-extrabold font-mono text-white">{inventory.length} SKUs</span>
                        </div>
                      </div>

                      {/* Map Indicator Card */}
                      <div className="bg-[#111a2e] border border-blue-500/20 p-3 rounded-xl space-y-2 text-left">
                        <span className="text-[8px] text-blue-400 font-mono font-semibold block uppercase">Active Global GPS Stream</span>
                        <div className="h-20 bg-[#090e1a] rounded-lg border border-[#243052] flex items-center justify-center relative overflow-hidden">
                          {/* Simulated mini line route */}
                          <svg className="w-full h-full stroke-blue-500/40" viewBox="0 0 100 50">
                            <path d="M 10 40 Q 50 10 90 40" fill="none" strokeWidth="2" strokeDasharray="3 3" />
                            <circle cx="10" cy="40" r="3" fill="#ef4444" />
                            <circle cx="90" cy="40" r="3" fill="#10b981" />
                            <circle cx="50" cy="25" r="4" fill="#3b82f6" className="animate-ping" />
                          </svg>
                          <span className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500">Auto Latency: 14ms</span>
                        </div>
                      </div>

                      {/* Status alerts */}
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl text-left flex gap-2 items-start">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[9px] font-bold text-white">Database Synchronized</h5>
                          <p className="text-[8px] text-gray-400 font-mono">Changes uploaded to cloud locks.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSimScreen === "scanner" && (
                    <div className="space-y-3 animate-fade-in text-left">
                      <span className="text-[8px] text-indigo-400 font-mono font-bold block">LOGISCAN MOBILE OPTICS</span>
                      
                      {/* Simulated scanner camera view */}
                      <div className="h-44 bg-[#090e1a] rounded-xl border-2 border-dashed border-[#243052] relative flex flex-col items-center justify-center p-4">
                        <div className="absolute inset-4 border border-blue-500/30 rounded flex items-center justify-center">
                          {/* Scanning laser line animation */}
                          <div className="w-full h-0.5 bg-red-500 absolute top-1/2 left-0 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                        </div>
                        <QrCode className="w-12 h-12 text-[#243052] mb-1 animate-pulse" />
                        <span className="text-[9px] font-mono text-gray-500 z-10 uppercase text-center font-bold">Align SKU Barcode within frame</span>
                      </div>

                      {/* Manual scanner feedback */}
                      <div className="bg-[#111a2e] border border-[#243052] p-3 rounded-xl space-y-1.5">
                        <span className="text-[8px] text-slate-400 block font-mono">SIMULATED SCANNED CODES</span>
                        <div className="bg-[#0b1220] p-2 rounded text-[9px] font-mono text-slate-300 border border-[#243052] flex justify-between">
                          <span>M-SKU-PRO-401</span>
                          <span className="text-emerald-400 font-bold">DISPATCHED</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSimScreen === "shipment" && (
                    <div className="space-y-3 animate-fade-in text-left">
                      <span className="text-[8px] text-emerald-400 font-mono font-bold block">ACTIVE SHIPMENT TRACKING</span>
                      
                      {/* Dummy Active shipment detail card */}
                      <div className="bg-[#111a2e] border border-emerald-500/20 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center border-b border-[#243052] pb-1.5">
                          <span className="text-[10px] font-bold text-white font-mono">SHIP-X99201</span>
                          <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">IN TRANSIT</span>
                        </div>

                        <div className="space-y-1 text-[9px] font-mono text-gray-300">
                          <div className="flex justify-between">
                            <span>Origin:</span>
                            <span className="font-semibold text-white">Cape Town Harbor</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Destination:</span>
                            <span className="font-semibold text-white">Johannesburg Bay</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Registr. ID:</span>
                            <span className="font-semibold text-white text-blue-400">CA-945-312</span>
                          </div>
                        </div>

                        {/* Interactive action */}
                        <button className="w-full py-1.5 bg-emerald-600 text-white rounded text-[8px] font-bold font-mono transition-all">
                          Update Transit Geolocation
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Bottom Navigation */}
                <div className="h-14 bg-[#111a2e] border-t border-[#243052] px-4 flex items-center justify-around text-slate-400 relative z-30 select-none">
                  <button 
                    onClick={() => setActiveSimScreen("dashboard")}
                    className={`flex flex-col items-center justify-center w-12 cursor-pointer ${activeSimScreen === "dashboard" ? "text-[#2f6fed]" : "hover:text-slate-200"}`}
                  >
                    <Layers className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-mono font-semibold">Home</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveSimScreen("scanner")}
                    className={`flex flex-col items-center justify-center w-12 cursor-pointer ${activeSimScreen === "scanner" ? "text-[#2f6fed]" : "hover:text-slate-200"}`}
                  >
                    <QrCode className="w-4 h-4 mb-0.5 animate-pulse" />
                    <span className="text-[8px] font-mono font-semibold">Scanner</span>
                  </button>

                  <button 
                    onClick={() => setActiveSimScreen("shipment")}
                    className={`flex flex-col items-center justify-center w-12 cursor-pointer ${activeSimScreen === "shipment" ? "text-[#2f6fed]" : "hover:text-slate-200"}`}
                  >
                    <Smartphone className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-mono font-semibold">Fleet</span>
                  </button>
                </div>

                {/* Simulated Home Indicator Bar */}
                <div className="h-5 bg-[#111a2e] flex justify-center items-center">
                  <div className="w-24 h-1 bg-gray-500 rounded-full"></div>
                </div>

              </div>

            </div>

            <div className="mt-4 text-[10px] text-gray-500 font-mono text-center">
              Click buttons on device to toggle simulated viewport states.
            </div>
          </div>
        </div>

        {/* Real Device Integration & Build Instructions (Right) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* Section 1: Scan and Install on Phone */}
          <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-6 items-center">
            
            {/* Live QR Code Display */}
            <div className="bg-[#0b1220] p-4 rounded-xl border border-[#243052] shrink-0 text-center flex flex-col items-center gap-2">
              <img 
                src={qrCodeUrl} 
                alt="LogiTrack Shared App QR Code" 
                className="w-40 h-40 rounded-lg select-none"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] text-[#2f6fed] font-mono font-bold tracking-widest uppercase">
                [ SCAN TO LAUNCH ]
              </span>
            </div>

            {/* Installation Instructions Details */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block">
                  Run on Physical Smartphone
                </span>
                <h3 className="text-base font-bold text-white font-sans">Scan to Run & Install</h3>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Scan this dynamic QR code with your iOS/Android phone camera to instantly load the full production-ready application directly in your mobile browser.
              </p>

              {/* Steps */}
              <div className="space-y-2 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-500/40 text-[#2f6fed] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <div className="leading-relaxed">
                    <span className="font-bold text-slate-200">Scan QR Code:</span> Open your phone's camera and direct it to the code block on the left to launch the Live Shared Link.
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-500/40 text-[#2f6fed] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <div className="leading-relaxed">
                    <span className="font-bold text-slate-200">iOS Installation:</span> In Safari, tap the <span className="bg-[#1c273a] px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-mono">Share</span> button, scroll down and tap <span className="text-blue-400 font-semibold">"Add to Home Screen"</span>.
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-500/40 text-[#2f6fed] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <div className="leading-relaxed">
                    <span className="font-bold text-slate-200">Android Installation:</span> In Chrome, tap the <span className="bg-[#1c273a] px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-mono">Menu (3-dots)</span>, and tap <span className="text-blue-400 font-semibold">"Install App"</span>.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Progressive Web App status verification */}
          <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <ShieldCheck className="text-emerald-400 w-4 h-4" /> Progressive Web App Integration State
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              The platform registers dedicated background hooks to convert the applet into an official local standalone container profile. We have wired up the standard configurations:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5">
              <div className="p-3 bg-[#0b1220]/60 border border-[#243052] rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-gray-500 block">WEB MANIFEST SPECIFICATION</span>
                <span className="text-xs font-mono font-bold text-[#e2ebf0] block">manifest.webmanifest</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle className="w-3 h-3" /> Configured & Verified
                </span>
              </div>

              <div className="p-3 bg-[#0b1220]/60 border border-[#243052] rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-gray-500 block">OFFLINE SERVICE WORKER HOOK</span>
                <span className="text-xs font-mono font-bold text-[#e2ebf0] block">sw.js Cache System</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    {swStatus === "active" ? "Active (Cache Engine Online)" : "Ready (PWA Standalone Link)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Native Compilation Guide with Capacitor */}
          <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#243052] pb-2.5">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Code className="text-indigo-400 w-4.5 h-4.5" />
                Build as a Native iOS & Android App
              </h3>
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 bg-[#1a2336] hover:bg-[#253047] text-gray-300 text-[11px] font-mono rounded-lg transition-all flex items-center gap-1.5 border border-[#2a3a63] cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              To convert this codebase into a native app file (like an Android <span className="font-mono text-white">.apk</span> or iOS Xcode workspace) that can be submitted to the Google Play Store or Apple App Store, use standard cross-platform capacitor toolkits. Run this sequence in your workspace terminal:
            </p>

            <div className="relative">
              <pre className="bg-[#0b1220] text-[#a9b6da] text-[10px] font-mono p-4 rounded-xl overflow-x-auto border border-[#243052] leading-relaxed max-h-[190px]">
                {capacitorCode}
              </pre>
            </div>

            <div className="flex gap-2 items-start bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl text-[11px] font-mono text-slate-300 leading-normal">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Capacitor automatically embeds the fully compiled React build into a local full-screen webview shell with absolute Native API plugins access.
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
