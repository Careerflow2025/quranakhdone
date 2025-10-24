'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Building2,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface SettingsData {
  school: {
    id: string;
    name: string;
    logo_url: string | null;
    timezone: string;
    created_at: string;
    updated_at: string;
  };
  settings: {
    email: string;
    phone: string;
    address: string;
    website: string;
    description: string;
    academic_year_start: string;
    academic_year_end: string;
  };
}

export default function SettingsSection() {
  console.log('🔧 SettingsSection: Component mounted');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'Africa/Casablanca',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    academic_year_start: '',
    academic_year_end: '',
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('🔧 fetchSettings: Starting...');
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔧 fetchSettings: Session:', session ? 'Found' : 'None');

      if (!session) {
        console.error('🔧 fetchSettings: No session found');
        alert('Please login to access settings');
        return;
      }

      console.log('🔧 fetchSettings: Calling API...');
      const response = await fetch('/api/school/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('🔧 fetchSettings: Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('🔧 fetchSettings: API error:', error);
        throw new Error(error.error || 'Failed to fetch settings');
      }

      const result = await response.json();
      console.log('🔧 fetchSettings: Got data:', result);
      setSettingsData(result.data);

      // Populate form
      setFormData({
        name: result.data.school.name || '',
        timezone: result.data.school.timezone || 'Africa/Casablanca',
        email: result.data.settings.email || '',
        phone: result.data.settings.phone || '',
        address: result.data.settings.address || '',
        website: result.data.settings.website || '',
        description: result.data.settings.description || '',
        academic_year_start: result.data.settings.academic_year_start || '',
        academic_year_end: result.data.settings.academic_year_end || '',
      });

    } catch (error: any) {
      console.error('🔧 fetchSettings: CATCH block error:', error);
      alert('Failed to load settings: ' + error.message);
    } finally {
      console.log('🔧 fetchSettings: FINALLY - Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingLogo(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${settingsData?.school.id}_logo_${Date.now()}.${fileExt}`;
      const filePath = `school-logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-files')
        .getPublicUrl(filePath);

      // Update school with new logo URL
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/school/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          school: {
            logo_url: publicUrl
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update logo');
      }

      // Refresh settings
      await fetchSettings();
      alert('Logo updated successfully!');

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the school logo?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/school/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          school: {
            logo_url: null
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove logo');
      }

      await fetchSettings();
      alert('Logo removed successfully!');

    } catch (error: any) {
      console.error('Error removing logo:', error);
      alert('Failed to remove logo: ' + error.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/school/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          school: {
            name: formData.name,
            timezone: formData.timezone,
          },
          settings: {
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            website: formData.website,
            description: formData.description,
            academic_year_start: formData.academic_year_start,
            academic_year_end: formData.academic_year_end,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      await fetchSettings();
      alert('Settings saved successfully!');

    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    console.log('🔧 SettingsSection: Rendering LOADING state');
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  console.log('🔧 SettingsSection: Rendering MAIN content');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-emerald-600" />
          School Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your school's information and configuration
        </p>
      </div>

      {/* School Logo */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Logo</h3>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {settingsData?.school.logo_url ? (
              <div className="relative group">
                <img
                  src={settingsData.school.logo_url}
                  alt="School Logo"
                  className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </>
                )}
              </label>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Upload your school logo. Recommended size: 512x512px. Max file size: 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* School Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter school name"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="school@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="123 Main Street, City, Country"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://www.example.com"
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Academic Year
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={formData.academic_year_start}
                onChange={(e) => setFormData({ ...formData, academic_year_start: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Start"
              />
              <input
                type="date"
                value={formData.academic_year_end}
                onChange={(e) => setFormData({ ...formData, academic_year_end: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="End"
              />
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Tell us about your school..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-xl border p-6">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
