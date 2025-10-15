'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Download,
  Trash2,
  Filter,
  CheckCircle
} from 'lucide-react';
import { Student, useDashboardStore } from '../state/useDashboardStore';
import { useDragDrop } from './DragDropProvider';

interface StudentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function StudentSidebar({ isOpen, onToggle }: StudentSidebarProps) {
  const {
    importedStudents,
    setImportedStudents,
    searchQuery,
    setSearchQuery,
    getUnassignedStudents
  } = useDashboardStore();
  
  const { setDraggedStudent } = useDragDrop();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'assigned' | 'unassigned'>('all');
  
  const unassignedStudents = getUnassignedStudents();
  
  const processExcelFile = (file: File) => {
    setIsProcessing(true);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Check if data exists
        if (!jsonData || jsonData.length === 0) {
          setUploadError('No data found in the Excel file.');
          setIsProcessing(false);
          return;
        }
        
        const students: Student[] = jsonData.map((row: any, index) => ({
          id: crypto.randomUUID(),
          // Try different possible column names for the name field
          name: row['Name'] || row['name'] || row['NAME'] || row['Full Name'] || row['Student Name'] || `Student ${index + 1}`,
          email: row['Email'] || row['email'] || row['EMAIL'] || undefined,
          phone: row['Phone'] || row['phone'] || row['PHONE'] || undefined,
          parentName: row['Parent Name'] || row['parent_name'] || row['Parent'] || undefined,
          parentEmail: row['Parent Email'] || row['parent_email'] || undefined,
          parentPhone: row['Parent Phone'] || row['parent_phone'] || undefined,
          assignedClasses: []
        }));
        
        // Filter out any invalid entries
        const validStudents = students.filter(s => s.name && s.name !== `Student ${students.indexOf(s) + 1}`);
        
        if (validStudents.length === 0) {
          setUploadError('No valid student names found. Please ensure your Excel has a "Name" column.');
          setIsProcessing(false);
          return;
        }
        
        setImportedStudents(validStudents);
        setIsProcessing(false);
      } catch (error) {
        console.error('Excel processing error:', error);
        setUploadError('Failed to process Excel file. Please ensure it has a "Name" column.');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setUploadError('Failed to read file');
      setIsProcessing(false);
    };
    
    reader.readAsBinaryString(file);
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processExcelFile(file);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });
  
  const filteredStudents = importedStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterAssigned === 'all' ||
      (filterAssigned === 'assigned' && student.assignedClasses.length > 0) ||
      (filterAssigned === 'unassigned' && student.assignedClasses.length === 0);
    return matchesSearch && matchesFilter;
  });
  
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Name': 'Ahmed Ali' },
      { 'Name': 'Fatima Hassan' },
      { 'Name': 'Omar Khan' },
      { 'Name': 'Aisha Ibrahim' },
      { 'Name': 'Example: Add more names below' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_names_template.xlsx');
  };
  
  const clearAllStudents = () => {
    if (confirm('Are you sure you want to clear all imported students?')) {
      setImportedStudents([]);
    }
  };
  
  const handleDragStart = (e: React.DragEvent, student: Student) => {
    setDraggedStudent(student);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setDraggedStudent(null);
  };
  
  return (
    <>
      {/* Toggle Button - Always Visible */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 transform -translate-y-1/2 z-50
          bg-white shadow-lg rounded-l-lg p-3 hover:bg-gray-50
          transition-all duration-300 border border-gray-200
        `}
        style={{ right: isOpen ? '320px' : '0' }}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Sidebar - Always in DOM but visually hidden when closed */}
      <div className={`w-80 h-full bg-white shadow-lg flex flex-col ${!isOpen ? 'hidden' : ''}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Student Manager</h2>
                </div>
              </div>
              <p className="text-sm opacity-90">
                {unassignedStudents.length} unassigned • {importedStudents.length} total
              </p>
            </div>
            
            {/* Upload Zone */}
            <div className="p-4 border-b">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} disabled={isProcessing} />
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {isDragActive ? (
                  <p className="text-sm text-indigo-600">Drop the Excel file here...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Drag & drop Excel file here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  </>
                )}
              </div>
              
              {uploadError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {uploadError}
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={downloadTemplate}
                  className="flex-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Template
                </button>
                {importedStudents.length > 0 && (
                  <button
                    onClick={clearAllStudents}
                    className="flex-1 text-xs py-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="p-4 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterAssigned('all')}
                  className={`flex-1 text-xs py-1 px-2 rounded ${
                    filterAssigned === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterAssigned('unassigned')}
                  className={`flex-1 text-xs py-1 px-2 rounded ${
                    filterAssigned === 'unassigned' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  Unassigned
                </button>
                <button
                  onClick={() => setFilterAssigned('assigned')}
                  className={`flex-1 text-xs py-1 px-2 rounded ${
                    filterAssigned === 'assigned' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  Assigned
                </button>
              </div>
            </div>
            
            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students found</p>
                  <p className="text-xs mt-1">Upload an Excel file to get started</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, student)}
                    onDragEnd={handleDragEnd}
                    className={`
                      p-3 bg-white rounded-lg border transition-all cursor-move hover:shadow-md
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${student.assignedClasses.length > 0 ? 'bg-green-500' : 'bg-gray-400'}
                        `}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-gray-500">{student.email}</p>
                          )}
                        </div>
                      </div>
                      {student.assignedClasses.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-gray-500">{student.assignedClasses.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer Info */}
            <div className="p-4 bg-gray-50 border-t text-xs text-gray-500">
              <p>Drag students to class cards to assign them</p>
            </div>
      </div>
    </>
  );
}