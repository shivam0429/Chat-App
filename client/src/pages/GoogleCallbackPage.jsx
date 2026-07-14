import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { fetchMe } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get('token');

    const completeLogin = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        // Temporarily use the token to fetch the profile before persisting it
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        const data = await fetchMe();
        loginWithToken(token, data.user);
        navigate('/');
      } catch {
        navigate('/login');
      }
    };

    completeLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xs">
        <Loader label="Signing you in with Google…" />
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
