import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { AuthForm } from '../components/AuthForm';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (email: string, password: string): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.register(email, password);
      navigate('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Create account"
      submitLabel="Register"
      alternateLabel="Already have an account?"
      alternateTo="/login"
      alternateLinkLabel="Log in"
      error={error}
      isLoading={isLoading}
      onSubmit={(email, password) => {
        void handleRegister(email, password);
      }}
    />
  );
};
