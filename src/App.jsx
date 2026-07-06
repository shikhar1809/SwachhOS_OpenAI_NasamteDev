import { useState, useMemo, useEffect } from "react";
import TopBar from "./components/TopBar";
import TabBar from "./components/TabBar";
import MapTab from "./components/tabs/MapTab";
import AnalysisTab from "./components/tabs/AnalysisTab";
import InsightsTab from "./components/tabs/InsightsTab";
import CoordinationTab from "./components/tabs/CoordinationTab";
import FeedbackTab from "./components/tabs/FeedbackTab";
import { DUMP_POINTS as MOCK_POINTS, RAW_REPORTS as MOCK_REPORTS, TEAMS as INITIAL_TEAMS } from "./data/mockData";
import { db } from "./services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const TODAY = new Date("2026-07-06T00:00:00+05:30");

export default function App() {
  const [activeTab, setActiveTab] = useState("rawfeed");
  
  // Real-time Data States
  const [points, setPoints] = useState(MOCK_POINTS);
  const [reports, setReports] = useState(MOCK_REPORTS);

  // Filter States
  const [timeFilter, setTimeFilter] = useState("all"); 
  const [severityFilter, setSeverityFilter] = useState("all");

  // Team Assignments State
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [teamAssignments, setTeamAssignments] = useState({});

  // Subscribe to Firebase if configured
  useEffect(() => {
    if (!db) return; // Fallback to mock data if Firebase isn't set up

    console.log("Listening to Firestore...");
    
    const unsubPoints = onSnapshot(collection(db, "dumpPoints"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if(data.length > 0) setPoints(data);
    });

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if(data.length > 0) setReports(data);
    });

    return () => {
      unsubPoints();
      unsubReports();
    };
  }, []);

  // 1. Filter the data
  const { filteredPoints, filteredReports } = useMemo(() => {
    let timeLimit = null;
    if (timeFilter === "30d") timeLimit = new Date(TODAY.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (timeFilter === "7d") timeLimit = new Date(TODAY.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fPoints = points.filter(p => {
      if (timeLimit && new Date(p.last_reported) < timeLimit) return false;
      if (severityFilter === "high" && p.report_count < 7) return false;
      if (severityFilter === "med" && (p.report_count < 3 || p.report_count >= 7)) return false;
      if (severityFilter === "low" && p.report_count >= 3) return false;
      return true;
    });

    const fReports = reports.filter(r => {
      if (timeLimit && new Date(r.timestamp) < timeLimit) return false;
      if (severityFilter !== "all") {
        if (!r.matched_point_id) return false;
        const linkedPoint = points.find(dp => dp.id === r.matched_point_id);
        if (!linkedPoint) return false;
        
        if (severityFilter === "high" && linkedPoint.report_count < 7) return false;
        if (severityFilter === "med" && (linkedPoint.report_count < 3 || linkedPoint.report_count >= 7)) return false;
        if (severityFilter === "low" && linkedPoint.report_count >= 3) return false;
      }
      return true;
    });

    return { filteredPoints: fPoints, filteredReports: fReports };
  }, [points, reports, timeFilter, severityFilter]);

  // 2. Compute dynamic stats
  const dynamicStats = useMemo(() => {
    const activePoints = filteredPoints.filter(d => d.status === "active").length;
    const newToday = filteredPoints.filter(d => d.last_reported === "2026-07-06").length;
    
    const weekAgo = new Date("2026-06-30T00:00:00+05:30");
    const reportsThisWeek = filteredReports.filter(r => new Date(r.timestamp) >= weekAgo).length;
    
    let avgDaysActive = 0;
    if (filteredPoints.length > 0) {
      avgDaysActive = Math.round(
        filteredPoints.reduce((sum, d) => {
          return sum + ((new Date(d.last_reported) - new Date(d.first_reported)) / (1000 * 60 * 60 * 24));
        }, 0) / filteredPoints.length
      );
    }

    return { activePoints, newToday, reportsThisWeek, avgDaysActive };
  }, [filteredPoints, filteredReports]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f6f8]">
      <TopBar 
        activePoints={dynamicStats.activePoints} 
        newToday={dynamicStats.newToday}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex flex-1 overflow-hidden">
        {activeTab === "rawfeed" && (
          <MapTab dumpPoints={filteredPoints} />
        )}
        {activeTab === "analysis" && (
          <AnalysisTab dumpPoints={filteredPoints} reports={filteredReports} />
        )}
        {activeTab === "coordination" && (
          <CoordinationTab 
            dumpPoints={filteredPoints} 
            teamAssignments={teamAssignments} 
            setTeamAssignments={setTeamAssignments} 
            teams={teams}
            setTeams={setTeams}
          />
        )}
        {activeTab === "insights" && (
          <InsightsTab dumpPoints={filteredPoints} stats={dynamicStats} />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab />
        )}
      </main>
    </div>
  );
}
