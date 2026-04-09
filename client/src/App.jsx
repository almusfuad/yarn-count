import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { initSocket, closeSocket } from './services/socket';
import { startDummyUpdates, stopDummyUpdates } from './services/dummyUpdater';
import Header from './components/Header';
import SetupPanel from './components/SetupPanel';
import KpiCards from './components/KpiCards';
import RollProgress from './components/RollProgress';
import RollHistory from './components/RollHistory';
import DowntimePanel from './components/DowntimePanel';
import ProductionFloorOverview from './components/ProductionFloorOverview';
import QualityControl from './components/QualityControl';
import TelegramNotifications from './components/TelegramNotifications';
import EventLog from './components/EventLog';
import './App.css';

export default function App() {
  const isDummyMode = useStore((state) => state.isDummyMode);
  const loadDummyData = useStore((state) => state.loadDummyData);
  const clearLiveData = useStore((state) => state.clearLiveData);

  // Mode-switching effect
  useEffect(() => {
    if (isDummyMode) {
      closeSocket();
      loadDummyData();
      startDummyUpdates();
    } else {
      stopDummyUpdates();
      clearLiveData();
      initSocket();
    }
  }, [isDummyMode, loadDummyData, clearLiveData]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      closeSocket();
      stopDummyUpdates();
    };
  }, []);

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <SetupPanel />
        <section className="dashboard-section">
          <KpiCards />
          <RollProgress />
          <RollHistory />
          <DowntimePanel />
          <ProductionFloorOverview />
          <QualityControl />
          <div className="bottom-row">
            <TelegramNotifications />
            <EventLog />
          </div>
      </section>
      </main>
    </div>
  );
}
