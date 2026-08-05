import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, apiClient, type User } from '../api/client';

type AdminRouteProps = {
  children: ReactNode;
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (): Promise<void> => {
      try {
        const response = await apiClient.me();
        if (isMounted) {
          setUser(response.user);
        }
      } catch (caughtError) {
        if (isMounted) {
          if (caughtError instanceof ApiError && caughtError.status === 401) {
            setRedirectTo('/login');
          } else {
            setError(
              caughtError instanceof Error ? caughtError.message : 'Could not verify admin access'
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (isLoading) {
    return (
      <main className="page">
        <section className="panel">
          <p className="muted">Checking admin access...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <section className="panel">
          <p className="error">{error}</p>
        </section>
      </main>
    );
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
