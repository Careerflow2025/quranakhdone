'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { School, Mail, Lock, User, Phone, MapPin, ArrowRight, CheckCircle } from 'lucide-react';

export default function RegisterSchool() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // School Information
  const [schoolData, setSchoolData] = useState({
    schoolName: '',
    address: '',
    phone: '',
    email: ''
  });

  // Admin Account Information
  const [adminData, setAdminData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const handleSchoolSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!schoolData.schoolName || !schoolData.email) {
      setError('School name and email are required');
      return;
    }

    setStep(2);
    setError('');
  };

  const handleCompleteRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (adminData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Calling server-side registration API...');

      // Call the new server-side API endpoint (BYPASSES RLS!)
      const response = await fetch('/api/auth/register-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolData.schoolName,
          adminEmail: adminData.email,
          adminPassword: adminData.password,
          adminFullName: adminData.fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ Registration successful!', data);

      // Success! Show success message
      setStep(3);

      // Show success message and redirect to login after 3 seconds
      console.log('Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      console.error('💥 Registration error:', error);

      let errorMessage = 'Failed to create school. ';
      if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QuranAkh School Registration</h1>
          <p className="text-gray-600">Create your school account and start managing your Quran education</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'bg-green-600 text-white border-green-600' : 'border-gray-300'
            }`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <span className="ml-2 font-medium">School Info</span>
          </div>

          <div className={`w-24 h-0.5 mx-4 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'bg-green-600 text-white border-green-600' : 'border-gray-300'
            }`}>
              {step > 2 ? <CheckCircle className="w-6 h-6" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Admin Account</span>
          </div>

          <div className={`w-24 h-0.5 mx-4 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 3 ? 'bg-green-600 text-white border-green-600' : 'border-gray-300'
            }`}>
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>

        {/* Forms */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: School Information */}
          {step === 1 && (
            <form onSubmit={handleSchoolSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">School Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <School className="inline w-4 h-4 mr-1" />
                  School Name *
                </label>
                <input
                  type="text"
                  value={schoolData.schoolName}
                  onChange={(e) => setSchoolData({...schoolData, schoolName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Al-Noor Quran Academy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  School Email *
                </label>
                <input
                  type="email"
                  value={schoolData.email}
                  onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="info@yourschool.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={schoolData.phone}
                  onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Address
                </label>
                <textarea
                  value={schoolData.address}
                  onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="123 Main Street, City, State, ZIP"
                />
              </div>

              {/* Removed Established Year and Timezone - not in database */}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
              >
                Next: Create Admin Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </form>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Administrator Account</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={adminData.fullName}
                  onChange={(e) => setAdminData({...adminData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Admin Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="admin@yourschool.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={adminData.phone}
                  onChange={(e) => setAdminData({...adminData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Password *
                </label>
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Creating School...' : 'Complete Registration'}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">School Created Successfully!</h2>
              <p className="text-gray-600 mb-2">Welcome to QuranAkh, {adminData.fullName}!</p>
              <p className="text-gray-600 mb-4">Your school "{schoolData.schoolName}" has been created.</p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-blue-800 font-medium">📋 Save your login credentials:</p>
                <p className="text-blue-700 mt-2">Email: {adminData.email}</p>
                <p className="text-blue-700">Password: (the one you just created)</p>
              </div>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
              <div className="mt-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-700 border-t-transparent mr-2"></div>
                  Please wait...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login Link */}
        {step !== 3 && (
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have a school account?{' '}
              <Link href="/login" className="text-green-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}