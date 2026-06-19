import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Navigation, Compass, MapPin, Truck, AlertCircle, History, Play, Square, Loader, Plus, MapPinOff } from "lucide-react";
import { ShipmentRecord, ShipmentEvent, SUBSCRIPTION_TIERS } from "../types";

// Static positions for interactive visual maps simulation (Depot coordinates to map SVG dots)
const DEPOTS = {
  "Main Warehouse A": { lat: 37.7749, lng: -122.4194, label: "MWA-San Francisco" },
  "Oakland Port Terminal": { lat: 37.8044, lng: -122.2712, label: "OAK-Oakland Terminal" },
  "San Jose Logistics Hub": { lat: 37.3382, lng: -121.8863, label: "SJH-San Jose Hub" },
  "Sacramento Cargo Bay": { lat: 38.5816, lng: -121.4944, label: "SAC-Sacramento Bay" },
};

// Map lat/lng coordinates to standard SVG width/height (ranging SF Bay latitude range)
const normalizeCoordsToSvg = (lat: number, lng: number) => {
  const minLat = 37.2;
  const maxLat = 38.7;
  const minLng = -122.6;
  const maxLng = -121.3;

  const x = ((lng - minLng) / (maxLng - minLng)) * 500; // SVG Width: 500
  const y = 300 - ((lat - minLat) / (maxLat - minLat)) * 300; // SVG Height: 300 (invert y)
  return { x, y };
};

// Haversine distance calculator in meters
const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Earth radius
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
};

