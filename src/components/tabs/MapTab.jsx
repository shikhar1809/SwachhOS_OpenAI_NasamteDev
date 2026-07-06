import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MapPin, Calendar, BarChart2, Image as ImageIcon, Flame, Hexagon } from "lucide-react";
import HeatmapLayer from "../HeatmapLayer";
import HexGridLayer from "../HexGridLayer";
import ClusterLayer from "../ClusterLayer";

function pinColor(count) {
  if (count >= 7) return "#ef4444";
  if (count >= 3) return "#f97316";
  return "#22c55e";
}

function formatDate(str) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function FitBounds({ points }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && points.length) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [48, 48] });
      fitted.current = true;
    }
  }, [map, points]);
  return null;
}

export default function MapTab({ dumpPoints }) {
  const [selected, setSelected] = useState(null);
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState("pins"); // "pins" | "heatmap" | "hexgrid"

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Map ─────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#e2e8f0]">
        
        <MapContainer
          center={[26.8467, 80.9462]}
          zoom={12}
          className="w-full h-full"
          zoomControl={false}
          ref={setMap}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <FitBounds points={dumpPoints} />

          {viewMode === "pins" && <ClusterLayer dumpPoints={dumpPoints} onPointClick={setSelected} />}
          {viewMode === "heatmap" && <HeatmapLayer points={dumpPoints} />}
          {viewMode === "hexgrid" && <HexGridLayer dumpPoints={dumpPoints} />}
        </MapContainer>

        {/* Floating zoom controls */}
        <ZoomControls map={map} />

        {/* View Mode Toggle */}
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-100 p-1 flex items-center gap-1">
          <button
            onClick={() => { setViewMode("pins"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === "pins" ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <MapPin size={14} /> Pins
          </button>
          <button
            onClick={() => { setViewMode("heatmap"); setSelected(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === "heatmap" ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Flame size={14} /> Heatmap
          </button>
          <button
            onClick={() => { setViewMode("hexgrid"); setSelected(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === "hexgrid" ? "bg-violet-50 text-violet-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Hexagon size={14} /> Hex Grid
          </button>
        </div>

        {/* Legend */}
        {(viewMode === "pins" || viewMode === "hexgrid") && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-xs space-y-1.5">
            <p className="font-semibold text-gray-400 mb-2 uppercase tracking-widest text-[9px]">Severity</p>
            <LegendPin color="#ef4444" label="High (7+)" />
            <LegendPin color="#f97316" label="Medium (3–6)" />
            <LegendPin color="#22c55e" label="Low (1–2)" />
          </div>
        )}
      </div>

      {/* ── Side Panel ─────────────────────────────────── */}
      <aside className="w-[260px] shrink-0 bg-white border-l border-gray-100 overflow-y-auto flex flex-col shadow-inner">
        {selected ? (
          <DetailPanel point={selected} onClose={() => setSelected(null)} />
        ) : (
          <EmptyState />
        )}
      </aside>
    </div>
  );
}

function ZoomControls({ map }) {
  if (!map) return null;
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1 shadow-lg rounded-lg overflow-hidden border border-gray-100">
      <button onClick={() => map.zoomIn()} className="w-9 h-9 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl font-light border-b border-gray-100">+</button>
      <button onClick={() => map.zoomOut()} className="w-9 h-9 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl font-light">−</button>
    </div>
  );
}

function LegendPin({ color, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center justify-center w-4 h-4">
        <div className="absolute w-full h-full rounded-full opacity-30" style={{ backgroundColor: color }}></div>
        <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }}></div>
      </div>
      <span className="text-gray-600 text-xs">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
        <MapPin size={24} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">Click a pin on the map to view dump point details.</p>
    </div>
  );
}

function DetailPanel({ point, onClose }) {
  const color = pinColor(point.report_count);
  return (
    <div className="flex flex-col">
      <div className="relative">
        {point.photos?.[0] ? (
          <img src={point.photos[0]} alt={point.name} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 bg-gray-50 flex items-center justify-center"><ImageIcon size={32} className="text-gray-200" /></div>
        )}
        <button onClick={onClose} className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow text-lg leading-none">×</button>
        <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-2 py-0.5 rounded-md">{point.status}</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 leading-snug">{point.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}><BarChart2 size={18} style={{ color: color }} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{point.report_count}</p>
            <p className="text-xs text-gray-400">Total reports</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-2.5">
          <DateRow label="First reported" date={point.first_reported} />
          <DateRow label="Last reported" date={point.last_reported} />
        </div>
      </div>
    </div>
  );
}

function DateRow({ label, date }) {
  return (
    <div className="flex items-start gap-2">
      <Calendar size={13} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-medium text-gray-700">{formatDate(date)}</p>
      </div>
    </div>
  );
}
