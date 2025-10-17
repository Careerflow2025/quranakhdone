'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  School, User, Mail, Lock, Phone, MapPin, ArrowLeft, ArrowRight,
  CheckCircle, Building, Sparkles, Shield, Clock, Globe, Star,
  GraduationCap, Users, BookOpen, TrendingUp, Award
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // School data
  const [schoolData, setSchoolData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Admin data
  const [adminData, setAdminData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const benefits = [
    { icon: Users, text: 'Unlimited users' },
    { icon: Shield, text: 'Bank-level security' },
    { icon: Globe, text: 'Multi-language support' },
    { icon: Clock, text: '24/7 support' }
  ];

  const features = [
    '6 Quran scripts (Hafs, Warsh, etc.)',
    'Real-time collaboration',
    'Advanced progress tracking',
    'Offline mode with PWA',
    'Detailed analytics',
    'Parent portal access'
  ];

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolData.name || !schoolData.email) {
      setError('School name and email are required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(schoolData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!adminData.fullName || !adminData.email || !adminData.password) {
      setError('All fields are required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(adminData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (adminData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // CORRECT APPROACH: Call API route that has service_role permissions
      // RLS Policy requires service_role to INSERT into schools table
      // Frontend with anon key cannot INSERT schools directly
      const response = await fetch('/api/auth/create-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolName: schoolData.name,
          schoolEmail: adminData.email, // Use admin email as school contact
          adminEmail: adminData.email,
          adminPassword: adminData.password,
          adminName: adminData.fullName,
          timezone: 'Africa/Casablanca'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'School creation failed');
      }

      // Success! Show success step
      setStep(3);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <span className="text-gray-600">Already have an account?</span>
              <Link href="/login">
                <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Form */}
          <div className="max-w-xl mx-auto w-full">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((i) => (
                  <React.Fragment key={i}>
                    <div className={`flex items-center ${i > 1 ? 'flex-1' : ''}`}>
                      {i > 1 && (
                        <div className={`h-1 w-full mr-2 rounded ${
                          step > i - 1 ? 'bg-emerald-500' : 'bg-gray-200'
                        }`} />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= i
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step > i ? <CheckCircle className="w-6 h-6" /> : i}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">School Info</span>
                <span className="text-xs text-gray-600 text-center">Admin Account</span>
                <span className="text-xs text-gray-600 text-right">Complete!</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {step === 1 && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                      <School className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Tell us about your school</h2>
                    <p className="text-gray-600 mt-2">We'll set up your account in seconds</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSchoolSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          className="pl-10 h-12"
                          placeholder="Al-Noor Academy"
                          value={schoolData.name}
                          onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          className="pl-10 h-12"
                          placeholder="contact@school.com"
                          value={schoolData.email}
                          onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="tel"
                          className="pl-10 h-12"
                          placeholder="+1 (555) 123-4567"
                          value={schoolData.phone}
                          onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          className="pl-10 h-12"
                          placeholder="123 Main Street, City"
                          value={schoolData.address}
                          onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                    >
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                      <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create your admin account</h2>
                    <p className="text-gray-600 mt-2">You'll use this to manage everything</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleFinalSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          className="pl-10 h-12"
                          placeholder="Ahmed Hassan"
                          value={adminData.fullName}
                          onChange={(e) => setAdminData({...adminData, fullName: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          className="pl-10 h-12"
                          placeholder="admin@school.com"
                          value={adminData.email}
                          onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password * (min 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          className="pl-10 h-12"
                          placeholder="••••••••"
                          value={adminData.password}
                          onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          className="pl-10 h-12"
                          placeholder="••••••••"
                          value={adminData.confirmPassword}
                          onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 h-12"
                      >
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                      >
                        {isLoading ? (
                          <>Creating Account...</>
                        ) : (
                          <>
                            Complete Setup
                            <CheckCircle className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4"
                  >
                    ← Back to school information
                  </button>
                </>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to QuranAkh!
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Your school has been successfully registered.
                  </p>

                  <div className="bg-emerald-50 rounded-xl p-6 mb-8 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Your Login Credentials:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{adminData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Password:</span>
                        <span className="font-medium text-gray-900">••••••••</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-emerald-600">School Administrator</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                    >
                      Go to Login
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-sm text-gray-500">
                      We've sent a confirmation email to {adminData.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="hidden lg:block sticky top-8">
            {/* Testimonial Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg mb-4 italic">
                "QuranAkh transformed how we teach Quran. Our students' memorization improved by 80% in just 3 months!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl mr-3">
                  👩‍🏫
                </div>
                <div>
                  <div className="font-semibold">Fatima Al-Hassan</div>
                  <div className="text-emerald-100 text-sm">Director, Al-Noor Academy</div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">
                Everything included in your free trial:
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center justify-between mb-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="text-center">
                      <benefit.icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <span className="text-xs text-gray-600 block">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4 mt-6">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-emerald-600 mr-2" />
                  <span className="text-sm font-medium text-emerald-900">
                    No credit card required • 30-day free trial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}