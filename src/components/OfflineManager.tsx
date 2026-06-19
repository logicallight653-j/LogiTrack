import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Wifi, WifiOff, RefreshCw, Layers, Database, AlertTriangle, Play } from "lucide-react";

export const OfflineManager: React.FC = () => {
  const { isOnline, setIsOnline, syncQueue, triggerSync, currentUser } = useApp();
  const [syncing, setSyncing] = useState<boolean>(false);

  const handleToggleState = () => {
    const newState = !isOnline;
    setIsOnline(newState);
  };

  const handleManualSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    await triggerSync();
    setSyncing(false);
  };

  return (
    <div id="offline_network_sim_module" className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      <div className="flex items-center justify-between border-b border-[#243052] pb-4 mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
          {isOnline ? (
            <Wifi className="text-green-400 w-5 h-5" />
          ) : (
            <WifiOff className="text-red-400 w-5 h-5 animate-bounce" />
          )}
          Remote Offline Synchronizer
        </h2>
        
        {/* Connection Slider toggle */}
        <button
          onClick={handleToggleState}
          className={`px-4 py-2 text-xs font-bold rounded-xl border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
            isOnline
              ? "bg-[#2f6fed]/10 border-[#2f6fed]/30 text-[#2f6fed] hover:bg-[#2f6fed]/20"
              : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {isOnline ? "Force Offline Sim" : "Go Online (Reconnect)"}
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        Warehouse bays and remote shipping sectors frequently suffer from signal dropout. Switch offline to buffer scanned items and tracking coordinates, then watch them automatically upload when signals resume.
      </p>

      {/* Grid Layout: Status vs Synced Items list */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Connection status card (Col-span 5) */}
        <div className="md:col-span-5 bg-[#0b1220]/60 border border-[#243052] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 font-mono block mb-1">NETWORK LATENCY STATUS</span>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-ping" : "bg-red-500"}`}></div>
              <span className="text-lg font-bold font-mono tracking-tight text-white">
                {isOnline ? "ONLINE (32ms LTE)" : "OFFLINE (AIR GAP)"}
              </span>
            </div>

            <span className="text-xs font-semibold text-gray-400 font-mono block mb-1">QUEUED CACHE LOGS</span>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold font-mono text-white">{syncQueue.length}</span>
              <span className="text-xs text-gray-500">Document Actions Buffered</span>
            </div>
            
            {syncQueue.length > 0 && !isOnline && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-200 p-2.5 rounded-lg text-xs flex gap-2 items-start font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>Sync locked. Go online to trigger atomic cloud uploads.</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncQueue.length === 0 || syncing}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isOnline && syncQueue.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-[#1f2b45] text-gray-400 cursor-not-allowed border border-[#2a3a63]"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Uploading..." : "Trigger Manual Database Sync"}
            </button>
          </div>
        </div>

        {/* Queued Items List details (Col-span 7) */}
        <div className="md:col-span-7 bg-[#0b1220]/60 border border-[#243052] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
                Local SQLite / Storage Queue Buffer
              </h3>
              <Layers className="text-gray-500 w-4 h-4" />
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {syncQueue.length > 0 ? (
                syncQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-[#111a2e] border border-[#243052] p-2.5 rounded-lg flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-[#2a3a63]/40 border border-[#2a3a63] px-1.5 py-0.5 rounded text-[10px] text-blue-400">
                        {item.type}
                      </span>
                      <span className="text-gray-300 font-bold truncate max-w-[120px]" title={item.docId}>
                        {item.docId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{item.collection}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Database className="w-8 h-8 text-[#243052] mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-mono">
                    Local queue index is empty. Scanned changes are syncing to Firestore directly in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#243052] mt-4 pt-3 flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span>PERSISTENCE: LOCAL_STORAGE (ENCRYPTED)</span>
            <span>COMPANY ID: {currentUser?.companyId}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
