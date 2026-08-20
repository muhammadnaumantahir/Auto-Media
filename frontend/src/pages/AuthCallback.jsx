import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login?error=missing_token');
      return;
    }
    localStorage.setItem('auto_media_token', token);

    api
      .get('/auth/me')
      .then(({ data }) => {
        login(token, data.user);
        navigate(data.user.videoSheetUrl ? '/dashboard' : '/connect-sheet');
      })
      .catch(() => navigate('/login?error=google_auth_failed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-shell">
      <p>Signing you in…</p>
    </div>
  );
}
