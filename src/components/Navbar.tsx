import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Home, Map, TrendingUp, PieChart, User, LayoutDashboard, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/predictor', label: 'Predictor', icon: TrendingUp },
    { path: '/roi', label: 'ROI', icon: PieChart },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/account', label: 'Account', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Map className="h-6 w-6 text-primary" />
            EarthDecoder
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {user && navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
