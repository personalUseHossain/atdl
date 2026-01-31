// app/dashboard/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Key,
  Save,
  Camera,
  Briefcase,
  Activity,
  Settings,
  Shield,
  Database,
  Bell,
  Globe,
  UserCircle,
  Edit2,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    workspaceName: '',
    workspaceDescription: '',
    defaultMaxPapers: 30,
    defaultSearchQuery: "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)"
  });
  const [isSocialLoginUser, setIsSocialLoginUser] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user/profile?id=${session.user.id}`);
          const data = await response.json();

          if (data.success) {
            setUserData(data.user);
            setFormData({
              name: data.user.name || '',
              email: data.user.email || '',
              workspaceName: data.user.workspace?.name || '',
              workspaceDescription: data.user.workspace?.description || '',
              defaultMaxPapers: data.user.preferences?.defaultMaxPapers || 30,
              defaultSearchQuery: data.user.preferences?.defaultSearchQuery || "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)"
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session]);


  useEffect(() => {
    if (userData) {
      const isSocialUser = userData.isSocialLoginUser
      setIsSocialLoginUser(isSocialUser);
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setUserData(data.user);

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session.user,
          name: formData.name
        }
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

const handlePasswordChange = async (e) => {
  e.preventDefault();
  
  // Get form elements safely
  const form = e.target;
  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;
  
  // Get currentPassword only if the field exists
  let currentPassword = '';
  if (form.currentPassword) {
    currentPassword = form.currentPassword.value;
  }

  if (newPassword !== confirmPassword) {
    setError('New passwords do not match');
    return;
  }

  setSaving(true);
  setError('');

  try {
    // Determine if this is a social login user setting password
    const isSettingPasswordForSocialUser = isSocialLoginUser && !currentPassword;

    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: isSettingPasswordForSocialUser ? '' : currentPassword,
        newPassword,
        isSocialLoginUser: isSettingPasswordForSocialUser
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }

    setSuccess(data.message);
    form.reset();

    // Update user data
    if (data.user) {
      setUserData(data.user);
    }

    // Update session if needed
    if (data.user?.name) {
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.user.name
        }
      });
    }

    // If social login user set password, update state
    if (isSocialLoginUser) {
      setIsSocialLoginUser(false);

      // Refresh user data to get updated auth status
      const userResponse = await fetch(`/api/user/profile?id=${session.user.id}`);
      const userData = await userResponse.json();
      if (userData.success) {
        setUserData(userData.user);
      }
    }

    setTimeout(() => setSuccess(''), 3000);

  } catch (error) {
    setError(error.message || 'Failed to change password');
  } finally {
    setSaving(false);
  }
};

  if (status === 'loading' || loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="mt-2 text-gray-600">
                  Manage your account settings and preferences
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${session.user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {session.user.role === 'admin' ? 'Administrator' : 'Researcher'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Alerts */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {success}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information Card */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <UserCircle className="h-6 w-6 text-gray-500 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  <Edit2 className="h-5 w-5 text-gray-400" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          Full Name
                        </div>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          Email Address
                        </div>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        disabled
                        title="Email cannot be changed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          Workspace Name
                        </div>
                      </label>
                      <input
                        type="text"
                        name="workspaceName"
                        value={formData.workspaceName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="Your research workspace"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-2 text-gray-400" />
                          Default Max Papers
                        </div>
                      </label>
                      <input
                        type="number"
                        name="defaultMaxPapers"
                        value={formData.defaultMaxPapers}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                        Workspace Description
                      </div>
                    </label>
                    <textarea
                      name="workspaceDescription"
                      value={formData.workspaceDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="Describe your research focus..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-400" />
                        Default Search Query
                      </div>
                    </label>
                    <textarea
                      name="defaultSearchQuery"
                      value={formData.defaultSearchQuery}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      PubMed search query used by default
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors ${saving ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                      {saving ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Change Password Card */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Key className="h-6 w-6 text-gray-500 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  </div>
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>

                {isSocialLoginUser ? (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Key className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-yellow-700">
                      You currently login with a social account. Set a password to enable
                      email/password login.
                    </p>
                    </div>
                    
                  </div>
                ) : null}

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {!isSocialLoginUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        required={!isSocialLoginUser}
                        disabled={isSocialLoginUser}
                      />
                      {isSocialLoginUser && (
                        <p className="mt-1 text-sm text-gray-500">
                          No current password required for social login accounts
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rest of the form remains the same */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        required
                        minLength="8"
                      />

                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        required
                        minLength="8"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors ${saving ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                      {saving ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          {isSocialLoginUser ? 'Setting Password...' : 'Changing Password...'}
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          {isSocialLoginUser ? 'Set Password' : 'Change Password'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Profile Summary Card */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name}
                        className="h-24 w-24 rounded-full border-4 border-gray-100"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-100">
                        <span className="text-white text-3xl font-bold">
                          {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 h-8 w-8 bg-gray-900 rounded-full flex items-center justify-center border-2 border-white">
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {session.user.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{session.user.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium text-gray-900">
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last active</span>
                    <span className="font-medium text-gray-900">
                      {userData?.stats?.lastActive
                        ? new Date(userData.stats.lastActive).toLocaleDateString()
                        : 'Today'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Account status</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Card */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center mb-6">
                  <Activity className="h-6 w-6 text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Research Stats</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Papers Processed</span>
                    <span className="font-bold text-gray-900">
                      {userData?.stats?.totalPapersProcessed || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Searches</span>
                    <span className="font-bold text-gray-900">
                      {userData?.stats?.totalSearches || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Connections Found</span>
                    <span className="font-bold text-gray-900">
                      {userData?.stats?.totalConnectionsFound || 0}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: 0.4 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Settings className="h-4 w-4 mr-3 text-gray-400" />
                    Account Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Bell className="h-4 w-4 mr-3 text-gray-400" />
                    Notification Preferences
                  </button>
                  <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Shield className="h-4 w-4 mr-3 text-gray-400" />
                    Privacy & Security
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}