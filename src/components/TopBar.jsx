import { Trash2, Filter, Calendar } from "lucide-react";

export default function TopBar({
  activePoints,
  newToday,
  timeFilter,
  setTimeFilter,
  severityFilter,
  setSeverityFilter
}) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
          <Trash2 size={16} color="white" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <span className="text-sm font-semibold text-gray-900 tracking-tight">SwachhOS</span>
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-0.5">
            Dump Point Tracker
          </span>
        </div>
      </div>

      {/* Filters (Center) */}
      <div className="flex items-center gap-4 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-100">
        
        {/* Time Filter */}
        <div className="flex items-center gap-1.5 border-r border-gray-200 pr-4">
          <Calendar size={13} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Time:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 pl-1">
          <Filter size={13} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
          >
            <option value="all">All Zones</option>
            <option value="high">Critical (7+)</option>
            <option value="med">Moderate (3-6)</option>
            <option value="low">Low (1-2)</option>
          </select>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-3 shrink-0">
        <StatPill label="Active Points" value={activePoints} color="indigo" />
        <StatPill label="New Today" value={newToday} color="emerald" />
      </div>
    </header>
  );
}

function StatPill({ label, value, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${colors[color]}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
