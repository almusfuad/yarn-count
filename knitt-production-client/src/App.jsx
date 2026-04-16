import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { initSocket, closeSocket } from './services/socket';
import { startDummyUpdates, stopDummyUpdates } from './services/dummyUpdater';
import { showSuccessToast } from './utils/notificationUtils';
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

export default function App() {
  const isDummyMode = useStore((state) => state.isDummyMode);
  const loadDummyData = useStore((state) => state.loadDummyData);
  const clearLiveData = useStore((state) => state.clearLiveData);
  const socketStatus = useStore((state) => state.socket.status);

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

  // Socket status notification effect
  useEffect(() => {
    if (socketStatus === 'connected' && !isDummyMode) {
      showSuccessToast('Connected to server');
    }
  }, [socketStatus, isDummyMode]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-100 gap-2 sm:gap-4">
      <Header />
      
      <main className="flex-1 w-full px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
        <div className="max-w-full lg:max-w-7xl mx-auto w-full">
          <SetupPanel />
          <section className="mt-2 sm:mt-3 md:mt-4 mb-2 sm:mb-3 md:mb-4">
            <KpiCards />
            <RollProgress />
            <RollHistory />
            <DowntimePanel />
            <ProductionFloorOverview />
            <QualityControl />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <TelegramNotifications />
              <EventLog />
            </div>
        </section>
        </div>
      </main>
    </div>
  );
}
