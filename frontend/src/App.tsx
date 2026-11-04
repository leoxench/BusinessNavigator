import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth';
import Layout from './components/Layout';
import CatalogPage from './pages/CatalogPage';
import FopPage from './pages/FopPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/fop" element={<FopPage />} />
        <Route path="/people/:id" element={<ProfilePage />} />
        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
