import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Loader from '../common/Loader';
import SignIn from '../pages/Authentication/SignIn';
import ProtectedRoute from '../Navigation/ProtectedRoutes';
import DefaultLayout from '../layout/DefaultLayout';
import { useAuth } from '../Context/Auth';

function Navigation() {
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const { isAuthenticated, role, getRoleBasedRoutes } = useAuth();

  const roleRoutes = getRoleBasedRoutes();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  const renderRoutes = (routes: any[]): any => {
    return routes.flatMap((route, index) => {
      const flat: any[] = [];

      if (route.path && route.component) {
        flat.push(
          <Route
            key={`${index}-${route.path}`}
            path={route.path}
            element={
              <ProtectedRoute
                allowedRoles={[role || '']}
                userRole={role || ''}
                element={<DefaultLayout>{route.component}</DefaultLayout>}
              />
            }
          />
        );
      }

      // 2. If it has children (no matter how deep), dig deeper
      if (route.children) {
        flat.push(...renderRoutes(route.children));
      }

      return flat;
    });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route path="/auth/signin" element={<SignIn />} />

      {isAuthenticated && renderRoutes(roleRoutes)}

      <Route path="*" element={<Navigate to="/auth/signin" replace />} />
    </Routes>
  );
}

export default Navigation;