export const ShipmentTracking: React.FC = () => {
  const { shipments, addShipment, addShipmentTimelineEvent, currentUser, isOnline, addNotification } = useApp();
  
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  
  // Create Shipment form state
  const [idInput, setIdInput] = useState<string>("");
  const [originSelect, setOriginSelect] = useState<string>("Main Warehouse A");
  const [destSelect, setDestSelect] = useState<string>("Oakland Port Terminal");
  const [driverName, setDriverName] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [carrierInput, setCarrierInput] = useState<string>("LogiTrack Express");
  const [selectedItems, setSelectedItems] = useState<Array<{ sku: string; name: string; quantity: number }>>([]);
  const [itemSkuInput, setItemSkuInput] = useState<string>("");
  const [itemQtyInput, setItemQtyInput] = useState<number>(5);

  // Driver Telemetry Live Simulation State
  const [isDriveTracking, setIsDriveTracking] = useState<boolean>(false);
  const [gpsLatitude, setGpsLatitude] = useState<number>(37.7749);
  const [gpsLongitude, setGpsLongitude] = useState<number>(-122.4194);
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [lastSentLatLng, setLastSentLatLng] = useState<{ lat: number; lng: number } | null>(null);
  
  const [velocity, setVelocity] = useState<string>("0 m/s (0 km/h)");
  const [throttleDebug, setThrottleDebug] = useState<string>("Inactive - Waiting to drive");
  const [routeStatsText, setRouteStatsText] = useState<string>("No active drive leg running");
  const drivingTimerRef = useRef<any>(null);

  // Completed Map Static view simulation
  const [historyShipmentId, setHistoryShipmentId] = useState<string>("");
  const [staticViewShipment, setStaticViewShipment] = useState<ShipmentRecord | null>(null);

  // Setup sample shipment data if none exist on startup to facilitate evaluation
  useEffect(() => {
    if (shipments.length > 0 && !selectedShipment) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments]);

  // Clean simulator stream timer
  useEffect(() => {
    return () => {
      if (drivingTimerRef.current) clearInterval(drivingTimerRef.current);
    };
  }, []);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput) return alert("Please supply a unique Shipment ID Code.");
    if (!vehicleId) return alert("Please supply a Registration Vehicle ID.");
    
    const duplicate = shipments.find(s => s.id === idInput);
    if (duplicate) return alert("Shipment ID already allocated. Use custom id.");

    // Subscription fleet limits verification
    if (currentUser) {
      const activeSubscription = currentUser.subscription || "Enterprise SSO Suite";
      const tierDetails = SUBSCRIPTION_TIERS[activeSubscription];
      
      const uniqueVehicles = new Set(shipments.map(s => s.vehicleId.trim().toUpperCase()));
      const normalizedVehicleId = vehicleId.trim().toUpperCase();
      const isNewVehicle = !uniqueVehicles.has(normalizedVehicleId);
      
      if (isNewVehicle) {
        if (activeSubscription === "Silver Plan" && uniqueVehicles.size >= tierDetails.maxVehicles) {
          alert(`Vehicle limit exceeded!\n\nYour current Silver Plan is capped at 5 unique vehicles. Please navigate to the Billing & Subscription section to upgrade and add more drivers.`);
          return;
        } else if (activeSubscription === "Gold Plan" && uniqueVehicles.size >= tierDetails.maxVehicles) {
          alert(`Vehicle limit exceeded!\n\nYour current Gold Plan is capped at 25 unique vehicles. Please navigate to the Billing & Subscription section to upgrade to Corporate/Enterprise suite.`);
          return;
        } else if (activeSubscription === "Enterprise SSO Suite" && uniqueVehicles.size >= tierDetails.maxVehicles) {
          const proceed = confirm(`Enterprise SSO Plan Overage Notice:\n\nYou have registered ${uniqueVehicles.size} vehicles, which reaches or exceeds the base plan allowance of 100 active vehicles.\n\nAdding this new vehicle ("${vehicleId}") will trigger an overage fee of R 100 per 25 extra vehicles (or part thereof) on your monthly PayFast invoice.\n\nDo you want to authorize this vehicle allocation?`);
          if (!proceed) return;
        }
      }
    }

    const originCoords = DEPOTS[originSelect as keyof typeof DEPOTS] || { lat: 37.7749, lng: -122.4194 };
    const destCoords = DEPOTS[destSelect as keyof typeof DEPOTS] || { lat: 37.8044, lng: -122.2712 };
    
    // Auto calculate SVG coordinates distance estimation
    const totalDistMeters = haversineMeters(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
    const durationSeconds = (totalDistMeters / 15); // Avg truck 54 km/h == 15 m/s

    await addShipment({
      id: idInput,
      origin: originSelect,
      destination: destSelect,
      carrier: carrierInput,
      status: "QUEUED",
      vehicleId,
      driverName: driverName || "Unassigned operator",
      lastLocation: { lat: originCoords.lat, lng: originCoords.lng },
      items: selectedItems.length > 0 ? selectedItems : [{ sku: "M-SAMPLE", name: "Sample Item Cargo", quantity: 20 }],
      routeStats: {
        distanceMeters: totalDistMeters,
        durationSeconds,
        distanceText: `${(totalDistMeters / 1000).toFixed(1)} km`,
        durationText: `${(durationSeconds / 60).toFixed(0)} mins`,
      },
    });

    // Reset Form
    setIdInput("");
    setDriverName("");
    setVehicleId("");
    setSelectedItems([]);
    addNotification("Shipment Generated", `Tracking leg created for ID ${idInput}`, "shipment");
  };

  const handleAddItemToShipment = () => {
    if (!itemSkuInput) return;
    const item = { sku: itemSkuInput, name: `Cargo: ${itemSkuInput}`, quantity: itemQtyInput };
    setSelectedItems([...selectedItems, item]);
    setItemSkuInput("");
    setItemQtyInput(5);
  };

  // Driver GPS Updates Throttled simulation sequence
  const startDrivingSimulator = () => {
    if (!selectedShipment) return alert("Load a shipment path to commence tracking first.");
    if (isDriveTracking) return;

    // Reset driver positioning to the shipment origin point
    const originDepot = selectedShipment.origin;
    const originCoords = DEPOTS[originDepot as keyof typeof DEPOTS] || { lat: 37.7749, lng: -122.4194 };
    const destDepot = selectedShipment.destination;
    const destCoords = DEPOTS[destDepot as keyof typeof DEPOTS] || { lat: 37.8044, lng: -122.2712 };

    setGpsLatitude(originCoords.lat);
    setGpsLongitude(originCoords.lng);
    setLastSentLatLng(null);
    setLastSentTime(0);
    setIsDriveTracking(true);
    setThrottleDebug("Simulator Active. Approaching delivery lanes...");
    
    let stepCount = 0;
    const maxSteps = 40;

    drivingTimerRef.current = setInterval(async () => {
      stepCount++;
      const ratio = stepCount / maxSteps;
      
      // Calculate fraction position along path (linear interpolation)
      const currentLat = originCoords.lat + (destCoords.lat - originCoords.lat) * ratio;
      const currentLng = originCoords.lng + (destCoords.lng - originCoords.lng) * ratio;
      
      setGpsLatitude(currentLat);
      setGpsLongitude(currentLng);

      const now = Date.now();
      let shouldSendUpdate = false;
      let movedDistance = 0;
      let timeDifference = 0;

      if (!lastSentLatLng) {
        shouldSendUpdate = true;
      } else {
        movedDistance = haversineMeters(lastSentLatLng.lat, lastSentLatLng.lng, currentLat, currentLng);
        timeDifference = now - lastSentTime;

        // Throttling Trigger: must move >= 100 meters OR elapse 5 minutes (in our simulator, we scale down 5 mins to 12 seconds for review)
        const moveEnough = movedDistance >= 100; // 100 meters
        const timeEnough = timeDifference >= 12000; // Simulated 5 mins as 12 seconds
        shouldSendUpdate = moveEnough || timeEnough;
      }

      if (shouldSendUpdate) {
        // Compute speed velocity based on last checkpoint
        if (lastSentLatLng && lastSentTime > 0) {
          const secs = (now - lastSentTime) / 1000;
          const speedMps = movedDistance / secs;
          const speedKmh = speedMps * 3.6;
          setVelocity(`${speedMps.toFixed(1)} m/s (${speedKmh.toFixed(0)} km/h)`);
        } else {
          setVelocity("12.5 m/s (45 km/h)");
        }

        setThrottleDebug(`Sent! Moved ${movedDistance.toFixed(0)}m, elapsed ${(timeDifference/1000).toFixed(0)}s`);
        
        // Auto update shipment coordinates live in context & Firestore
        const nextStatus = stepCount === maxSteps ? "DELIVERED" : "IN_TRANSIT";
        const noteMsg = stepCount === maxSteps 
          ? "Delivered successfully at destination bay." 
          : `Driver transit update at GPS (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`;

        await addShipmentTimelineEvent(selectedShipment.id, nextStatus, noteMsg, currentLat, currentLng);
        
        setLastSentLatLng({ lat: currentLat, lng: currentLng });
        setLastSentTime(now);
      } else {
        setThrottleDebug(`Idle: Locked. Moved ${movedDistance.toFixed(0)}m < 100m, time ${(timeDifference/1000).toFixed(0)}s < 12s.`);
      }

      // Update remaining route calculations
      const remainingDist = haversineMeters(currentLat, currentLng, destCoords.lat, destCoords.lng);
      setRouteStatsText(
        `Destination is ${(remainingDist / 1000).toFixed(2)} km away. ETD: ${Math.round(remainingDist / 15 / 60)} mins.`
      );

      // Finish trip conditions
      if (ratio >= 1) {
        clearInterval(drivingTimerRef.current);
        setIsDriveTracking(false);
        setRouteStatsText("Leg accomplished. Cargo unloaded successfully.");
        setThrottleDebug("Completed.");
      }
    }, 1500); // Step tick interval
  };

  const stopDrivingSimulator = () => {
    if (drivingTimerRef.current) clearInterval(drivingTimerRef.current);
    setIsDriveTracking(false);
    setThrottleDebug("Device tracking stopped.");
  };

  const loadHistoryLogs = () => {
    const target = shipments.find(s => s.id === historyShipmentId);
    if (target) {
      setStaticViewShipment(target);
    } else {
      setStaticViewShipment(null);
      alert("Shipment code not recognized in system.");
    }
  };

  const activeOriginDetail = selectedShipment ? DEPOTS[selectedShipment.origin as keyof typeof DEPOTS] : null;
  const activeDestDetail = selectedShipment ? DEPOTS[selectedShipment.destination as keyof typeof DEPOTS] : null;
  const driverNormalized = selectedShipment ? normalizeCoordsToSvg(gpsLatitude, gpsLongitude) : null;

  return (
    <div className="space-y-6">
      
      {/* Upper Module: Drivers GPS Route tracking panel */}
      <div id="route_gps_tracking" className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-[#243052] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Compass className="text-[#2f6fed] w-5 h-5 animate-spin" />
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Driver Transit Telemetry & Live Vector Map
            </h2>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded">
              GPS SATELLITE SYNC
            </span>
          </div>
        </div>

        {/* Dropdown selectors to select existing Shipments to inspect */}
        <div className="bg-[#0b1220]/60 border border-[#243052] rounded-xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 font-bold uppercase">SELECT CARGO LEG FROM CLOUD:</span>
            <select
              value={selectedShipment ? selectedShipment.id : ""}
              onChange={(e) => {
                const found = shipments.find(s => s.id === e.target.value);
                if (found) setSelectedShipment(found);
              }}
              className="bg-[#111a2e] border border-[#243052] rounded-lg text-white text-xs py-1.5 px-3 focus:outline-none focus:border-[#2f6fed]"
            >
              {shipments.length === 0 ? (
                <option value="">No Active Shipments Available</option>
              ) : (
                shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    ID: {s.id} ({s.origin} → {s.destination})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            STATUS: <span className="text-blue-400 font-bold">{selectedShipment?.status || "PENDING"}</span>
          </div>
        </div>

        {/* Inner block layout tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Block (7 columns): Elegant Vector map */}
          <div className="lg:col-span-7 bg-[#0b1220] rounded-xl border border-[#243052] p-4 flex flex-col items-center justify-center relative min-h-[340px]">
            <h3 className="absolute top-3 left-3 text-[10px] text-gray-400 font-mono tracking-widest flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Live San Francisco Logistics Lane Vector Map
            </h3>

            {selectedShipment ? (
              <svg className="w-full max-w-[480px] h-[280px]" viewBox="0 0 500 300">
                {/* Background Grid Accent Lines */}
                <g stroke="#16203a" strokeWidth="0.5">
                  <line x1="100" y1="0" x2="100" y2="300" />
                  <line x1="200" y1="0" x2="200" y2="300" />
                  <line x1="300" y1="0" x2="300" y2="300" />
                  <line x1="400" y1="0" x2="400" y2="300" />
                  <line x1="0" y1="75" x2="500" y2="75" />
                  <line x1="0" y1="150" x2="500" y2="150" />
                  <line x1="0" y1="225" x2="500" y2="225" />
                </g>

                {/* Draw Route Paths between depots */}
                {activeOriginDetail && activeDestDetail && (
                  <g>
                    {/* Background route line */}
                    <path
                      d={`M ${normalizeCoordsToSvg(activeOriginDetail.lat, activeOriginDetail.lng).x} ${normalizeCoordsToSvg(activeOriginDetail.lat, activeOriginDetail.lng).y} L ${normalizeCoordsToSvg(activeDestDetail.lat, activeDestDetail.lng).x} ${normalizeCoordsToSvg(activeDestDetail.lat, activeDestDetail.lng).y}`}
                      stroke="#243052"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Pulsing route glow progress */}
                    <path
                      d={`M ${normalizeCoordsToSvg(activeOriginDetail.lat, activeOriginDetail.lng).x} ${normalizeCoordsToSvg(activeOriginDetail.lat, activeOriginDetail.lng).y} L ${normalizeCoordsToSvg(activeDestDetail.lat, activeDestDetail.lng).x} ${normalizeCoordsToSvg(activeDestDetail.lat, activeDestDetail.lng).y}`}
                      stroke="#2f6fed"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="8 4"
                      className="animate-[dash_20s_linear_infinite]"
                    />
                  </g>
                )}

                {/* Draw Depots location markers */}
                {Object.entries(DEPOTS).map(([name, coords]) => {
                  const pt = normalizeCoordsToSvg(coords.lat, coords.lng);
                  const isAssignedDepot = selectedShipment.origin === name || selectedShipment.destination === name;
                  return (
                    <g key={name}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isAssignedDepot ? 6 : 4}
                        fill={selectedShipment.origin === name ? "#10b981" : selectedShipment.destination === name ? "#ef4444" : "#243052"}
                        className={isAssignedDepot ? "animate-pulse" : ""}
                      />
                      <text
                        x={pt.x + 8}
                        y={pt.y + 3}
                        fill="#64748b"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="semibold"
                      >
                        {coords.label.split("-")[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Live Position Vehicle Marker Icon */}
                {isDriveTracking && driverNormalized && (
                  <g>
                    {/* Ring glow */}
                    <circle
                      cx={driverNormalized.x}
                      cy={driverNormalized.y}
                      r="12"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      className="animate-ping"
                    />
                    {/* Vehicle Dot */}
                    <polygon
                      points={`${driverNormalized.x},${driverNormalized.y - 6} ${driverNormalized.x - 5},${driverNormalized.y + 5} ${driverNormalized.x + 5},${driverNormalized.y + 5}`}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>
            ) : (
              <div className="text-gray-500 font-mono text-xs flex flex-col items-center gap-2">
                <MapPinOff className="w-8 h-8 text-gray-600 mb-1" />
                <span>No active shipment loaded to preview pathways.</span>
              </div>
            )}
          </div>

          {/* Right Block (5 columns): Driver Control Controls & Velocity readings */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="bg-[#0b1220]/40 rounded-xl p-4 border border-[#243052] space-y-4">
              <h4 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider flex items-center gap-1">
                <Truck className="w-4 h-4 text-[#2f6fed]" />
                TELEMETRY DRIVER DISPATCH
              </h4>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between border-b border-[#1f2b45] pb-1.5">
                  <span className="text-gray-500">ASSIGNED DRIVER:</span>
                  <span className="text-gray-100 font-bold">{selectedShipment?.driverName || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-[#1f2b45] pb-1.5">
                  <span className="text-gray-500">TRUCK REG ID:</span>
                  <span className="text-gray-100 font-bold">{selectedShipment?.vehicleId || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-[#1f2b45] pb-1.5">
                  <span className="text-gray-500">GPS COORDINATES:</span>
                  <span className="text-blue-400 font-bold">
                    {isDriveTracking ? `${gpsLatitude.toFixed(5)}, ${gpsLongitude.toFixed(5)}` : "Not Driving"}
                  </span>
                </div>
              </div>

              {/* Start/Stop simulation drives */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={startDrivingSimulator}
                  disabled={isDriveTracking || !selectedShipment || currentUser?.role !== "DRIVER" && currentUser?.role !== "ADMIN"}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    isDriveTracking || !selectedShipment
                      ? "bg-[#1f2b45] text-gray-500 text-slate-400 select-none cursor-not-allowed"
                      : "bg-[#2f6fed] hover:bg-[#1f56cc] text-white"
                  }`}
                  title="Needs Driver or Admin permission role"
                >
                  <Play className="w-3.5 h-3.5" /> Start Telemetry
                </button>
                <button
                  onClick={stopDrivingSimulator}
                  disabled={!isDriveTracking}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    !isDriveTracking
                      ? "bg-[#1f2b45] text-gray-500 text-slate-400 select-none cursor-not-allowed border border-transparent"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Stop
                </button>
              </div>
            </div>

            {/* Throttled status monitoring box */}
            <div className="bg-[#0b1220]/60 rounded-xl p-4 border border-[#243052] space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                HYPER-THROTTLE TRANSMITTING GATEWAY
              </span>
              
              <div className="space-y-1.5">
                <p className="text-gray-400">
                  Buffer Threshold: <span className="text-white font-semibold">≥100m movement OR ≥5-min duration</span>
                </p>
                <div className="p-2 bg-slate-900/60 border border-[#243052] rounded text-emerald-400 flex flex-col gap-1">
                  <span>Velocity Speed: <span className="text-white font-bold">{velocity}</span></span>
                  <span>Transmitter Status: <span className="text-yellow-400 tracking-normal">{throttleDebug}</span></span>
                </div>
                <div className="pt-1 text-gray-400 text-[10px] leading-relaxed">
                  Remaining Path: <span className="text-slate-200">{routeStatsText}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Grid: Create Shipment leg (Admins) VS Historical completed search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box Left: Create Shipment leg form */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#243052] pb-3">
            <Plus className="text-[#2f6fed] w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Admins: Schedule New Shipping Leg</h3>
          </div>
          
          <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">SHIPMENT ID (UNIQUE):</label>
                <input
                  type="text"
                  placeholder="e.g. S-3904-LEG4"
                  required
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none focus:border-[#2f6fed] font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">VEHICLE REGISTRY TAG:</label>
                <input
                  type="text"
                  placeholder="e.g. TRK-CA-945"
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none focus:border-[#2f6fed] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">ORIGIN DEPARTURE WAREHOUSE:</label>
                <select
                  value={originSelect}
                  onChange={(e) => setOriginSelect(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none font-mono"
                >
                  {Object.keys(DEPOTS).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">DESTINATION DELIVERY PORT:</label>
                <select
                  value={destSelect}
                  onChange={(e) => setDestSelect(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none font-mono"
                >
                  {Object.keys(DEPOTS).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">DRIVER DESIGNEE:</label>
                <input
                  type="text"
                  placeholder="Johnathan Appleseed"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none focus:border-[#2f6fed] font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">CARRIER ORGANIZATION:</label>
                <input
                  type="text"
                  placeholder="LogiTrack Express"
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2 text-white focus:outline-none focus:border-[#2f6fed] font-mono"
                />
              </div>
            </div>

            {/* Sub-item loaders for shipments cargo configuration */}
            <div className="p-3 bg-[#0b1220]/60 border border-[#243052] rounded-xl space-y-2">
              <span className="block text-[10px] font-mono text-gray-400 uppercase font-bold">CARGO LOADS MANIFEST ({selectedItems.length}):</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SKU-BOX-A"
                  value={itemSkuInput}
                  onChange={(e) => setItemSkuInput(e.target.value)}
                  className="flex-1 bg-[#111a2e] border border-[#243052] rounded px-2 py-1 text-white text-xs font-mono"
                />
                <input
                  type="number"
                  value={itemQtyInput}
                  onChange={(e) => setItemQtyInput(parseInt(e.target.value) || 0)}
                  className="w-16 bg-[#111a2e] border border-[#243052] rounded px-2 py-1 text-white text-xs font-mono text-center"
                />
                <button
                  type="button"
                  onClick={handleAddItemToShipment}
                  className="px-3 bg-[#243052] hover:bg-[#2a3a63] border border-[#2a3a63] text-[#2f6fed] font-bold rounded text-xs cursor-pointer"
                >
                  Add SKU
                </button>
              </div>

              {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#243052]/40">
                  {selectedItems.map((cargo, idx) => (
                    <span key={idx} className="bg-[#111a2e] border border-[#243052] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300">
                      {cargo.sku} × {cargo.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={currentUser?.role !== "ADMIN"}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
                currentUser?.role === "ADMIN"
                  ? "bg-[#2f6fed] hover:bg-[#1f56cc] text-white"
                  : "bg-[#1f2b45] text-slate-500 cursor-not-allowed border border-[#243052]"
              }`}
            >
              Confirm and Schedule Shipment Leg
            </button>
          </form>
        </div>

        {/* Box Right: Static Maps History search */}
        <div className="bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#243052] pb-3">
            <History className="text-[#2f6fed] w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Historical Deliveries (Cheap Static Blueprints)</h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            Audit historical logs using offline-friendly low-overhead Static Vector traces, preserving bandwidth in restricted lanes:
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Lookup Shipment Leg Code... (e.g. S-3904)"
                value={historyShipmentId}
                onChange={(e) => setHistoryShipmentId(e.target.value)}
                className="flex-1 bg-[#0b1220] border border-[#243052] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2f6fed]"
              />
              <button
                onClick={loadHistoryLogs}
                className="bg-[#243052] hover:bg-[#2f3f6c] border border-[#2a3a63] text-white text-xs px-4 rounded-lg font-mono cursor-pointer"
              >
                Inspect
              </button>
            </div>

            {staticViewShipment ? (
              <div className="bg-[#0b1220]/60 rounded-xl p-4 border border-[#243052] space-y-3 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold bg-green-950/40 border border-green-500/20 px-2.5 py-0.5 rounded">
                  HISTORICAL BLUEPRINT FOUND
                </span>
                <div className="space-y-1.5 text-gray-300">
                  <p>Route: <span className="text-white">{staticViewShipment.origin} → {staticViewShipment.destination}</span></p>
                  <p>Driver designee: <span className="text-white">{staticViewShipment.driverName}</span></p>
                  <p>Estimated path length: <span className="text-white">{staticViewShipment.routeStats?.distanceText || "N/A"}</span></p>
                  <p>Active Cargo: <span className="text-slate-400">{staticViewShipment.items.map(i => `${i.sku} (${i.quantity})`).join(", ")}</span></p>
                </div>

                {/* SVG Visual schematic of old route trace */}
                <div className="pt-2 border-t border-[#1f2b45] flex items-center gap-2 text-[10px] text-gray-500">
                  <span>HISTORICAL AUDITS PRESERVED IN CLOUD ARCHIVES</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#243052] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-gray-600 mb-1" />
                <span className="text-xs text-gray-500 font-mono">
                  Enter an existing shipment ID and press inspect to draw historical routes.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
