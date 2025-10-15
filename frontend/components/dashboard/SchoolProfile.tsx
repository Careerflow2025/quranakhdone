'use client';

import { useState } from 'react';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  GraduationCap,
  Clock,
  Edit,
  Save,
  X,
  Upload,
  Shield,
  Award,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Camera,
  Briefcase,
  DollarSign,
  CreditCard,
  School,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

export default function SchoolProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState('/school-logo.png');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // School Information State
  const [schoolInfo, setSchoolInfo] = useState({
    // Basic Information
    name: 'Al-Noor Academy',
    motto: 'Nurturing Hearts, Enlightening Minds',
    registrationNumber: 'SCH-2024-001',
    established: '2015',
    schoolType: 'Private Islamic School',
    gradeRange: 'KG - 12th Grade',
    academicYear: '2024-2025',
    principal: 'Dr. Ahmad Hassan',
    
    // Contact Information
    phone: '+1 (555) 123-4567',
    email: 'info@alnooracademy.edu',
    website: 'www.alnooracademy.edu',
    adminEmail: 'admin@alnooracademy.edu',
    
    // Address
    address: {
      street: '123 Islamic Center Road',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    
    // Subscription & Billing
    subscriptionPlan: 'Premium',
    subscriptionStatus: 'Active',
    nextBillingDate: '2025-01-15',
    paymentMethod: 'Credit Card ****1234'
  });
  
  const [tempSchoolInfo, setTempSchoolInfo] = useState(schoolInfo);
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    setSchoolInfo(tempSchoolInfo);
    setIsEditing(false);
    alert('School profile updated successfully!');
  };
  
  const handleCancel = () => {
    setTempSchoolInfo(schoolInfo);
    setIsEditing(false);
  };
  
  const handlePasswordChange = () => {
    // Validate passwords
    if (!passwordData.currentPassword) {
      alert('Please enter your current password');
      return;
    }
    
    if (!passwordData.newPassword) {
      alert('Please enter a new password');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // Here you would typically make an API call to change the password
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowChangePassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <School className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">School Profile</h1>
              <p className="text-sm text-gray-500">Manage your school's information and settings</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Logo and Subscription */}
        <div className="lg:col-span-1 space-y-6">
          {/* Logo Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">School Logo</h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    'AL'
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {isEditing ? 'Click camera icon to upload logo' : 'School Logo'}
              </p>
            </div>
          </div>

          {/* Subscription Status - Read Only */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                  {schoolInfo.subscriptionPlan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{schoolInfo.subscriptionStatus}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Billing</span>
                <span className="text-sm font-medium">{schoolInfo.nextBillingDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm font-medium">{schoolInfo.paymentMethod}</span>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition">
                Manage Subscription
              </button>
            </div>
          </div>
          
          {/* Password Change Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-gray-600" />
              Security
            </h2>
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.name}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.registrationNumber}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, registrationNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.registrationNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.established}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, established: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.established}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Type</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.schoolType}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, schoolType: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.schoolType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Range</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.gradeRange}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, gradeRange: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.gradeRange}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.academicYear}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, academicYear: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.academicYear}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.principal}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, principal: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.principal}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">School Motto</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.motto}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, motto: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 italic">"{schoolInfo.motto}"</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-gray-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={tempSchoolInfo.phone}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={tempSchoolInfo.email}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.website}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, website: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.website}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={tempSchoolInfo.adminEmail}
                    onChange={(e) => setTempSchoolInfo({...tempSchoolInfo, adminEmail: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.adminEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.address.street}
                    onChange={(e) => setTempSchoolInfo({
                      ...tempSchoolInfo, 
                      address: {...tempSchoolInfo.address, street: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.address.street}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.address.city}
                    onChange={(e) => setTempSchoolInfo({
                      ...tempSchoolInfo, 
                      address: {...tempSchoolInfo.address, city: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.address.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.address.state}
                    onChange={(e) => setTempSchoolInfo({
                      ...tempSchoolInfo, 
                      address: {...tempSchoolInfo.address, state: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.address.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.address.zipCode}
                    onChange={(e) => setTempSchoolInfo({
                      ...tempSchoolInfo, 
                      address: {...tempSchoolInfo.address, zipCode: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.address.zipCode}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempSchoolInfo.address.country}
                    onChange={(e) => setTempSchoolInfo({
                      ...tempSchoolInfo, 
                      address: {...tempSchoolInfo.address, country: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{schoolInfo.address.country}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}