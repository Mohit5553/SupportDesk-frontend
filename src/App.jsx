import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import NewTicket from './pages/NewTicket';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';
import KanbanBoard from './pages/KanbanBoard';
import KnowledgeBase from './pages/KnowledgeBase';
import ArticleDetail from './pages/ArticleDetail';
import ArticleForm from './pages/ArticleForm';
import Profile from './pages/Profile';
import AgentChat from './pages/AgentChat';
import AdminReports from './pages/AdminReports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Layout>{children}</Layout>;
};

const DashboardWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }
  return <Dashboard />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Verify Email */}
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardWrapper />
        </ProtectedRoute>
      } />

      <Route path="/tickets" element={
        <ProtectedRoute>
          <TicketList />
        </ProtectedRoute>
      } />

      <Route path="/kanban" element={
        <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
          <KanbanBoard />
        </ProtectedRoute>
      } />

      <Route path="/tickets/new" element={
        <ProtectedRoute allowedRoles={['customer', 'agent', 'admin', 'manager']}>
          <NewTicket />
        </ProtectedRoute>
      } />

      <Route path="/tickets/:id" element={
        <ProtectedRoute>
          <TicketDetail />
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
          <AgentChat />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <AdminReports />
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />

      <Route path="/admin/categories" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminCategories />
        </ProtectedRoute>
      } />

      <Route path="/knowledge-base" element={
        <ProtectedRoute>
          <KnowledgeBase />
        </ProtectedRoute>
      } />

      <Route path="/knowledge-base/new" element={
        <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
          <ArticleForm />
        </ProtectedRoute>
      } />

      <Route path="/knowledge-base/edit/:slug" element={
        <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
          <ArticleForm />
        </ProtectedRoute>
      } />

      <Route path="/knowledge-base/:slug" element={
        <ProtectedRoute>
          <ArticleDetail />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
