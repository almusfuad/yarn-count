import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { initSocket, closeSocket } from './services/socket';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import MachineGrid from './components/MachineGrid';
import AlertPanel from './components/AlertPanel';
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
      
      <main className="main-content">
        <section className="dashboard-section">
          <KpiCards />
        </section>

        <div className="content-grid">
          <section className="machines-section">
            <h2>Machines Status</h2>
            <MachineGrid />
          </section>

          <aside className="sidebar">
            <section className="alerts-section">
              <AlertPanel />
            </section>

            <section className="actions-section">
              <RollPanel />
              <DowntimeForm />
              <QualityForm />
            </section>
          </aside>
        </div>

        <section className="events-section">
          <EventLog />
        </section>
      </main>
    </div>
  );
}
