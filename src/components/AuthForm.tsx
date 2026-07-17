import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

type AuthFormProps = {
  title: string;
  submitLabel: string;
  alternateLabel: string;
  alternateTo: string;
  alternateLinkLabel: string;
  error: string | null;
  isLoading: boolean;
  onSubmit: (email: string, password: string) => void;
};

export const AuthForm = ({
  title,
  submitLabel,
  alternateLabel,
  alternateTo,
  alternateLinkLabel,
  error,
  isLoading,
  onSubmit
}: AuthFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(String(formData.get('email')), String(formData.get('password')));
  };

  return (
    <main className="auth-page">
      <form className="panel" onSubmit={handleSubmit}>
        <h1>{title}</h1>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" minLength={8} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : submitLabel}
        </button>
        <p className="muted">
          {alternateLabel} <Link to={alternateTo}>{alternateLinkLabel}</Link>
        </p>
      </form>
    </main>
  );
};
