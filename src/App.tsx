import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav, SideNav } from '@/components/BottomNav';
import { UpdateBanner } from '@/components/UpdateBanner';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlantDetailScreen } from '@/screens/PlantDetailScreen';
import { AddPlantScreen } from '@/screens/AddPlantScreen';
import { CatalogScreen } from '@/screens/CatalogScreen';
import { CatalogDetailScreen } from '@/screens/CatalogDetailScreen';
import { PruneNowScreen } from '@/screens/PruneNowScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export default function App() {
  useEffect(() => {
    const stored = localStorage.getItem('bladwijzer-theme');
    if (stored && stored !== 'system') {
      document.documentElement.setAttribute('data-theme', stored);
    }

    // ── Meet viewport hoogte (Vocado-patroon v1.54) ──
    // Hoogte = maximum van alle metingen. In de geïnstalleerde app onthouden
    // we bovendien de grootste hoogte die iOS ooit voor dit scherm meldde
    // (per oriëntatie): na een herlaad meldt iOS soms een te kleine viewport
    // (fantoom-werkbalk), maar nooit een te grote. screen.height is géén
    // goede ondergrens: de pagina begint onder de statusbalk, dus die waarde
    // duwt de menulabels van het scherm af.
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) document.documentElement.classList.add('standalone');

    function setH() {
      let h = Math.max(
        window.visualViewport?.height ?? 0,
        window.innerHeight || 0,
        document.documentElement.clientHeight || 0,
      );
      if (isStandalone) {
        const portrait = window.matchMedia('(orientation: portrait)').matches;
        const key = `bladwijzer_vh_${screen.width}x${screen.height}${portrait ? 'p' : 'l'}`;
        let stored = 0;
        try {
          stored = parseInt(localStorage.getItem(key) ?? '', 10) || 0;
        } catch {}
        const cap = Math.max(screen.width, screen.height);
        if (h > stored && h <= cap) {
          stored = h;
          try {
            localStorage.setItem(key, String(h));
          } catch {}
        }
        if (stored > h) h = stored;
      }
      if (h > 0) document.documentElement.style.setProperty('--app-height', `${h}px`);
    }
    const onVisible = () => {
      if (!document.hidden) setH();
    };
    const onOrientation = () => setTimeout(setH, 200);
    setH();
    requestAnimationFrame(setH);
    setTimeout(setH, 300);
    setTimeout(setH, 1000);
    setTimeout(setH, 2500);
    window.addEventListener('load', setH);
    window.addEventListener('pageshow', setH);
    window.addEventListener('resize', setH);
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('orientationchange', onOrientation);
    window.visualViewport?.addEventListener('resize', setH);

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
      window.removeEventListener('load', setH);
      window.removeEventListener('pageshow', setH);
      window.removeEventListener('resize', setH);
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('orientationchange', onOrientation);
      window.visualViewport?.removeEventListener('resize', setH);
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
                <Route path="/scan" element={<ScanScreen />} />
                <Route path="/catalog" element={<CatalogScreen />} />
                <Route path="/catalog/:id" element={<CatalogDetailScreen />} />
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
