import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    
    const session = searchParams.get('session');
    if (session) {
      setProcessed(true);
      login(session);
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-semibold">Authenticating...</div>
        <div className="mt-2 text-sm text-muted-foreground">Please wait</div>
      </div>
    </div>
  );
}
