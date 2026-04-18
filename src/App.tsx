import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FamiliesList from './pages/family/FamiliesList';
import FamilyDetails from './pages/family/FamilyDetails';
import FamilyForm from './pages/family/FamilyForm';
import ProjectsList from './pages/project/ProjectsList';
import ProjectDetails from './pages/project/ProjectDetails';
import ProjectForm from './pages/project/ProjectForm';
import Settings from './pages/Settings';
import Allocations from './pages/Allocations';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="families" element={<FamiliesList />} />
              <Route path="families/new" element={<FamilyForm />} />
              <Route path="families/:id/edit" element={<FamilyForm />} />
              <Route path="families/:id" element={<FamilyDetails />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id/edit" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="allocations" element={<Allocations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
