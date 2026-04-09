import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { initSocket, closeSocket } from './services/socket';
import Header from './components/Header';
import SetupPanel from './components/SetupPanel';
import KpiCards from './components/KpiCards';
import RollProgress from './components/RollProgress';
import RollHistory from './components/RollHistory';
import DowntimePanel from './components/DowntimePanel';
import ProductionFloorOverview from './components/ProductionFloorOverview';
import QualityControl from './components/QualityControl';
import TelegramNotifications from './components/TelegramNotifications';
import MachineGrid from './components/MachineGrid';
import RollPanel from './components/RollPanel';
import DowntimeForm from './components/DowntimeForm';
import QualityForm from './components/QualityForm';
import EventLog from './components/EventLog';
import './App.css';

export default function App() {
  useEffect(() => {
    initSocket();
    return () => closeSocket();
  }, []);

  return (
    <div className="app-container">
      <Header />
      <SetupPanel />
      
      <main className="main-content">
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

        <div className="content-grid">
          <section className="machines-section">
            <h2>Machines Status</h2>
            <MachineGrid />
          </section>

          <aside className="sidebar">
            <section className="actions-section">
              <RollPanel />
              <DowntimeForm />
              <QualityForm />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
