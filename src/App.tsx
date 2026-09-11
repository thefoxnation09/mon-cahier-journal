import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GitHubSetup } from './components/GitHubSetup';
import { Layout } from './components/Layout';
import { useAppStore } from './store/useAppStore';
import { githubSync } from './services/githubSyncService';
import { toDateKey } from './lib/dates';
import { JournalJourPage } from './pages/JournalJourPage';
import { JournalSemainePage } from './pages/JournalSemainePage';
import { FichesListPage } from './pages/FichesListPage';
import { FichePrepPage } from './pages/FichePrepPage';
import { RituelsPage } from './pages/RituelsPage';
import { ProjectionPage } from './pages/ProjectionPage';
import { ImpressionsPage } from './pages/ImpressionsPage';
import { ReglagesPage } from './pages/ReglagesPage';

function App() {
  const [connected, setConnected] = useState(githubSync.isConfigured());
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const refreshGitHubStatus = useAppStore((s) => s.refreshGitHubStatus);

  useEffect(() => {
    void init();
  }, [init]);

  if (!connected) {
    return (
      <GitHubSetup
        onConnected={() => {
          refreshGitHubStatus();
          setConnected(true);
        }}
      />
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  const today = toDateKey(new Date());

  return (
    <HashRouter>
      <Routes>
        <Route path="/rituels/projection" element={<ProjectionPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to={`/journal/jour/${today}`} replace />} />
          <Route path="/journal/jour/:date" element={<JournalJourPage />} />
          <Route path="/journal/semaine/:date" element={<JournalSemainePage />} />
          <Route path="/fiches" element={<FichesListPage />} />
          <Route path="/fiches/:id" element={<FichePrepPage />} />
          <Route path="/rituels" element={<RituelsPage />} />
          <Route path="/impressions/:date" element={<ImpressionsPage />} />
          <Route path="/reglages" element={<ReglagesPage />} />
          <Route path="*" element={<Navigate to={`/journal/jour/${today}`} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
