import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Search, Plus, Filter, AlertTriangle, ChevronRight, Edit3, Save, Trash, Warehouse, ClipboardList } from "lucide-react";
import { ProductItem } from "../types";

export const InventoryManager: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryQty, currentUser, isOnline } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Add Item form states
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [warehouse, setWarehouse] = useState("Main Sector A");
  const [category, setCategory] = useState("Container Cargo");
  const [description, setDescription] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(0);

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku) return alert("Please supply a unique SKU identifier.");
    
    const duplicate = inventory.find((item) => item.sku.toLowerCase() === sku.toLowerCase());
    if (duplicate) return alert(`SKU [${sku}] already exists in stock lists.`);

    await addInventoryItem({
      id: sku,
      sku,
      barcode: barcode || `BC-${sku}-${Math.floor(Math.random() * 10000)}`,
      name,
      quantity,
      minStock,
      warehouse,
      category,
      description,
      lastUpdated: new Date().toISOString(),
    });

    // Reset Form
    setSku("");
    setBarcode("");
    setName("");
    setQuantity(0);
    setMinStock(10);
    setDescription("");
  };

  const handleStartEditing = (item: ProductItem) => {
    setEditingItemId(item.id);
    setEditingQty(item.quantity);
  };

  const handleSaveQty = async (itemId: string) => {
    await updateInventoryQty(itemId, editingQty);
    setEditingItemId(null);
  };

  // Compute unique filter lists from actual items
  const warehouses = ["ALL", "Main Sector A", "South Wing B", "Remote Bay 4", "Sacramento Landing"];
  const categories = ["ALL", "Container Cargo", "Pallet Load", "Tech Devices", "Heavy Machinery", "Hazardous Logistics"];

  // Filter logic
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesWarehouse = selectedWarehouseFilter === "ALL" || item.warehouse === selectedWarehouseFilter;
    const matchesCategory = selectedCategoryFilter === "ALL" || item.category === selectedCategoryFilter;

    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Strip */}
      <div id="inventory_controls_panel" className="bg-[#111a2e] border border-[#243052] rounded-2xl p-5 shadow-xl flex flex-wrap items-center gap-4 justify-between">
        
        {/* Search Input bar */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search SKU code, barcode, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b1220] border border-[#243052] rounded-xl pl-10 pr-4 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#2f6fed] text-xs"
          />
        </div>

        {/* Filters dropdown lists */}
        <div className="flex flex-wrap gap-2.5 items-center">
          
          <div className="flex items-center gap-1.5 bg-[#0b1220] border border-[#243052] rounded-xl px-2.5 py-1 text-xs text-gray-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Warehouse:</span>
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-[11px] font-bold cursor-pointer"
            >
              {warehouses.map((w) => (
                <option key={w} value={w} className="bg-[#111a2e]">{w}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b1220] border border-[#243052] rounded-xl px-2.5 py-1 text-xs text-gray-400 font-mono">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-[11px] font-bold cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#111a2e]">{c}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Grid: Stock table vs Cataloger form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Stock Grid Table list (Admins / Staff) */}
        <div className="xl:col-span-8 bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-[#243052] pb-4 mb-5">
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              <Warehouse className="text-[#2f6fed] w-4 h-4" />
              Warehouse Stock Manifest
              <span className="text-xs bg-[#243052] border border-[#2a3a63] text-gray-400 font-mono font-normal px-2 py-0.5 rounded-md">
                {filteredInventory.length} of {inventory.length} items
              </span>
            </h2>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="bg-[#0b1220]/60 border-b border-[#243052]">
                <tr>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider">SKU / BARCODE</th>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider">NAME</th>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider">SECTOR BAY</th>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider text-center">QUANTITY</th>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider text-center">ALERT</th>
                  <th className="p-3.5 font-semibold text-gray-400 uppercase tracking-wider text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243052]/40">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const isLow = item.quantity <= item.minStock;
                    const isOut = item.quantity === 0;
                    const isEditing = editingItemId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#0b1220]/20 transition-all ${
                          isOut ? "bg-red-950/5" : isLow ? "bg-amber-950/5" : ""
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{item.sku}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{item.barcode}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-white text-xs font-semibold">{item.name}</div>
                          <div className="text-[10px] text-gray-500">{item.category}</div>
                        </td>
                        <td className="p-3.5 text-gray-400">
                          <div>{item.warehouse}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingQty}
                              onChange={(e) => setEditingQty(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 bg-[#0b1220] border border-[#243052] rounded p-1 text-center text-white text-xs font-bold"
                            />
                          ) : (
                            <span className={`text-sm font-extrabold ${isOut ? "text-red-400" : isLow ? "text-yellow-400" : "text-white"}`}>
                              {item.quantity}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider bg-red-950/40 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                              OUT OF STOCK
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider bg-amber-950/40 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full animate-pulse">
                              LOW THRESHOLD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider bg-green-950/40 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              SAFE STOCK
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {currentUser?.role !== "DRIVER" && (
                            <div className="flex justify-end gap-2.5">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveQty(item.id)}
                                  className="p-1 px-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-[10px] flex items-center gap-1 transition"
                                >
                                  <Save className="w-3 h-3" /> Save
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEditing(item)}
                                  className="p-1 px-2 text-[#2f6fed] hover:bg-[#2f6fed]/10 border border-transparent hover:border-[#2f6fed]/20 rounded transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-slate-500 border-none font-mono">
                      <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                      No matching inventory items catalogued. Filter parameters did not yield coordinates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 text-[10px] text-gray-500 font-mono flex justify-between items-center border-t border-[#243052]/40 pt-4">
            <span>OFFLINE OPERATION BUFFERS COMPATIBLE</span>
            <span>RESTRICTION LEVELS: ACCESS LEVEL CLASSIFIED</span>
          </div>

        </div>

        {/* Right Side: Stock Cataloger form (Admins & Staff clear) */}
        <div className="xl:col-span-4 bg-[#111a2e] border border-[#243052] rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center gap-2 border-b border-[#243052] pb-3 mb-5">
            <Plus className="text-[#2f6fed] w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Catalogue Cargo Stock</h3>
          </div>

          <form onSubmit={handleAddNewItem} className="space-y-4 text-xs font-mono select-none">
            
            <div>
              <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">SKU CODE (UNIQUE ID):</label>
              <input
                type="text"
                placeholder="e.g. SKU-BOX-908"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.trim().toUpperCase())}
                className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2f6fed]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">BARCODE ENCODING CODE (OPTIONAL):</label>
              <input
                type="text"
                placeholder="e.g. 74591038"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.trim())}
                className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2f6fed]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">CARGO DESIGNATION TITLE:</label>
              <input
                type="text"
                placeholder="e.g. Lithium Polymer Battery Module"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2f6fed]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">INITIAL QTY:</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-[#2f6fed] text-center"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">MINStock GATE:</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-[#2f6fed] text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">SECTOR BAY:</label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="Main Sector A">Main Sector A</option>
                  <option value="South Wing B">South Wing B</option>
                  <option value="Remote Bay 4">Remote Bay 4</option>
                  <option value="Sacramento Landing">Sacramento Landing</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">CARGO CAT:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="Container Cargo">Container Cargo</option>
                  <option value="Pallet Load">Pallet Load</option>
                  <option value="Tech Devices">Tech Devices</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Hazardous Logistics">Hazardous Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold">NOTES DESCR:</label>
              <textarea
                placeholder="Details of tracking, dimensions, weight constraints..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b1220] border border-[#243052] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2f6fed]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={currentUser?.role === "DRIVER"}
              className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                currentUser?.role !== "DRIVER"
                  ? "bg-[#2f6fed] hover:bg-[#1f56cc] text-white"
                  : "bg-[#1f2b45] text-slate-500 cursor-not-allowed border border-[#243052]"
              }`}
            >
              Commit Item to Inventory
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
