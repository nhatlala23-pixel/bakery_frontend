import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-secondary/50 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};
