import React, { useState } from 'react';
import {
  X, User, Mail, Phone, Calendar, MapPin, Users,
  BookOpen, Clock, Award, FileText, Edit, Trash,
  Plus, Save, Upload, Download, AlertCircle, Check,
  GraduationCap, Building, Target, ChevronRight, BarChart3
} from 'lucide-react';

// ============= STUDENT MODALS =============

interface AddStudentModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (student: any) => void;
  classes: any[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ show, onClose, onAdd, classes }) => {
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male',
    class: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  if (!show) return null;

  const handleSubmit = () => {
    if (!studentData.name || !studentData.email || !studentData.class) {
      alert('Please fill in all required fields');
      return;
    }

    const newStudent = {
      id: `STU${Date.now()}`,
      ...studentData,
      status: 'active',
      attendance: '95%',
      progress: '0%'
    };

    onAdd(newStudent);
    onClose();
    setStudentData({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: 'male',
      class: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      address: '',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Student</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-6">
            {/* Student Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Student Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={studentData.name}
                    onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={studentData.phone}
                    onChange={(e) => setStudentData({...studentData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={studentData.age}
                    onChange={(e) => setStudentData({...studentData, age: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={studentData.gender}
                    onChange={(e) => setStudentData({...studentData, gender: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    value={studentData.class}
                    onChange={(e) => setStudentData({...studentData, class: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={studentData.parentName}
                    onChange={(e) => setStudentData({...studentData, parentName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    value={studentData.parentEmail}
                    onChange={(e) => setStudentData({...studentData, parentEmail: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    value={studentData.parentPhone}
                    onChange={(e) => setStudentData({...studentData, parentPhone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                  <input
                    type="date"
                    value={studentData.enrollmentDate}
                    onChange={(e) => setStudentData({...studentData, enrollmentDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={studentData.address}
                  onChange={(e) => setStudentData({...studentData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditStudentModalProps {
  show: boolean;
  student: any;
  onClose: () => void;
  onSave: (student: any) => void;
  classes: any[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ show, student, onClose, onSave, classes }) => {
  const [editedStudent, setEditedStudent] = useState(student || {});

  if (!show || !student) return null;

  const handleSave = () => {
    onSave(editedStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Edit Student</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editedStudent.name || ''}
                  onChange={(e) => setEditedStudent({...editedStudent, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editedStudent.email || ''}
                  onChange={(e) => setEditedStudent({...editedStudent, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editedStudent.phone || ''}
                  onChange={(e) => setEditedStudent({...editedStudent, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={editedStudent.age || ''}
                  onChange={(e) => setEditedStudent({...editedStudent, age: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={editedStudent.gender || 'male'}
                  onChange={(e) => setEditedStudent({...editedStudent, gender: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={editedStudent.class || ''}
                  onChange={(e) => setEditedStudent({...editedStudent, class: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editedStudent.status || 'active'}
                  onChange={(e) => setEditedStudent({...editedStudent, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= TEACHER MODALS =============

interface AddTeacherModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (teacher: any) => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ show, onClose, onAdd }) => {
  const [teacherData, setTeacherData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    qualification: '',
    experience: '',
    joinDate: new Date().toISOString().split('T')[0],
    address: ''
  });

  if (!show) return null;

  const handleSubmit = () => {
    if (!teacherData.name || !teacherData.email || !teacherData.subject) {
      alert('Please fill in all required fields');
      return;
    }

    const newTeacher = {
      id: `TCH${Date.now()}`,
      ...teacherData,
      status: 'active',
      classes: 0,
      students: 0
    };

    onAdd(newTeacher);
    onClose();
    setTeacherData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      qualification: '',
      experience: '',
      joinDate: new Date().toISOString().split('T')[0],
      address: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Teacher</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={teacherData.name}
                  onChange={(e) => setTeacherData({...teacherData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={teacherData.email}
                  onChange={(e) => setTeacherData({...teacherData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={teacherData.phone}
                  onChange={(e) => setTeacherData({...teacherData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  value={teacherData.subject}
                  onChange={(e) => setTeacherData({...teacherData, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="Quran Memorization">Quran Memorization</option>
                  <option value="Tajweed">Tajweed</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                  <option value="Arabic Language">Arabic Language</option>
                  <option value="Fiqh">Fiqh</option>
                  <option value="Hadith">Hadith</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={teacherData.qualification}
                  onChange={(e) => setTeacherData({...teacherData, qualification: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bachelor's in Islamic Studies"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="number"
                  value={teacherData.experience}
                  onChange={(e) => setTeacherData({...teacherData, experience: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input
                  type="date"
                  value={teacherData.joinDate}
                  onChange={(e) => setTeacherData({...teacherData, joinDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={teacherData.address}
                onChange={(e) => setTeacherData({...teacherData, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

interface ViewTeacherModalProps {
  show: boolean;
  teacher: any;
  onClose: () => void;
}

export const ViewTeacherModal: React.FC<ViewTeacherModalProps> = ({ show, teacher, onClose }) => {
  if (!show || !teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Teacher Details</h2>
              <p className="text-green-100 mt-1">{teacher.name}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{teacher.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{teacher.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{teacher.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {teacher.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Academic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Qualification</p>
                  <p className="font-medium">{teacher.qualification || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{teacher.experience || '0'} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium">{teacher.joinDate || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes & Students */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Classes & Students
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{teacher.classes || 0}</p>
                <p className="text-sm text-gray-600">Active Classes</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{teacher.students || 0}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              Weekly Schedule
            </h3>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Schedule information will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditTeacherModalProps {
  show: boolean;
  teacher: any;
  onClose: () => void;
  onSave: (teacher: any) => void;
}

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({ show, teacher, onClose, onSave }) => {
  const [editedTeacher, setEditedTeacher] = useState(teacher || {});

  if (!show || !teacher) return null;

  const handleSave = () => {
    onSave(editedTeacher);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Edit Teacher</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editedTeacher.name || ''}
                  onChange={(e) => setEditedTeacher({...editedTeacher, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editedTeacher.email || ''}
                  onChange={(e) => setEditedTeacher({...editedTeacher, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editedTeacher.phone || ''}
                  onChange={(e) => setEditedTeacher({...editedTeacher, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={editedTeacher.subject || ''}
                  onChange={(e) => setEditedTeacher({...editedTeacher, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Quran Memorization">Quran Memorization</option>
                  <option value="Tajweed">Tajweed</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                  <option value="Arabic Language">Arabic Language</option>
                  <option value="Fiqh">Fiqh</option>
                  <option value="Hadith">Hadith</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editedTeacher.status || 'active'}
                  onChange={(e) => setEditedTeacher({...editedTeacher, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="number"
                  value={editedTeacher.experience || ''}
                  onChange={(e) => setEditedTeacher({...editedTeacher, experience: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= CLASS MODALS =============

interface ViewClassModalProps {
  show: boolean;
  classData: any;
  onClose: () => void;
}

export const ViewClassModal: React.FC<ViewClassModalProps> = ({ show, classData, onClose }) => {
  if (!show || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Class Details</h2>
              <p className="text-blue-100 mt-1">{classData.name}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Class Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="font-medium">{classData.room}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{classData.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teacher</p>
                  <p className="font-medium">{classData.teacher}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium">{classData.schedule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{classData.students}/{classData.capacity}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Class Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">{classData.students}</p>
                  <p className="text-sm text-gray-600">Students</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">95%</p>
                  <p className="text-sm text-gray-600">Avg. Attendance</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600">88%</p>
                  <p className="text-sm text-gray-600">Avg. Progress</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-orange-600">4.5</p>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Enrolled Students ({classData.students})
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Student list will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= ASSIGNMENT MODALS =============

interface CreateAssignmentModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (assignment: any) => void;
  students: any[];
  classes: any[];
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  show,
  onClose,
  onCreate,
  students,
  classes
}) => {
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    type: 'memorization',
    dueDate: '',
    targetClass: '',
    targetStudents: [] as string[],
    surah: '',
    ayahFrom: '',
    ayahTo: '',
    points: 100
  });

  if (!show) return null;

  const handleSubmit = () => {
    if (!assignmentData.title || !assignmentData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newAssignment = {
      id: `ASG${Date.now()}`,
      ...assignmentData,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    onCreate(newAssignment);
    onClose();
    setAssignmentData({
      title: '',
      description: '',
      type: 'memorization',
      dueDate: '',
      targetClass: '',
      targetStudents: [],
      surah: '',
      ayahFrom: '',
      ayahTo: '',
      points: 100
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Create New Assignment</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Assignment Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Memorize Surah Al-Mulk verses 1-10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Provide detailed instructions for the assignment..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={assignmentData.type}
                      onChange={(e) => setAssignmentData({...assignmentData, type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="memorization">Memorization</option>
                      <option value="revision">Revision</option>
                      <option value="tajweed">Tajweed Practice</option>
                      <option value="test">Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={assignmentData.dueDate}
                      onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Target Selection */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Target Students
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={assignmentData.targetClass}
                    onChange={(e) => setAssignmentData({...assignmentData, targetClass: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quran Selection */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                Quran Selection
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surah</label>
                  <input
                    type="text"
                    value={assignmentData.surah}
                    onChange={(e) => setAssignmentData({...assignmentData, surah: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Al-Mulk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Ayah</label>
                  <input
                    type="number"
                    value={assignmentData.ayahFrom}
                    onChange={(e) => setAssignmentData({...assignmentData, ayahFrom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Ayah</label>
                  <input
                    type="number"
                    value={assignmentData.ayahTo}
                    onChange={(e) => setAssignmentData({...assignmentData, ayahTo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

// Export all modals
export default {
  AddStudentModal,
  EditStudentModal,
  AddTeacherModal,
  ViewTeacherModal,
  EditTeacherModal,
  ViewClassModal,
  CreateAssignmentModal
};