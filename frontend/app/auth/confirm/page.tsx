'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const [message, setMessage] = useState('Processing your invitation...');
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if we have a token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'invite' && accessToken) {
      setMessage('Welcome! Please set your password to complete registration.');
      setIsLoading(false);
    } else if (type === 'recovery' && accessToken) {
      setMessage('Reset your password below.');
      setIsLoading(false);
    } else {
      setMessage('Invalid or expired link. Please request a new invitation.');
      setIsLoading(false);
    }
  }, []);

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    try {
      setIsLoading(true);

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert('Password set successfully! Redirecting to login...');

      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Error setting password:', error);
      alert(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QuranAkh</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        {!isLoading && message.includes('Please set your password') && (
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
            </button>
          </form>
        )}

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}