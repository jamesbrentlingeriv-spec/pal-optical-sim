import React from "react";

export default function PatientLookup() {
  return (
    <div
      className="w-full bg-[#EAEAEA] border border-gray-400 shadow-inner p-4 text-sm font-sans"
      style={{ fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" }}
    >
      <style>{`\n        .prior-highlight { border: 2px solid #dc2626 !important; box-shadow: 0 0 0 2px rgba(220,38,38,0.12); }\n        .win-input { background:#ffffff; border:1px solid #c0c0c0; padding:6px; border-radius:2px; }\n        .win-button { background:#e6e6e6; border:1px solid #9b9b9b; padding:6px 10px; font-weight:700; }\n        .win-button:disabled { opacity:0.5 }\n        .win-table th, .win-table td { padding:6px 8px; border-bottom:1px solid #d0d0d0; }\n      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border border-gray-400 flex items-center justify-center">
            🔍
          </div>
          <div className="text-base font-bold">Find Patient / Guarantor</div>
        </div>
        <button className="w-6 h-6 bg-red-600 text-white flex items-center justify-center font-bold">
          X
        </button>
      </div>

      {/* Selection Criteria */}
      <fieldset className="border border-gray-400 p-3 bg-[#F8F8F8]">
        <legend className="px-2">Selection Criteria</legend>
        <div className="grid grid-cols-12 gap-3 items-start">
          <div className="col-span-5">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="text-xs">Last Name</label>
              <input className="win-input" defaultValue="Smith" />
              <label className="text-xs">First Name</label>
              <input className="win-input" defaultValue="Polly" />
              <label className="text-xs">Nickname</label>
              <input className="win-input" />
              <label className="text-xs">E-Mail Address</label>
              <input className="win-input" />
              <label className="text-xs">Date Of Birth</label>
              <input className="win-input" />
              <label className="text-xs">Default Location</label>
              <select className="win-input">
                <option>-- Select --</option>
              </select>
            </div>
          </div>

          <div className="col-span-5">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="text-xs">Address</label>
              <input className="win-input bg-gray-100" disabled value={""} />
              <label className="text-xs">City</label>
              <input className="win-input" />
              <label className="text-xs">Phone Number</label>
              <input className="win-input" />
              <label className="text-xs">Patient No.</label>
              <input className="win-input" />
              <label className="text-xs">Chart No.</label>
              <input className="win-input" />
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Include Inactive
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Include Other
              </label>
              <label className="flex items-center gap-2 prior-highlight">
                <input type="checkbox" defaultChecked /> Prior Name
              </label>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-2">
            <button className="win-button bg-blue-600 text-white">
              F2 Find
            </button>
            <button className="win-button">Clear</button>
            <button className="win-button">New</button>
            <button className="win-button" disabled>
              Select
            </button>
            <button className="win-button">Cancel</button>
          </div>
        </div>
      </fieldset>

      {/* System Warning */}
      <div className="text-center text-blue-600 italic mt-3 mb-3 text-xs">
        "This database is encrypted, some selection criteria will not be
        available."
      </div>

      {/* Results Grid */}
      <div className="border border-gray-300 bg-white overflow-hidden">
        <div className="overflow-y-auto h-40">
          <table className="w-full win-table table-fixed text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Address / City</th>
                <th className="text-left">Home Phone</th>
                <th className="text-left">SS No</th>
                <th className="text-left">DOB</th>
                <th className="text-center">Patient</th>
                <th className="text-center">HIPAA</th>
                <th className="text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((i) => (
                <tr
                  key={i}
                  className={i % 2 === 1 ? "bg-[#E8F8F0]" : "bg-white"}
                >
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td className="text-center">
                    <input type="checkbox" disabled />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" disabled />
                  </td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-2 flex items-center justify-between">
        <div className="bg-white border border-gray-300 px-2 py-1 text-xs font-bold">
          Patients Found: <span className="ml-2">0</span>
        </div>
        <div className="text-xs text-gray-600">&nbsp;</div>
      </div>
    </div>
  );
}
