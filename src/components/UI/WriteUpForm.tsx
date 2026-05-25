import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { X, Printer, Save, Trash2, Eye, Glasses } from "lucide-react";
import { LabJob } from "../../types";
import { CharacterSprite } from "../CharacterSprite";

interface WriteUpFormProps {
  patientName: string;
  patientSpriteBase?: string;
  insurance?: string;
  prescription?: { sphere: number; cylinder: number; axis: number };
  onClose: () => void;
  onComplete: (total: number, labJob: LabJob) => void;
}

// ── Lens Styles ──────────────────────────────────────────────────
const LENS_STYLES = [
  { id: "sv", label: "SV" },
  { id: "st28", label: "ST-28" },
  { id: "st35", label: "ST-35" },
  { id: "7x28", label: "7X28" },
  { id: "7x35", label: "7X35" },
  { id: "rd", label: "RD" },
  { id: "prog", label: "PROG" },
];

const MATERIALS = [
  { id: "plastic_poly", label: "PLASTIC POLY", price: 30 },
  { id: "hi_index_glass", label: "HI-INDEX GLASS", price: 50 },
  { id: "hard_cote", label: "HARD COTE", price: 15 },
  { id: "ar_1yr", label: "A/R 1YR", price: 25 },
  { id: "ar_2yr", label: "A/R 2YR", price: 45 },
  { id: "uv", label: "U/V", price: 10 },
  { id: "blue_light", label: "BLUE LIGHT", price: 35 },
];

