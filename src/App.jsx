import { useState, useMemo, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import AdminPanel from "./pages/AdminPanel";
import PublicDashboard from "./pages/PublicDashboard";
import { DUMP_POINTS as MOCK_POINTS, RAW_REPORTS as MOCK_REPORTS, TEAMS as INITIAL_TEAMS } from "./data/mockData";
import { db } from "./services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const TODAY = new Date("2026-07-06T00:00:00+05:30");

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
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

  // Feedback & Resolve State
  const [feedbacks, setFeedbacks] = useState([]);
  // resolving: Set of pointIds currently being processed (shows spinner)
  const [resolvingIds, setResolvingIds] = useState(new Set());

  // Subscribe to Firebase if configured
  useEffect(() => {
    if (!db) return; // Fallback to mock data if Firebase isn't set up

    console.log("Listening to Firestore...");
    
    const unsubPoints = onSnapshot(collection(db, "dumpPoints"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPoints([...MOCK_POINTS, ...data]);
    });

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports([...MOCK_REPORTS, ...data]);
    });

    const unsubFeedback = onSnapshot(collection(db, "feedback"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(data);
    });

    return () => {
      unsubPoints();
      unsubReports();
      unsubFeedback();
    };
  }, []);

  // ── Resolve Handler ────────────────────────────────────────────────────────
  const handleResolve = useCallback((pointId) => {
    const point = points.find(p => p.id === pointId);
    if (!point || point.status !== "active") return;

    // 1. Add to resolving set (disables button, shows spinner)
    setResolvingIds(prev => new Set([...prev, pointId]));

    // 2. Mark as resolved immediately
    const resolvedDate = new Date().toISOString().split('T')[0];
    setPoints(prev => prev.map(p =>
      p.id === pointId ? { ...p, status: "resolved", resolved_at: resolvedDate } : p
    ));

    // Find all phone numbers associated with this point
    const relatedReports = reports.filter(r => r.matched_point_id === pointId);
    const phoneNumbers = [...new Set(relatedReports.map(r => r.phone_number).filter(Boolean))];
    
    // Fallback for demo purposes if no real numbers exist (but try not to use the sandbox number as To)
    const targetNumbers = phoneNumbers.length > 0 ? phoneNumbers : [];

    // Trigger the real WhatsApp webhook if there are phone numbers
    if (targetNumbers.length > 0) {
      fetch("https://sendfeedbacksurvey-5hbpammmqa-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointId,
          reportId: point.report_id,
          pointName: point.name,
          phoneNumbers: targetNumbers
        })
      }).catch(err => console.error("Webhook trigger failed:", err));
    }

    // 3. Remove from resolving set after 1 second (gives UI time to show spinner)
    setTimeout(() => {
      setResolvingIds(prev => {
        const next = new Set(prev);
        next.delete(pointId);
        return next;
      });
    }, 1000);
  }, [points]);

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


  const hostname = window.location.hostname;
  const isPublicDomain = hostname.includes('swachhos-public');
  const isAdminDomain = hostname.includes('swachhos-admin');

  const publicElement = (
    <PublicDashboard 
      points={filteredPoints} 
      reports={filteredReports} 
      stats={dynamicStats}
      timeFilter={timeFilter}
      setTimeFilter={setTimeFilter}
      severityFilter={severityFilter}
      setSeverityFilter={setSeverityFilter}
    />
  );

  const adminElement = (
    <AdminPanel 
      dynamicStats={dynamicStats}
      timeFilter={timeFilter}
      setTimeFilter={setTimeFilter}
      severityFilter={severityFilter}
      setSeverityFilter={setSeverityFilter}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      filteredPoints={filteredPoints}
      filteredReports={filteredReports}
      teamAssignments={teamAssignments}
      setTeamAssignments={setTeamAssignments}
      teams={teams}
      setTeams={setTeams}
      onResolve={handleResolve}
      resolvingIds={resolvingIds}
      feedbacks={feedbacks}
    />
  );

  if (isPublicDomain) {
    return (
      <Router>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Routes>
          <Route path="/*" element={publicElement} />
        </Routes>
      </Router>
    );
  }

  if (isAdminDomain) {
    return (
      <Router>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Routes>
          <Route path="/*" element={adminElement} />
        </Routes>
      </Router>
    );
  }

  // Default behavior for localhost or unspecified domains
  return (
    <Router>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Routes>
        <Route path="/" element={publicElement} />
        <Route path="/admin" element={adminElement} />
      </Routes>
    </Router>
  );
}
