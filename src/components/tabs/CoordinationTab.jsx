import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { cellToBoundary, latLngToCell } from "h3-js";
import { Plus, Users, Trash2, X, Settings2 } from "lucide-react";

// H3 Resolution (8 = approx 0.7km radius)
const H3_RESOLUTION = 8;

export default function CoordinationTab({ dumpPoints, teamAssignments, setTeamAssignments, teams, setTeams }) {
  const [selectedHex, setSelectedHex] = useState(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const deleteTeam = (teamId) => {
    // 1. Remove from teams list
    setTeams(prev => prev.filter(t => t.id !== teamId));
    // 2. Unassign any hexes currently assigned to this team
    setTeamAssignments(prev => {
      const next = { ...prev };
      for (const hex in next) {
        if (next[hex] === teamId) next[hex] = "unassigned";
      }
      return next;
    });
    // 3. Deselect hex if it was assigned to this team? No, just let it show unassigned.
  };

  const updateTeamName = (teamId, newName) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: newName } : t));
  };

  // Group dump points by H3 Hex Index
  const hexData = useMemo(() => {
    const data = {};
    for (const pt of dumpPoints) {
      if (pt.status !== "active") continue;
      const h3Index = latLngToCell(pt.lat, pt.lng, H3_RESOLUTION);
      if (!data[h3Index]) {
        data[h3Index] = {
          points: [],
          polygon: cellToBoundary(h3Index).map(c => [c[0], c[1]]), // [lat, lng]
        };
      }
      data[h3Index].points.push(pt);
    }
    return data;
  }, [dumpPoints]);

  const hexList = Object.entries(hexData);

  // Determine center of map
  const bounds = useMemo(() => {
    if (dumpPoints.length === 0) return [[26.8467, 80.9462]];
    const b = latLngBounds(dumpPoints.map(p => [p.lat, p.lng]));
    return b.isValid() ? b : [[26.8467, 80.9462]];
  }, [dumpPoints]);

  const selectedHexInfo = selectedHex ? hexData[selectedHex] : null;
  const currentTeamId = selectedHex ? teamAssignments[selectedHex] || "unassigned" : null;

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* ── MAP AREA ── */}
      <div className="flex-1 relative z-0">
        <MapContainer
          bounds={bounds}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {hexList.map(([h3Index, { polygon, points }]) => {
            const teamId = teamAssignments[h3Index] || "unassigned";
            const team = teams.find(t => t.id === teamId) || teams.find(t => t.id === "unassigned");
            const isSelected = selectedHex === h3Index;

            return (
              <Polygon
                key={h3Index}
                positions={polygon}
                pathOptions={{
                  fillColor: team.color,
                  fillOpacity: isSelected ? 0.6 : 0.35,
                  color: isSelected ? "#000" : team.color,
                  weight: isSelected ? 3 : 1,
                }}
                eventHandlers={{
                  click: () => setSelectedHex(h3Index),
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* ── SIDEBAR PANEL ── */}
      <div className="w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col z-10">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Team Dispatcher</h2>
          <p className="text-xs text-gray-500 mt-1">Assign response units to active zones.</p>
        </div>

        {selectedHex ? (
          <div className="p-5 flex flex-col flex-1 overflow-y-auto">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Zone Selected</h3>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-2">Assigned Team</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={currentTeamId}
                onChange={(e) => {
                  setTeamAssignments(prev => ({
                    ...prev,
                    [selectedHex]: e.target.value
                  }));
                }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">Active Dump Sites</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {selectedHexInfo.points.length}
                </span>
              </div>
              <div className="space-y-2 mt-3">
                {selectedHexInfo.points.map(pt => (
                  <div key={pt.id} className="text-[11px] text-gray-600 truncate flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></div>
                    {pt.name}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center flex-1 text-center opacity-50">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">No Zone Selected</p>
            <p className="text-xs text-gray-400 mt-1">Click any colored hexagon on the map to assign a team.</p>
          </div>
        )}

        {/* ── MANAGE TEAMS BUTTON ── */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={() => setIsManagerOpen(true)}
            className="w-full bg-white border border-gray-300 hover:border-indigo-500 hover:text-indigo-600 text-gray-700 font-bold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Settings2 size={16} />
            <span>Manage Teams</span>
          </button>
        </div>
      </div>

      {/* ── MANAGE TEAMS MODAL ── */}
      {isManagerOpen && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-full">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                <h2 className="text-lg font-black text-gray-900">Manage Teams</h2>
              </div>
              <button 
                onClick={() => setIsManagerOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: List of Teams */}
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {teams.filter(t => t.id !== "unassigned").map(team => (
                <div key={team.id} className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: team.color + '20' }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }}></div>
                  </div>
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => updateTeamName(team.id, e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm font-bold text-gray-800 focus:outline-none focus:ring-0 px-1"
                  />
                  <button 
                    onClick={() => deleteTeam(team.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                    title="Delete Team"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Footer: Add New Team */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTeamName.trim()) return;
                  const colors = ["#8b5cf6", "#d946ef", "#f43f5e", "#0ea5e9", "#14b8a6", "#84cc16"];
                  const newTeam = {
                    id: "team_" + Date.now(),
                    name: newTeamName,
                    color: colors[(teams.length - 1) % colors.length]
                  };
                  const unassigned = teams.find(t => t.id === "unassigned");
                  const others = teams.filter(t => t.id !== "unassigned");
                  setTeams([...others, newTeam, unassigned]);
                  setNewTeamName("");
                }}
              >
                <input 
                  type="text" 
                  placeholder="Type new team name..." 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-lg text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newTeamName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors font-bold text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
