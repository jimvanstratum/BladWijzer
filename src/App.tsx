import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav, SideNav } from '@/components/BottomNav';
import { UpdateBanner } from '@/components/UpdateBanner';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlantDetailScreen } from '@/screens/PlantDetailScreen';
import { AddPlantScreen } from '@/screens/AddPlantScreen';
import { CatalogScreen } from '@/screens/CatalogScreen';
import { PruneNowScreen } from '@/screens/PruneNowScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export default function App() {
  useEffect(() => {
    const stored = localStorage.getItem('bladwijzer-theme');
    if (stored && stored !== 'system') {
      document.documentElement.setAttribute('data-theme', stored);
    }

    // Vocado-stijl: meet viewport hoogte zodat 100dvh klopt op iOS
    function setH() {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${h}px`);
    }
    setH();
    window.visualViewport?.addEventListener('resize', setH);
    window.addEventListener('resize', setH);
    return () => {
      window.visualViewport?.removeEventListener('resize', setH);
      window.removeEventListener('resize', setH);
    };
  }, []);

  return (
    <>
      {/* Vocado-patroon: vaste viewport-container, flex-column,
          nav is flex-child onderaan — geen position:fixed nodig */}
      <div className="fixed inset-0 flex h-[var(--app-height,100dvh)] flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex min-h-0 flex-1">
          <SideNav />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/plant/:id" element={<PlantDetailScreen />} />
                <Route path="/add" element={<AddPlantScreen />} />
                <Route path="/catalog" element={<CatalogScreen />} />
                <Route path="/prune" element={<PruneNowScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
      <UpdateBanner />
    </>
  );
}
