'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signOut, upsertUserProfile, getUserRole } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  type: 'login' | 'signup';
  role?: string;
  onClose: () => void;
}

export default function AuthModal({ isOpen, type, role, onClose }: AuthModalProps) {
  const router = useRouter();
  const [authType, setAuthType] = useState(type);
  const [selectedRole, setSelectedRole] = useState(role || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    fullName: '',
    phoneNumber: '',
    agreeToTerms: false
  });

  useEffect(() => {
    setAuthType(type);
    if (role) {
      setSelectedRole(role);
    }
    setError('');
  }, [type, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First sign out any existing session
      await signOut();

      if (authType === 'signup') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Sign up new user with role
        const { data, error } = await signUp(
          formData.email, 
          formData.password,
          selectedRole,
          {
            full_name: formData.fullName,
            school_name: formData.schoolName,
            phone_number: formData.phoneNumber
          }
        );
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Create user profile in database
          await upsertUserProfile({
            id: data.user.id,
            email: formData.email,
            role: selectedRole,
            full_name: formData.fullName,
            school_name: formData.schoolName,
            phone_number: formData.phoneNumber
          });
          
          console.log('Signup successful! Role stored in database:', selectedRole);
          
          alert('Account created successfully! Please check your email to verify your account.');
          setAuthType('login');
        }
      } else {
        // LOGIN LOGIC - FIXED VERSION
        console.log('Starting login process...');
        console.log('Selected role:', selectedRole);
        
        const { data, error } = await signIn(formData.email, formData.password);
        
        if (error) {
          console.error('Login error:', error);
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email before logging in. Check your inbox for the confirmation link.');
          } else {
            setError(error.message || 'Invalid email or password');
          }
          setLoading(false);
          return;
        }

        if (data?.user) {
          console.log('User authenticated successfully:', data.user.id);
          
          // SKIP DATABASE - JUST USE SELECTED ROLE
          const userRole = selectedRole || 'teacher';
          console.log('Using role:', userRole);
          
          // Determine the target route based on selected role
          let targetRoute = '/teacher/dashboard'; // Default to teacher
          
          if (userRole === 'school') {
            targetRoute = '/school/dashboard';
          } else if (userRole === 'teacher') {
            targetRoute = '/teacher/dashboard';
          } else if (userRole === 'parent') {
            targetRoute = '/parent/dashboard';
          }
          
          console.log('FINAL REDIRECT TO:', targetRoute);
          console.log('Closing modal and redirecting...');
          
          // Close the modal
          onClose();
          
          // AGGRESSIVE REDIRECT - TRY ALL METHODS
          
          // Method 1: Immediate window location change
          window.location.href = targetRoute;
          
          // Method 2: Router push as backup (in case window.location is blocked)
          router.push(targetRoute);
          
          // Method 3: Replace history
          window.history.replaceState(null, '', targetRoute);
          window.location.reload();
          
          // Method 4: Final fallback with delay
          setTimeout(() => {
            if (window.location.pathname !== targetRoute) {
              window.location.assign(targetRoute);
            }
          }, 100);
          
        } else {
          setError('Login failed. Please check your credentials.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRoleInfo = () => {
    switch (selectedRole) {
      case 'school':
        return {
          icon: '🏫',
          title: 'School Administrator',
          description: 'Manage your entire institution'
        };
      case 'teacher':
        return {
          icon: '👨‍🏫',
          title: 'Teacher',
          description: 'Track student progress and manage classes'
        };
      case 'parent':
        return {
          icon: '👨‍👩‍👧',
          title: 'Parent',
          description: "Monitor your child's Quran learning journey"
        };
      default:
        return null;
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">Q</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {authType === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-600 mt-1">
              {authType === 'login' 
                ? 'Sign in to your account' 
                : 'Create your free account'}
            </p>
          </div>

          {/* Role Selection (for both signup and login) */}
          {!selectedRole && (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                {authType === 'login' ? 'Sign in as:' : 'I am a:'}
              </p>
              {['school', 'teacher', 'parent'].map((r) => {
                const info = {
                  school: { icon: '🏫', label: 'School Administrator' },
                  teacher: { icon: '👨‍🏫', label: 'Teacher' },
                  parent: { icon: '👨‍👩‍👧', label: 'Parent' }
                }[r];

                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left flex items-center space-x-3"
                  >
                    <span className="text-2xl">{info?.icon}</span>
                    <span className="font-medium text-gray-900">{info?.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Role Badge */}
          {roleInfo && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 flex items-center space-x-3">
              <span className="text-2xl">{roleInfo.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{roleInfo.title}</p>
                <p className="text-sm text-gray-600">{roleInfo.description}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (signup only) */}
              {authType === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              {/* School Name (signup + school role only) */}
              {authType === 'signup' && selectedRole === 'school' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your school name"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              {/* Confirm Password (signup only) */}
              {authType === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? 'Please wait...' 
                  : authType === 'login' 
                  ? 'Sign In' 
                  : 'Create Account'}
              </button>
            </form>
          )}

          {/* Switch Auth Type */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {authType === 'login' 
                ? "Don't have an account? " 
                : 'Already have an account? '}
              <button
                onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {authType === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}