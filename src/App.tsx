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
  }, []);

  return (
    <>
      <div className="flex min-h-full">
        <SideNav />
        <main className="flex-1 pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
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
        <BottomNav />
      </div>
      <UpdateBanner />
    </>
  );
}
