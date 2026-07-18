import React from 'react';
import MapTab from '../components/tabs/MapTab';
import FloatingSearchChat from '../components/FloatingSearchChat';

export default function PublicDashboard({ 
  points, 
  reports, 
  // keeping these as props so App.jsx doesn't break, even if we don't use them directly in the UI here
  stats,
  timeFilter,
  setTimeFilter,
  severityFilter,
  setSeverityFilter
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-[#e2e8f0]">
      {/* Background Map layer */}
      <div className="absolute inset-0 z-0">
        <MapTab dumpPoints={points} reports={reports} isPublic={true} />
      </div>

      {/* Floating UI on top */}
      <FloatingSearchChat points={points} />
    </div>
  );
}