export default function WriteUpForm({
  patientName,
  patientSpriteBase = "james",
  insurance,
  prescription,
  onClose,
  onComplete,
}: WriteUpFormProps) {
  // Demographics
  const [opticianInitials, setOpticianInitials] = useState("JB");
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [name, setName] = useState(patientName);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");

  // Frame & Dispensing
  const [frameName, setFrameName] = useState("");
  const [pd, setPd] = useState("");
  const [segHeight, setSegHeight] = useState("");
  const [color, setColor] = useState("");
  const [timePromised, setTimePromised] = useState("");

  // Rx Matrix
  const [rx, setRx] = useState({
    r: { sph: "", cyl: "", axis: "", add: "", prism: "" },
    l: { sph: "", cyl: "", axis: "", add: "", prism: "" },
  });

  // Lens Styles
  const [selectedLensStyles, setSelectedLensStyles] = useState<string[]>([]);

  // Materials
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Financial
  const [discount, setDiscount] = useState("0");

  const SUB_TOTAL = selectedMaterials.reduce((sum, matId) => {
    const mat = MATERIALS.find((m) => m.id === matId);
    return sum + (mat?.price || 0);
  }, 0);

  const DISC = parseFloat(discount) || 0;
  const TAX_RATE = 0.06;
  const TAX = (SUB_TOTAL - DISC) * TAX_RATE;
  const TOTAL = SUB_TOTAL - DISC + TAX;
  const [deposit, setDeposit] = useState("0");
  const DEP = parseFloat(deposit) || 0;
  const BAL = TOTAL - DEP;

  const toggleLensStyle = (id: string) => {
    setSelectedLensStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleSaveAndPrint = () => {
    const labJob: LabJob = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: Math.random().toString(36).substr(2, 9),
      patientName: name,
      frameName: frameName || "Unspecified",
      lensType: selectedLensStyles.join(", ") || "SV",
      materialType: selectedMaterials.map((m) => MATERIALS.find((mat) => mat.id === m)?.label).filter(Boolean).join(", "),
      createdAt: Date.now(),
    };
    onComplete(TOTAL, labJob);
  };

  const handleClear = () => {
    setOpticianInitials("");
    setDate("");
    setName("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
    setPhone("");
    setFrameName("");
    setPd("");
    setSegHeight("");
    setColor("");
    setTimePromised("");
    setRx({ r: { sph: "", cyl: "", axis: "", add: "", prism: "" }, l: { sph: "", cyl: "", axis: "", add: "", prism: "" } });
    setSelectedLensStyles([]);
    setSelectedMaterials([]);
    setDiscount("0");
    setDeposit("0");
  };

  const rxValue = (side: "r" | "l", field: string) =>
    (rx[side] as any)[field] || "";

  const setRxValue = (side: "r" | "l", field: string, value: string) => {
    setRx((prev) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-120 bg-slate-900/95 flex overflow-hidden"
    >
      {/* Left side - Patient info */}
      <div className="w-80 bg-slate-800 border-r-4 border-slate-700 flex flex-col items-center justify-center p-6">
        <CharacterSprite spriteBase={patientSpriteBase} direction="south" size="xxl" scale={1.5} />
        <h2 className="text-xl font-black text-white mt-6 uppercase">{patientName}</h2>
        <p className="text-blue-400 font-bold text-xs tracking-widest mt-2">{insurance || "CASH PAY"}</p>
        {prescription && (
          <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-700 w-full">
            <div className="text-[8px] text-slate-500 font-black uppercase mb-2">Last Rx</div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-white/80">
              <div>SPH: {prescription.sphere}</div>
              <div>CYL: {prescription.cylinder}</div>
              <div>AXIS: {prescription.axis}</div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                <Glasses className="inline mr-2 mb-1" size={28} />
                Optical Invoice
              </h1>
              <p className="text-slate-500 text-xs font-bold tracking-widest mt-1">WRITE-UP FORM</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-red-400 transition-colors">
              <X size={32} />
            </button>
          </div>

          <div className="space-y-6">
            {/* ── 1. Patient Demographics ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Patient Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Optician Initials</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={opticianInitials} onChange={(e) => setOpticianInitials(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Date</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Patient Name</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Street</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">City</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">State</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Zip</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Phone</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </section>

            {/* ── 2. Frame & Dispensing ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Frame & Dispensing Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Frame Name</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={frameName} onChange={(e) => setFrameName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">P.D.</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={pd} onChange={(e) => setPd(e.target.value)} placeholder="mm" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Seg Height</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={segHeight} onChange={(e) => setSegHeight(e.target.value)} placeholder="mm" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Color</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Time Promised</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-xs font-mono focus:border-yellow-500 outline-none" value={timePromised} onChange={(e) => setTimePromised(e.target.value)} />
                </div>
              </div>
            </section>

            {/* ── 3. Rx Matrix Grid ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Prescription Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="p-2 text-left">Eye</th>
                      <th className="p-2">SPH</th>
                      <th className="p-2">CYL</th>
                      <th className="p-2">AXIS</th>
                      <th className="p-2">ADD</th>
                      <th className="p-2">PRISM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["r", "l"] as const).map((side) => (
                      <tr key={side} className="border-t border-slate-700">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-yellow-500" />
                            <span className="font-black text-white uppercase">{side === "r" ? "R" : "L"}</span>
                          </div>
                        </td>
                        {["sph", "cyl", "axis", "add", "prism"].map((field) => (
                          <td key={field} className="p-2">
                            <input
                              className="w-16 bg-slate-950 border border-slate-600 text-white p-1.5 rounded text-center font-mono text-xs focus:border-yellow-500 outline-none"
                              value={rxValue(side, field)}
                              onChange={(e) => setRxValue(side, field, e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 4. Lens Styles ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Lens Styles
              </h3>
              <div className="flex flex-wrap gap-2">
                {LENS_STYLES.map((ls) => (
                  <button
                    key={ls.id}
                    onClick={() => toggleLensStyle(ls.id)}
                    className={`px-4 py-2 rounded-lg border-2 font-black text-xs uppercase transition-all ${
                      selectedLensStyles.includes(ls.id)
                        ? "bg-yellow-500 border-yellow-500 text-slate-950"
                        : "bg-slate-950 border-slate-600 text-slate-400 hover:border-yellow-500/50"
                    }`}
                  >
                    {ls.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── 5. Materials & Treatments ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Materials & Treatments
              </h3>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => toggleMaterial(mat.id)}
                    className={`px-4 py-2 rounded-lg border-2 font-black text-xs uppercase transition-all ${
                      selectedMaterials.includes(mat.id)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-600 text-slate-400 hover:border-blue-500/50"
                    }`}
                  >
                    {mat.label}
                    <span className="ml-1 text-[9px] opacity-60">${mat.price}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* ── 6. Financial Ledger ── */}
            <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                Financial Ledger
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-green-400 font-bold uppercase block mb-1">SUB TOTAL</label>
                  <div className="w-full bg-slate-950 border border-slate-600 text-green-400 p-2 rounded text-sm font-mono font-black">
                    ${SUB_TOTAL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-red-400 font-bold uppercase block mb-1">DISC. ($)</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-red-400 p-2 rounded text-sm font-mono focus:border-yellow-500 outline-none" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">TAX (6%)</label>
                  <div className="w-full bg-slate-950 border border-slate-600 text-slate-400 p-2 rounded text-sm font-mono font-black">
                    ${TAX.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-yellow-400 font-bold uppercase block mb-1">TOTAL</label>
                  <div className="w-full bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-2 rounded text-sm font-mono font-black text-lg">
                    ${TOTAL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">DEP. ($)</label>
                  <input className="w-full bg-slate-950 border border-slate-600 text-white p-2 rounded text-sm font-mono focus:border-yellow-500 outline-none" type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-blue-400 font-bold uppercase block mb-1">BAL. DUE</label>
                  <div className={`w-full bg-slate-950 border p-2 rounded text-sm font-mono font-black ${BAL > 0 ? "border-blue-500 text-blue-400" : "border-green-500 text-green-400"}`}>
                    ${BAL.toFixed(2)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 mb-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAndPrint}
              className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 shadow-[4px_4px_0_0_rgba(234,179,8,0.3)] transition-all"
            >
              <Save className="w-5 h-5" />
              <Printer className="w-5 h-5" />
              Save & Print Ticket
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClear}
              className="flex-1 py-4 bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400 font-black text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all border border-slate-600"
            >
              <Trash2 className="w-5 h-5" />
              Clear Form
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}