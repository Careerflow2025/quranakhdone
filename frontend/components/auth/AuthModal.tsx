'use client';

import { useState } from 'react';
import {
  X, Mail, Lock, User, Phone, MapPin, School, Eye, EyeOff,
  CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Loader2,
  GraduationCap, Users, BookOpen, Shield, Building, Globe,
  CreditCard, Calendar, Hash, UserPlus
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'school' | 'teacher' | 'student' | 'parent';
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, userType, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // For multi-step registration

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');

  // School registration data
  const [schoolData, setSchoolData] = useState({
    // Step 1: School Information
    schoolName: '',
    schoolId: '',
    schoolType: 'islamic_school',
    establishedYear: '',
    website: '',

    // Step 2: Location
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    timezone: 'America/New_York',

    // Step 3: Admin Account
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminRole: 'principal',
    password: '',
    confirmPassword: '',

    // Step 4: Subscription
    plan: 'premium',
    students: '100-500',
    billingCycle: 'yearly',
    termsAccepted: false,
    privacyAccepted: false
  });

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { login } = await import('@/lib/api');
      const data = await login(loginData.email, loginData.password);

      // Store auth data in the auth store
      const { useAuthStore } = await import('@/store/authStore');
      const authStore = useAuthStore.getState();
      authStore.setUser(data.user, data.token);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Redirect based on role
        if (userType === 'school' || data.user.role === 'owner' || data.user.role === 'admin') {
          window.location.href = '/school-dashboard';
        } else {
          window.location.href = `/${userType}`;
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      // Validate current step before proceeding
      if (validateStep(step)) {
        setStep(step + 1);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { register } = await import('@/lib/api');
      const registrationData = {
        email: schoolData.adminEmail,
        password: schoolData.password,
        displayName: schoolData.adminName,
        phone: schoolData.adminPhone,
        role: 'owner',
        schoolName: schoolData.schoolName,
        schoolId: schoolData.schoolId,
        schoolType: schoolData.schoolType,
        address: schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        country: schoolData.country,
        zipCode: schoolData.zipCode,
        timezone: schoolData.timezone
      };

      const data = await register(registrationData);

      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setStep(1);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setSuccess('Password reset link sent to your email!');
      setTimeout(() => {
        setMode('login');
        setSuccess('');
      }, 2000);
    }, 1500);
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');

    switch (currentStep) {
      case 1:
        if (!schoolData.schoolName || !schoolData.schoolId) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 2:
        if (!schoolData.address || !schoolData.city || !schoolData.country) {
          setError('Please fill in all location details');
          return false;
        }
        break;
      case 3:
        if (!schoolData.adminName || !schoolData.adminEmail || !schoolData.password) {
          setError('Please fill in all admin details');
          return false;
        }
        if (schoolData.password !== schoolData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (schoolData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        break;
    }
    return true;
  };

  const roleConfig = {
    school: {
      title: 'School Administrator',
      icon: GraduationCap,
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-500/20',
      allowRegister: true
    },
    teacher: {
      title: 'Teacher',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/20',
      allowRegister: false
    },
    student: {
      title: 'Student',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-500/20',
      allowRegister: false
    },
    parent: {
      title: 'Parent',
      icon: Shield,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/20',
      allowRegister: false
    }
  };

  const config = roleConfig[userType];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-${mode === 'register' && userType === 'school' ? '4xl' : 'md'} bg-gray-900 rounded-2xl shadow-2xl border ${config.borderColor} overflow-hidden`}>
        {/* Gradient Header */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${config.color}`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-4 bg-gradient-to-r ${config.color} rounded-xl shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {mode === 'login' && `${config.title} Login`}
            {mode === 'register' && 'Create School Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>

          {mode === 'login' && userType !== 'school' && (
            <p className="text-center text-gray-400 text-sm mb-6">
              Use credentials provided by your school administrator
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-8 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-400 text-sm">{success}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full bg-gray-800 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded" />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>

              {userType === 'school' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r ${config.color} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            {userType === 'school' && (
              <div className="text-center">
                <span className="text-gray-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setStep(1);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Create School Account
                </button>
              </div>
            )}
          </form>
        )}

        {/* School Registration Form (Multi-step) */}
        {mode === 'register' && userType === 'school' && (
          <form onSubmit={handleRegister} className="p-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      i <= step
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {i}
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-full h-1 mx-2 ${
                        i < step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-700'
                      }`}
                      style={{ width: '60px' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: School Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">School Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      School Name *
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={schoolData.schoolName}
                        onChange={(e) => setSchoolData({ ...schoolData, schoolName: e.target.value })}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="Al-Noor Academy"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      School ID *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={schoolData.schoolId}
                        onChange={(e) => setSchoolData({ ...schoolData, schoolId: e.target.value })}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="SCH-001"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      School Type
                    </label>
                    <select
                      value={schoolData.schoolType}
                      onChange={(e) => setSchoolData({ ...schoolData, schoolType: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="islamic_school">Islamic School</option>
                      <option value="quran_institute">Quran Institute</option>
                      <option value="madrasa">Madrasa</option>
                      <option value="weekend_school">Weekend School</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Established Year
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={schoolData.establishedYear}
                        onChange={(e) => setSchoolData({ ...schoolData, establishedYear: e.target.value })}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="2015"
                        min="1900"
                        max="2025"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website (Optional)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={schoolData.website}
                        onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="https://www.yourschool.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Location Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={schoolData.address}
                        onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={schoolData.city}
                      onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="New York"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={schoolData.state}
                      onChange={(e) => setSchoolData({ ...schoolData, state: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={schoolData.country}
                      onChange={(e) => setSchoolData({ ...schoolData, country: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="United States"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={schoolData.zipCode}
                      onChange={(e) => setSchoolData({ ...schoolData, zipCode: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="10001"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={schoolData.timezone}
                      onChange={(e) => setSchoolData({ ...schoolData, timezone: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}


            {/* Step 3: Terms & Conditions */}
            {step === 3 && (
              <>
                {/* Admin Account Fields */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Administrator Account</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={schoolData.adminName}
                          onChange={(e) => setSchoolData({ ...schoolData, adminName: e.target.value })}
                          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="Dr. Ahmad Hassan"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={schoolData.adminEmail}
                          onChange={(e) => setSchoolData({ ...schoolData, adminEmail: e.target.value })}
                          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="admin@school.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={schoolData.adminPhone}
                          onChange={(e) => setSchoolData({ ...schoolData, adminPhone: e.target.value })}
                          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="+1 234-567-8900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Role
                      </label>
                      <select
                        value={schoolData.adminRole}
                        onChange={(e) => setSchoolData({ ...schoolData, adminRole: e.target.value })}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="principal">Principal</option>
                        <option value="director">Director</option>
                        <option value="administrator">Administrator</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={schoolData.password}
                          onChange={(e) => setSchoolData({ ...schoolData, password: e.target.value })}
                          className="w-full bg-gray-800 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="Min 8 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={schoolData.confirmPassword}
                          onChange={(e) => setSchoolData({ ...schoolData, confirmPassword: e.target.value })}
                          className="w-full bg-gray-800 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-3 mt-6">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={schoolData.termsAccepted}
                        onChange={(e) => setSchoolData({ ...schoolData, termsAccepted: e.target.checked })}
                        className="mt-1 mr-3"
                        required
                      />
                      <span className="text-sm text-gray-400">
                        I agree to the <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and understand that QuranAkh will process my data in accordance with the privacy policy.
                      </span>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={schoolData.privacyAccepted}
                        onChange={(e) => setSchoolData({ ...schoolData, privacyAccepted: e.target.checked })}
                        className="mt-1 mr-3"
                        required
                      />
                      <span className="text-sm text-gray-400">
                        I have read and accept the <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Previous
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStep(1);
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Already have an account? Sign in
                </button>
              )}

              <button
                type="submit"
                disabled={loading || (step === 3 && (!schoolData.termsAccepted || !schoolData.privacyAccepted))}
                className={`px-6 py-3 bg-gradient-to-r ${config.color} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center ml-auto disabled:opacity-50`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step < 3 ? (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Create Account
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="p-8 space-y-6">
            <p className="text-gray-400 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r ${config.color} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <Mail className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-gray-400 hover:text-gray-300"
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        {/* Help Text */}
        {mode === 'login' && userType !== 'school' && (
          <div className="px-8 pb-8">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> {config.title} accounts are created by your school administrator.
                If you don't have login credentials, please contact your school admin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}