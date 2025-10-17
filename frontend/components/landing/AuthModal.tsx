'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { signInWithRole, createUserWithRole } from '@/lib/auth-helpers';

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
    setSelectedRole(role || '');
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

        // Sign up new user
        const roleMapping: Record<string, any> = {
          'school': 'school_admin',
          'teacher': 'teacher',
          'parent': 'parent'
        };

        const { user, error } = await createUserWithRole({
          email: formData.email,
          password: formData.password,
          role: roleMapping[selectedRole] || 'school_admin',
          metadata: {
            name: formData.fullName,
            schoolName: formData.schoolName
          }
        });

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        if (user) {
          // Store role in localStorage for now (in production, store in database)
          localStorage.setItem('userRole', selectedRole);
          localStorage.setItem('userEmail', formData.email);
          
          alert('Account created successfully! Please check your email to verify your account.');
          setAuthType('login');
        }
      } else {
        // Sign in existing user
        const { user, role, error } = await signInWithRole(formData.email, formData.password);

        if (error) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        if (user) {
          // Get role from localStorage (in production, fetch from database)
          const storedRole = localStorage.getItem('userRole') || selectedRole || 'school';
          
          // Route to appropriate dashboard based on role
          const roleRoutes: Record<string, string> = {
            school: '/school/dashboard',
            teacher: '/teacher/dashboard',
            parent: '/parent/dashboard'
          };

          if (roleRoutes[storedRole]) {
            router.push(roleRoutes[storedRole]);
            onClose();
          }
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
          title: 'Teacher Account',
          description: 'Access your classes and students'
        };
      case 'parent':
        return {
          icon: '👨‍👩‍👧',
          title: 'Parent Account',
          description: 'Track your children\'s progress'
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

          {/* Role Selection (for signup) */}
          {authType === 'signup' && !selectedRole && (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">I am a:</p>
              {['school', 'teacher', 'parent'].map((r) => {
                const info = {
                  school: { icon: '🏫', label: 'School Administrator' },
                  teacher: { icon: '👨‍🏫', label: 'Teacher' },
                  parent: { icon: '👨‍👩‍👧', label: 'Parent' }
                }[r];

                return (
                  <button
                    key={r}
                    onClick={() => {
                      if (r === 'school') {
                        // Redirect to full school registration form
                        router.push('/auth/school-register');
                        onClose();
                      } else {
                        setSelectedRole(r);
                      }
                    }}
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          {(authType === 'login' || selectedRole) && (
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              {/* School Name (for school admin signup) */}
              {authType === 'signup' && selectedRole === 'school' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School/Institution Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="name@example.com"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••••"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* Remember Me / Terms */}
              <div className="flex items-center justify-between">
                {authType === 'login' ? (
                  <>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                      Forgot password?
                    </a>
                  </>
                ) : (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="/terms" className="text-emerald-600 hover:underline">Terms</a> and{' '}
                      <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Please wait...' : (authType === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          )}

          {/* Divider */}
          {(authType === 'login' || selectedRole) && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <button className="w-full py-2 px-4 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700">Continue with Google</span>
                </button>
              </div>
            </>
          )}

          {/* Switch Auth Type */}
          {(authType === 'login' || selectedRole) && (
            <p className="text-center text-sm text-gray-600 mt-6">
              {authType === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setAuthType(authType === 'login' ? 'signup' : 'login');
                  setSelectedRole('');
                }}
                className="text-emerald-600 font-semibold hover:text-emerald-700"
              >
                {authType === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}