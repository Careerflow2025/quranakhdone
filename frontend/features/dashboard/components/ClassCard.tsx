'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, Clock, MapPin, MoreVertical, Edit, Trash2, Archive } from 'lucide-react';
import { useState } from 'react';
import { Class, useDashboardStore } from '../state/useDashboardStore';
import { useDragDrop } from './DragDropProvider';

interface ClassCardProps {
  classData: Class;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ClassCard({ classData, onEdit, onDelete }: ClassCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { selectClass, setClassDetailModalOpen, addStudentToClass } = useDashboardStore();
  const { draggedStudent } = useDragDrop();
  
  const handleCardClick = () => {
    selectClass(classData);
    setClassDetailModalOpen(true);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${classData.name}?`)) {
      onDelete?.();
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedStudent) {
      addStudentToClass(draggedStudent.id, classData.id);
    }
  };
  
  const getDaysAbbreviation = (days?: string[]) => {
    if (!days || days.length === 0) return 'No schedule';
    const abbr = days.map(d => d.substring(0, 3)).join(', ');
    return abbr;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative group cursor-pointer ${
        isDragOver ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''
      }`}
      onClick={handleCardClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`h-64 rounded-2xl shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden border ${
        isDragOver ? 'border-emerald-400' : 'border-gray-200'
      }`}>
        {/* Header with gradient */}
        <div 
          className="h-24 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${classData.color}dd 0%, ${classData.color}99 100%)`
          }}
        >
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
            }} />
          </div>
          
          {/* Class icon */}
          <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          
          {/* Menu button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Archive className="w-3 h-3" />
                  Archive
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
          
          {/* Student count badge */}
          <div className="absolute bottom-3 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium">
            {classData.studentCount} / {classData.capacity} students
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg text-gray-800 truncate">{classData.name}</h3>
            {classData.code && (
              <p className="text-sm text-gray-500 font-mono">{classData.code}</p>
            )}
          </div>
          
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {classData.schedule && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{classData.schedule.start}</span>
              </div>
            )}
            
            {classData.room && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>{classData.room}</span>
              </div>
            )}
            
            {classData.schedule?.days && (
              <div className="col-span-2 flex items-center gap-1 text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{getDaysAbbreviation(classData.schedule.days)}</span>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Drop indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-emerald-400/20 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
              <p className="text-sm font-medium text-emerald-700">Drop to assign student</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}