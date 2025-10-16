import React from 'react';
import { X, User, Users, MessageSquare, Edit2, Send, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react';

interface ParentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: string[];
  status: string;
  occupation?: string;
  address?: string;
  joinDate?: string;
}

export const ParentDetailsModal = ({ parent, onClose, onEdit, onMessage }: {
  parent: ParentData | null;
  onClose: () => void;
  onEdit: (parent: ParentData) => void;
  onMessage: (parent: ParentData) => void;
}) => {
  if (!parent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Parent Details</h2>
              <p className="text-gray-500 mt-1">{parent.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Parent Information */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{parent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{parent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{parent.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  parent.status === 'active' || parent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {parent.status === 'active' ? 'Active' : parent.status}
                </span>
              </div>
              {parent.occupation && (
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{parent.occupation}</p>
                </div>
              )}
              {parent.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{parent.address}</p>
                </div>
              )}
              {parent.joinDate && (
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{parent.joinDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Children Information */}
          <div className="bg-white border rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-500" />
              Children ({parent.children.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parent.children.map((child: any, index: any) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{child}</p>
                    <p className="text-xs text-gray-500">Class {index + 3} • Sheikh Omar</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Communication History */}
          <div className="bg-white border rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
              Recent Communications
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">Progress report sent for Ahmed</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">Meeting scheduled for Fatima's progress</p>
                  <p className="text-xs text-gray-500">5 days ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">Attendance notification sent</p>
                  <p className="text-xs text-gray-500">1 week ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                onClose();
                onMessage(parent);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Message</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(parent);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Parent</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EditParentModal = ({ parent, onClose, onSave }: {
  parent: ParentData | null;
  onClose: () => void;
  onSave: () => void;
}) => {
  if (!parent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Edit Parent Information</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-4">
            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Name
              </label>
              <input
                type="text"
                defaultValue={parent.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={parent.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue={parent.phone}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                defaultValue={parent.occupation || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Alternative Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternative Contact (Optional)
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                rows={2}
                defaultValue={parent.address || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Preferences
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">SMS notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">App push notifications</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                defaultValue={parent.status === 'active' ? 'active' : parent.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert('Parent information updated successfully');
                onSave();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageParentModal = ({ parent, onClose, onSend }: {
  parent: ParentData | null;
  onClose: () => void;
  onSend: (message: string) => void;
}) => {
  if (!parent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Send Message to Parent</h2>
              <p className="text-sm text-gray-500 mt-1">To: {parent.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Message Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
              <option value="general">General Update</option>
              <option value="progress">Progress Report</option>
              <option value="attendance">Attendance Notification</option>
              <option value="meeting">Meeting Request</option>
              <option value="urgent">Urgent Message</option>
            </select>
          </div>

          {/* Children Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regarding Child(ren)
            </label>
            <div className="space-y-2">
              {parent.children.map((child: any, index: any) => (
                <label key={index} className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">{child}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter message subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          {/* Quick Templates */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Progress Update
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Meeting Request
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Attendance Alert
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Homework Reminder
              </button>
            </div>
          </div>

          {/* Send Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Via
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">Email ({parent.email})</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">SMS ({parent.phone})</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">In-App Notification</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Save as Draft
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Message sent to ${parent.name}`);
                  onSend('Message sent');
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};