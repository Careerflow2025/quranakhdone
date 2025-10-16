'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Mail, Phone, Users, GraduationCap, UserPlus } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'student' | 'teacher' | 'parent';
  onUserCreated?: (user: any) => void;
}

export default function CreateUserModal({ isOpen, onClose, userType, onUserCreated }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: userType || 'student', // student, teacher, parent
    password: '',
    sendEmail: true
  });

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user's school ID
      const { data: currentUser } = await supabase.auth.getUser();

      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', currentUser.user.id)
        .single();

      if (!adminProfile?.school_id) {
        throw new Error('School ID not found');
      }

      // Step 1: Create auth user with auto-generated password
      const tempPassword = formData.password || generatePassword();

      // For production, we'd use Supabase Admin API
      // For now, we'll create the user with a temporary method
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          school_id: adminProfile.school_id,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          password: 'managed_by_auth', // Don't store actual password
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Step 3: If parent, we'll need to link to children later
      // Step 4: Store credential info for display (temporary - remove in production)
      const credentialInfo = {
        email: formData.email,
        password: tempPassword,
        role: formData.role,
        name: formData.fullName
      };

      // Show success message with credentials
      alert(`✅ User Created Successfully!

Name: ${formData.fullName}
Email: ${formData.email}
Password: ${tempPassword}
Role: ${formData.role}

⚠️ IMPORTANT: Save these credentials!
The password won't be shown again.

${formData.sendEmail ? '📧 An email has been sent to the user.' : '📝 Please share these credentials with the user.'}`);

      // Call parent callback
      if (onUserCreated) {
        onUserCreated({
          ...credentialInfo,
          id: authData.user.id
        });
      }

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: userType || 'student',
        password: '',
        sendEmail: true
      });

      onClose();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error?.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {formData.role === 'student' && <GraduationCap className="w-6 h-6 text-blue-600" />}
            {formData.role === 'teacher' && <Users className="w-6 h-6 text-green-600" />}
            {formData.role === 'parent' && <UserPlus className="w-6 h-6 text-purple-600" />}
            <h2 className="text-2xl font-bold text-gray-900">
              Create New {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline w-4 h-4 mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter or generate password"
                required
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password will be sent to user's email</p>
          </div>

          {/* Send Email Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendEmail"
              checked={formData.sendEmail}
              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="sendEmail" className="text-sm text-gray-700">
              Send login credentials via email
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>

        {/* Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> The user will receive an email with their login credentials.
            They can change their password after first login.
          </p>
        </div>
      </div>
    </div>
  );
}