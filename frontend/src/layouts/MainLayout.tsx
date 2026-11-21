import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { AssistantWidget } from '../components/AssistantWidget';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTableLabels } from '../hooks/useTableLabels';

const ROUTE_SKELETON_MS = 280;

export const MainLayout: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeTransition, setRouteTransition] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useTableLabels();

  useEffect(() => {
    setMobileOpen(false);
    setRouteTransition(true);
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    const timer = window.setTimeout(() => setRouteTransition(false), ROUTE_SKELETON_MS);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobile={isMobile}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className="app-right">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="app-main" ref={mainRef}>
          <Suspense fallback={<PageSkeleton />}>
            <div className={`animate-fade-in route-view`} key={location.pathname}>
              <Outlet />
            </div>
          </Suspense>
          {routeTransition && (
            <>
              <div className="route-skeleton-overlay" aria-hidden="true">
                <PageSkeleton />
              </div>
              <span className="sr-only" role="status">Cargando módulo…</span>
            </>
          )}
        </main>
      </div>

      <AssistantWidget suppressed={mobileOpen} />
    </div>
  );
};
