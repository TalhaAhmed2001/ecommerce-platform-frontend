import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, type User } from '../api/client';
import { Navigation } from '../components/Navigation';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async (): Promise<void> => {
      try {
        const response = await apiClient.me();
        if (isMounted) {
          setUser(response.user);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load current user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await apiClient.logout();
      navigate('/login');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page">
        <section className="panel">Loading...</section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel">
        <Navigation user={user} />
        <div className="header-row">
          <h1>Dashboard</h1>
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {user ? (
          <dl className="details">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user.status}</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </main>
  );
};
