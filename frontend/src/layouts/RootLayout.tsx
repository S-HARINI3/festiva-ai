import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import DemoBanner from '../components/ui/DemoBanner';
import { useAuth } from '../contexts/AuthContext';

export default function RootLayout() {
  const { isDemoMode } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-250">
      {isDemoMode && !isDashboard && <DemoBanner />}
      {!isDashboard && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

