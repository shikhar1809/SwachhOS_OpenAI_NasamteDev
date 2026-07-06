import { useMemo } from "react";
import { MapPin, FileText, Clock, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Cell, RadialBarChart, RadialBar, Legend,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function severityColor(count) {
  if (count >= 7) return "#ef4444";
  if (count >= 3) return "#f97316";
  return "#22c55e";
}

function severityLabel(count) {
  if (count >= 7) return { text: "Critical", cls: "bg-red-50 text-red-600" };
  if (count >= 3) return { text: "Moderate", cls: "bg-orange-50 text-orange-600" };
  return { text: "Low", cls: "bg-green-50 text-green-600" };
}

// ─── Compact Stat Card ────────────────────────────────────────────────────────
function CompactStatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: color + "18" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <p className="text-[10px] font-semibold text-gray-500 leading-tight">{label}</p>
      </div>
      <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-2 py-1.5 z-50">
      <p className="text-[10px] font-bold text-gray-700 mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[10px]" style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InsightsTab({ dumpPoints, stats }) {
  const data = useMemo(() => {
    const sorted = [...dumpPoints].sort((a, b) => b.report_count - a.report_count);
    const top10 = sorted.slice(0, 10).map(p => ({
        name: p.name.split(" ").slice(0, 2).join(" "),
        report_count: p.report_count
    }));

    // AI Priority Ranking
    const aiRanked = [...dumpPoints].map(p => {
      const days = Math.round((new Date(p.last_reported) - new Date(p.first_reported)) / (1000 * 60 * 60 * 24));
      const score = (p.report_count * 10) + (days * 2); // Simulated AI weight
      
      let reason = "";
      if (p.report_count >= 15 && days > 30) reason = `Critical systemic failure. ${p.report_count} reports over ${days} days without resolution. High biohazard risk.`;
      else if (p.report_count >= 10) reason = `High volume of continuous dumping (${p.report_count} reports). Urgent route reassignment recommended.`;
      else if (days > 45) reason = `Chronic neglect. Unresolved for ${days} days despite moderate volume. Structural intervention needed.`;
      else reason = `Emerging hotspot. Rapidly accumulating ${p.report_count} reports. Preemptive cleaning required.`;

      return { ...p, days, aiScore: score, aiReason: reason };
    }).sort((a, b) => b.aiScore - a.aiScore).slice(0, 3);

    const daysActive = dumpPoints.map(p => ({
      name: p.name.split(" ").slice(0, 2).join(" "),
      days: Math.round((new Date(p.last_reported) - new Date(p.first_reported)) / (1000 * 60 * 60 * 24)),
    })).sort((a, b) => b.days - a.days).slice(0, 8);

    const high = dumpPoints.filter(p => p.report_count >= 7).length;
    const med = dumpPoints.filter(p => p.report_count >= 3 && p.report_count < 7).length;
    const low = dumpPoints.filter(p => p.report_count < 3).length;
    const totalReports = dumpPoints.reduce((s, p) => s + p.report_count, 0);

    const maxPossible = dumpPoints.length * 15;
    const healthScore = Math.max(0, Math.round(100 - (totalReports / (maxPossible || 1)) * 100));

    const radialData = [
      { name: "Health Score", value: healthScore, fill: healthScore > 60 ? "#22c55e" : healthScore > 35 ? "#f97316" : "#ef4444" },
    ];

    return { top10, aiRanked, daysActive, high, med, low, totalReports, healthScore, radialData };
  }, [dumpPoints]);

  return (
    // Fixed viewport, NO scroll
    <div className="flex flex-1 overflow-hidden bg-[#f5f6f8] p-3 gap-3">

      {/* ── Left Col: Health Score & Stats (w-64) ── */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        
        {/* Radial Health Score */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center shrink-0 h-[220px]">
          <p className="text-xs font-bold text-gray-800 self-start">City Cleanliness Score</p>
          <div className="flex-1 w-full min-h-0 -mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="55%" innerRadius="65%" outerRadius="95%" data={data.radialData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" background={{ fill: "#f3f4f6" }} cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-4xl font-black mt-[-30px]" style={{ color: data.healthScore > 60 ? "#22c55e" : data.healthScore > 35 ? "#f97316" : "#ef4444" }}>
            {data.healthScore}<span className="text-lg font-bold text-gray-300">/100</span>
          </p>
          <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
            {data.healthScore > 60 ? "Relatively Clean" : data.healthScore > 35 ? "Needs Attention" : "High Risk"}
          </p>
        </div>

        {/* 2x2 Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <CompactStatCard label="Active Sites" value={dumpPoints.length} color="#6366f1" icon={<MapPin size={12} />} />
          <CompactStatCard label="Critical Zones" value={data.high} color="#ef4444" icon={<AlertTriangle size={12} />} />
          <CompactStatCard label="Total Reports" value={data.totalReports} color="#f97316" icon={<FileText size={12} />} />
          <CompactStatCard label="Weekly Rep." value={stats.reportsThisWeek} color="#10b981" icon={<TrendingUp size={12} />} />
        </div>
      </div>

      {/* ── Middle Col: Bar Charts (flex-1) ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        
        {/* Severity Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
          <p className="text-xs font-bold text-gray-800 mb-1">Site Severity Distribution</p>
          <div className="flex-1 min-h-0 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "Count", High: data.high, Medium: data.med, Low: data.low }]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="High" name="High (7+)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Medium" name="Medium (3–6)" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Low" name="Low (1–2)" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Days Active */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
          <p className="text-xs font-bold text-gray-800 mb-1">Days Active (Top 8 Sites)</p>
          <div className="flex-1 min-h-0 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daysActive} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#9ca3af" }} interval={0} />
                <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="days" name="Days Active" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Right Col: Rankings & Lists (w-72) ── */}
      <div className="w-72 flex flex-col gap-3 shrink-0">
        
        {/* Top 10 Sites */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
          <p className="text-xs font-bold text-gray-800 mb-1">Top 10 Recurring Sites</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top10} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} width={80} interval={0} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="report_count" name="Reports" radius={[0, 4, 4, 0]} barSize={12}>
                  {data.top10.map((entry, i) => (
                    <Cell key={i} fill={severityColor(entry.report_count)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Priority Zones */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col shrink-0 h-[220px]">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={14} className="text-indigo-500 shrink-0" />
            <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-wide">AI Priority Zones</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {data.aiRanked.map((pt, i) => (
              <div key={pt.id} className="flex flex-col gap-1 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-gray-800 truncate">{i + 1}. {pt.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-red-50 text-red-600">
                    Score: {pt.aiScore}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-snug italic">
                  "{pt.aiReason}"
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
