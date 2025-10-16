'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDatabase() {
  const [testResults, setTestResults] = useState<{
    connection: string;
    profiles: any[] | null;
    classes: any[] | null;
    homework: any[] | null;
    error: string | null;
  }>({
    connection: 'Testing...',
    profiles: null,
    classes: null,
    homework: null,
    error: null
  });

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      // Test 1: Check connection
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (profilesError) throw profilesError;

      // Test 2: Get classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .limit(5);

      // Test 3: Get homework (from quran_highlights)
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('quran_highlights')
        .select('*')
        .eq('highlight_type', 'homework')
        .limit(5);

      setTestResults({
        connection: '✅ Connected to Supabase!',
        profiles: profilesData,
        classes: classesData,
        homework: homeworkData,
        error: null
      });

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        connection: '❌ Connection failed',
        error: error?.message || 'Unknown error'
      }));
    }
  };

  const testLogin = async (email: string, password: string) => {
    try {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (result.data) {
        alert(`✅ User found: ${result.data.full_name} (${result.data.role})`);
      } else {
        alert('❌ User not found');
      }
    } catch (error: any) {
      alert(`Error: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Database Connection Test</h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-lg">{testResults.connection}</p>
          {testResults.error && (
            <div className="mt-2 p-3 bg-red-50 text-red-600 rounded">
              Error: {testResults.error}
            </div>
          )}
        </div>

        {/* Test Users */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Users (Click to Test)</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => testLogin('admin@alnoor.edu', 'admin123')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Admin Login
            </button>
            <button
              onClick={() => testLogin('teacher@alnoor.edu', 'teacher123')}
              className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Teacher Login
            </button>
            <button
              onClick={() => testLogin('ahmed@student.alnoor.edu', 'student123')}
              className="p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Student Login
            </button>
            <button
              onClick={() => testLogin('hassan@parent.alnoor.edu', 'parent123')}
              className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Parent Login
            </button>
          </div>
        </div>

        {/* Profiles Data */}
        {testResults.profiles && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Profiles ({testResults.profiles.length} found)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.profiles.map((profile, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{profile.full_name}</td>
                      <td className="px-4 py-2">{profile.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          profile.role === 'school_admin' ? 'bg-blue-100 text-blue-600' :
                          profile.role === 'teacher' ? 'bg-green-100 text-green-600' :
                          profile.role === 'student' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Data */}
        {testResults.classes && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Classes ({testResults.classes.length} found)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Room</th>
                    <th className="px-4 py-2 text-left">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.classes.map((cls, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{cls.name}</td>
                      <td className="px-4 py-2">{cls.room}</td>
                      <td className="px-4 py-2">{cls.schedule_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Homework Data */}
        {testResults.homework && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Homework ({testResults.homework.length} found)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Surah</th>
                    <th className="px-4 py-2 text-left">Ayah</th>
                    <th className="px-4 py-2 text-left">Note</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.homework.map((hw, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">Surah {hw.surah_number}</td>
                      <td className="px-4 py-2">{hw.ayah_start}-{hw.ayah_end}</td>
                      <td className="px-4 py-2">{hw.note}</td>
                      <td className="px-4 py-2">
                        {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={testDatabaseConnection}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}