import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const StartWorkout = lazy(() => import('./pages/StartWorkout.jsx'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary.jsx'));
const Recommendations = lazy(() => import('./pages/Recommendations.jsx'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory.jsx'));
const Progress = lazy(() => import('./pages/Progress.jsx'));
const Nutrition = lazy(() => import('./pages/Nutrition.jsx'));
const PersonalRecords = lazy(() => import('./pages/PersonalRecords.jsx'));
const Share = lazy(() => import('./pages/Share.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted" role="status">
      Loading…
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog text-muted" role="status">
        Loading…
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<StartWorkout />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/history" element={<WorkoutHistory />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/prs" element={<PersonalRecords />} />
          <Route path="/share" element={<Share />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
