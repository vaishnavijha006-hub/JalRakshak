import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SafeRoutePage } from './pages/SafeRoutePage';
import { RoadIntelligencePage } from './pages/RoadIntelligencePage';
import { ReportPage } from './pages/ReportPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { VoiceAssistant } from './components/voice/VoiceAssistant';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/safe-route" element={<SafeRoutePage />} />
          <Route path="/road-intelligence" element={<RoadIntelligencePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>
      </Routes>
      <VoiceAssistant />
    </AuthProvider>
  );
}
