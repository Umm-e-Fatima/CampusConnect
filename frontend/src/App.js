import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResourceRequests from './pages/ResourceRequests';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Home from './pages/Home';
import Resources from './pages/Resources';
import Books from './pages/Books';
import QnA from './pages/QnA';

// Components
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/verify-otp"      element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/home"              element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/resources"         element={<PrivateRoute><Resources /></PrivateRoute>} />
          <Route path="/books"             element={<PrivateRoute><Books /></PrivateRoute>} />
          <Route path="/qna"               element={<PrivateRoute><QnA /></PrivateRoute>} />
          <Route path="/resource-requests" element={<PrivateRoute><ResourceRequests /></PrivateRoute>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;