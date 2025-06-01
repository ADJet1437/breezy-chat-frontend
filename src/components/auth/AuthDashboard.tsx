
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Clock, Shield, RefreshCw, Book, LogOut, Edit, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import '../../styles/auth-styles.css';

const AuthDashboard = () => {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const handleEditProfile = () => {
    setEditName(user.name || '');
    setEditAvatar(user.avatar_url || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editName.trim() || undefined,
        avatar_url: editAvatar.trim() || undefined
      });
      setIsEditModalOpen(false);
      toast({
        description: "Profile updated successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        description: "Failed to update profile",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast({
      description: "Successfully signed out",
      duration: 3000,
    });
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          description: "Token refreshed successfully",
          duration: 3000,
        });
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      toast({
        description: "Failed to refresh token",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const viewApiDocs = () => {
    window.open('http://localhost:8000/docs', '_blank');
  };

  const currentTime = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {user.name || user.email.split('@')[0]}!</h1>
          <p className="welcome-subtitle">You're successfully authenticated with Google SSO</p>
        </div>
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="User Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              <User />
            </div>
          )}
        </div>
      </div>
      
      {/* User Info Card */}
      <div className="auth-info-card">
        <div className="auth-card-header">
          <h2><User /> Profile Information</h2>
          <button 
            className="auth-btn auth-btn-outline auth-btn-sm" 
            onClick={handleEditProfile}
            disabled={isLoading}
          >
            <Edit />
            Edit
          </button>
        </div>
        <div className="card-content">
          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <span>{user.email}</span>
            </div>
            <div className="info-item">
              <label>Name</label>
              <span>{user.name || 'Not set'}</span>
            </div>
            <div className="info-item">
              <label>User ID</label>
              <span className="user-id">{user.id}</span>
            </div>
            <div className="info-item">
              <label>Account Status</label>
              <span className="status-badge status-active">
                <CheckCircle size={16} /> Active
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Session Info Card */}
      <div className="auth-info-card">
        <div className="auth-card-header">
          <h2><Clock /> Session Information</h2>
        </div>
        <div className="card-content">
          <div className="session-info">
            <div className="session-item">
              <Calendar />
              <div>
                <label>Session Started</label>
                <span>{currentTime}</span>
              </div>
            </div>
            <div className="session-item">
              <Shield />
              <div>
                <label>Authentication Method</label>
                <span>Google OAuth 2.0</span>
              </div>
            </div>
            <div className="session-item">
              <RefreshCw />
              <div>
                <label>Token Status</label>
                <span className="token-status">
                  <CheckCircle size={16} style={{ color: 'var(--auth-success-color)' }} /> Valid
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="auth-actions-card">
        <div className="auth-card-header">
          <h2><RefreshCw /> Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="action-buttons">
            <button className="action-btn" onClick={refreshToken}>
              <RefreshCw />
              <span>Refresh Token</span>
            </button>
            <button className="action-btn" onClick={viewApiDocs}>
              <Book />
              <span>API Documentation</span>
            </button>
            <button className="action-btn danger" onClick={() => setIsLogoutModalOpen(true)}>
              <LogOut />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="auth-card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit /> Edit Profile
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="auth-btn auth-btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="auth-btn auth-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <LogOut /> Confirm Sign Out
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to sign out? You'll need to authenticate again to access your account.
              </p>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="auth-btn auth-btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="auth-btn auth-btn-danger"
              >
                <LogOut />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDashboard;
