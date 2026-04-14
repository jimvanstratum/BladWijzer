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

    // ── Vocado-patroon: meet viewport hoogte ──
    // visualViewport.height geeft op iOS PWA standalone de juiste
    // hoogte (tot y=793), terwijl CSS 100vh/100dvh soms afwijkt.
    // requestAnimationFrame + setTimeout(300) vangt iOS timing-quirks.
    function setH() {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${h}px`);
    }
    setH();
    requestAnimationFrame(setH);
    setTimeout(setH, 300);
    window.visualViewport?.addEventListener('resize', setH);
    window.addEventListener('resize', setH);

    // ── Meet safe-area-inset-bottom via DOM-element ──
    // env(safe-area-inset-bottom) werkt niet altijd direct in CSS
    // op iOS PWA standalone. We meten het via een verborgen element.
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);width:1px;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    const sab = parseInt(getComputedStyle(probe).height) || 0;
    document.body.removeChild(probe);
    document.documentElement.style.setProperty('--sab', `${sab}px`);

    return () => {
      window.visualViewport?.removeEventListener('resize', setH);
      window.removeEventListener('resize', setH);
    };
  }, []);

  return (
    <>
      {/* Vocado-patroon: position:fixed top/left/right (NIET bottom:0!)
          + height via JS-gemeten --app-height. Nav is flex-child. */}
      <div className="app-shell">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch]">
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
