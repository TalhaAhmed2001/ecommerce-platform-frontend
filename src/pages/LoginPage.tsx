import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { AuthForm } from '../components/AuthForm';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.login(email, password);
      navigate('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      alternateLabel="Need an account?"
      alternateTo="/register"
      alternateLinkLabel="Register"
      error={error}
      isLoading={isLoading}
      onSubmit={(email, password) => {
        void handleLogin(email, password);
      }}
    />
  );
};
