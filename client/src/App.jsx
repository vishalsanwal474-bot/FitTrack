import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StartWorkout from './pages/StartWorkout.jsx';
import ExerciseLibrary from './pages/ExerciseLibrary.jsx';
import Recommendations from './pages/Recommendations.jsx';
import WorkoutHistory from './pages/WorkoutHistory.jsx';
import Progress from './pages/Progress.jsx';
import Nutrition from './pages/Nutrition.jsx';
import PersonalRecords from './pages/PersonalRecords.jsx';
import Share from './pages/Share.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';

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
