import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignInPage } from './pages/auth/SignInPage';
import { HomePage } from './pages/home/HomePage';
import { FormsListPage } from './pages/forms/FormsListPage';
import { StarredPage } from './pages/forms/StarredPage';
import { SharedPage } from './pages/forms/SharedPage';
import { TemplatesPage } from './pages/forms/TemplatesPage';
import { TrashPage } from './pages/forms/TrashPage';
import { BuilderPage } from './pages/builder/BuilderPage';
import { LandingPage } from './pages/landing/LandingPage';
import { ResponsesPage } from './pages/responses/ResponsesPage';
import { ResponsesListPage } from './pages/responses/ResponsesListPage';
import { FormSettingsPage } from './pages/forms/FormSettingsPage';
import { FormSharePage } from './pages/forms/FormSharePage';
import { AppSettingsPage } from './pages/settings/AppSettingsPage';
import { AccountPage } from './pages/account/AccountPage';
import { PublicFormPage } from './pages/public/PublicFormPage';
import { SplashScreen } from './components/common/SplashScreen';
import { MexoSkeleton } from './components/common/MexoSkeleton';
import { formService } from './services/formService';

const RootIndex: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [splashProgress, setSplashProgress] = React.useState(25);
  const [splashFinished, setSplashFinished] = React.useState(false);

  React.useEffect(() => {
    const t1 = setTimeout(() => setSplashProgress(60), 200);
    const t2 = setTimeout(() => setSplashProgress(85), 450);
    const t3 = setTimeout(() => {
      setSplashProgress(100);
      setTimeout(() => setSplashFinished(true), 300);
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (isLoading || !splashFinished) {
    return <SplashScreen progress={splashProgress} isFadingOut={splashProgress === 100} />;
  }

  // Fresh load/root route redirect logic:
  // Logged-in user -> /home (account)
  // New user -> /welcome (landing)
  return <Navigate to={isAuthenticated ? '/home' : '/welcome'} replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen progress={90} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for Sign In page: if already authenticated, go to redirect target or /home
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen progress={90} />;
  }

  if (isAuthenticated) {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTarget = searchParams.get('redirect');
    const returnTo = sessionStorage.getItem('mexo_auth_return_to') || redirectTarget;
    sessionStorage.removeItem('mexo_auth_return_to');

    let safeTarget = '/home';
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes(':')) {
      safeTarget = returnTo;
    }

    return <Navigate to={safeTarget} replace />;
  }

  return <>{children}</>;
};

// Component to instantly create a new form and redirect to builder
const CreateFormRedirect: React.FC = () => {
  const { profile } = useAuth();
  const [created, setCreated] = React.useState(false);
  const [targetId, setTargetId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile || created) return;
    setCreated(true);
    formService.createForm(profile.id, 'Untitled Form').then(f => {
      if (f) setTargetId(f.id);
    });
  }, [profile, created]);

  if (targetId) {
    return <Navigate to={`/forms/${targetId}/edit`} replace />;
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <p className="text-xs font-semibold text-app-muted">Creating new form…</p>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/welcome" element={<LandingPage />} />

          {/* Public Form Respondent View */}
          <Route path="/f/:slug" element={<PublicFormPage />} />

          {/* Auth: Redirect to /home if already logged in */}
          <Route path="/signin" element={<AuthRoute><SignInPage /></AuthRoute>} />

          {/* Protected App Routes */}
          <Route path="/" element={<RootIndex />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/forms" element={<ProtectedRoute><FormsListPage /></ProtectedRoute>} />
          <Route path="/forms/new" element={<ProtectedRoute><CreateFormRedirect /></ProtectedRoute>} />
          <Route path="/forms/:id/edit" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
          <Route path="/forms/:id/responses" element={<ProtectedRoute><ResponsesPage /></ProtectedRoute>} />
          <Route path="/forms/:id/settings" element={<ProtectedRoute><FormSettingsPage /></ProtectedRoute>} />
          <Route path="/forms/:id/share" element={<ProtectedRoute><FormSharePage /></ProtectedRoute>} />
          <Route path="/responses" element={<ProtectedRoute><ResponsesListPage /></ProtectedRoute>} />
          <Route path="/starred" element={<ProtectedRoute><StarredPage /></ProtectedRoute>} />
          <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
          <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/settings/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<RootIndex />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
