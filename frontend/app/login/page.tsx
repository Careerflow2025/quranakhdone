'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail, Lock, BookOpen, Eye, EyeOff, ArrowRight, CheckCircle,
  School, Users, GraduationCap, Shield, Star
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login: storeLogin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // PRODUCTION LOGIN FLOW
      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Authentication successful:', authData.user.email);

      // Step 2: Get user profile and determine dashboard
      // Using RPC function for production reliability
      const { data: userInfo, error: profileError } = await supabase
        .rpc('get_current_user_info') as { data: any; error: any };

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Fallback: Try direct query
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (profile && typeof profile === 'object' && 'role' in profile) {
          console.log('✅ Profile found (fallback):', profile);

          // Update auth store
          await storeLogin(email, password);

          // Redirect based on role - Using actual routes that exist in app directory
          const dashboardRoute = (profile as any).role === 'owner' ? '/school-dashboard' :
                                (profile as any).role === 'admin' ? '/school-dashboard' :
                                (profile as any).role === 'teacher' ? '/teacher-dashboard' :
                                (profile as any).role === 'student' ? '/student-dashboard' :
                                (profile as any).role === 'parent' ? '/parent-dashboard' : '/';

          console.log('🚀 Redirecting to:', dashboardRoute);
          router.push(dashboardRoute);
          return;
        }
      }

      if (userInfo && Array.isArray(userInfo) && userInfo.length > 0) {
        const user = userInfo[0];
        console.log('✅ User info retrieved:', user);

        // Update auth store with complete user data
        const userData = {
          id: authData.user.id,
          email: user.email || authData.user.email,
          role: user.role || 'owner',  // FIXED: default should be 'owner' not 'school'
          fullName: user.display_name || '',
          schoolId: user.school_id || ''
        };

        // Store in localStorage for persistence
        localStorage.setItem('token', authData.session?.access_token || '');
        localStorage.setItem('user', JSON.stringify(userData));

        // Update auth store
        useAuthStore.setState({
          user: userData,
          token: authData.session?.access_token || '',
          isAuthenticated: true,
          isLoading: false
        });

        // Redirect to appropriate dashboard - Using actual routes that exist
        const dashboardRoute = user.dashboard_route ||
                              (user.role === 'owner' ? '/school-dashboard' :
                               user.role === 'admin' ? '/school-dashboard' :
                               user.role === 'teacher' ? '/teacher-dashboard' :
                               user.role === 'student' ? '/student-dashboard' :
                               user.role === 'parent' ? '/parent-dashboard' : '/');

        console.log('🚀 Redirecting to dashboard:', dashboardRoute);

        // Use router.push for production navigation
        router.push(dashboardRoute);
      } else {
        // No profile found - might be a new user who just registered
        console.log('⚠️ No profile found, checking for school admin role...');

        // For new registrations, they should have a profile
        // If not, create one or redirect to complete profile
        setError('Profile not found. Please contact support or complete registration.');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: School, label: 'School Management', color: 'text-blue-600' },
    { icon: Users, label: 'Teacher Portal', color: 'text-green-600' },
    { icon: GraduationCap, label: 'Student Learning', color: 'text-purple-600' },
    { icon: Shield, label: 'Parent Access', color: 'text-orange-600' },
  ];

  const stats = [
    { number: '50K+', label: 'Active Students' },
    { number: '1.2K+', label: 'Schools' },
    { number: '98%', label: 'Satisfaction' },
    { number: '120+', label: 'Countries' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                QuranAkh
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              <span className="text-gray-600">New to QuranAkh?</span>
              <Link href="/register">
                <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  Register School
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Welcome Message */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your QuranAkh dashboard
              </p>
            </div>

            {/* User Type Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm"
                >
                  <feature.icon className={`w-4 h-4 ${feature.color} mr-1.5`} />
                  <span className="text-xs text-gray-600">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      className="pl-10 h-12"
                      placeholder="admin@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10 h-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
                      Register your school
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 items-center justify-center">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-6">
              Empowering Quran Education
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              Join thousands of schools worldwide using QuranAkh to transform how students learn and memorize the Holy Quran.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-emerald-100 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-white mb-4">
                "QuranAkh has revolutionized how we teach Quran. The progress tracking and highlighting system is incredible!"
              </blockquote>
              <cite className="text-emerald-100 text-sm">
                - Sheikh Abdullah, Al-Furqan Academy
              </cite>
            </div>

            {/* Features List */}
            <div className="mt-8 space-y-3">
              {[
                '6 Different Quran Scripts',
                'Real-time Progress Tracking',
                'Advanced Mistake Highlighting',
                'Parent Portal Access',
                'Offline Mode Support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 mr-3 text-emerald-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}