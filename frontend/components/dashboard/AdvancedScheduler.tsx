import React from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ScheduleSlot {
  start: string;
  end: string;
}

interface AdvancedSchedulerProps {
  scheduleType: string;
  scheduleDays: string[];
  scheduleSlots: Record<string, ScheduleSlot[]>;
  onScheduleTypeChange: (type: string) => void;
  onScheduleDaysChange: (days: string[]) => void;
  onScheduleSlotsChange: (slots: Record<string, ScheduleSlot[]>) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdvancedScheduler({
  scheduleType,
  scheduleDays,
  scheduleSlots,
  onScheduleTypeChange,
  onScheduleDaysChange,
  onScheduleSlotsChange
}: AdvancedSchedulerProps) {

  const handleDayToggle = (day: string) => {
    if (scheduleDays.includes(day)) {
      onScheduleDaysChange(scheduleDays.filter((d: any) => d !== day));
      const newSlots = { ...scheduleSlots };
      delete newSlots[day];
      onScheduleSlotsChange(newSlots);
    } else {
      onScheduleDaysChange([...scheduleDays, day]);
      if (scheduleType === 'custom') {
        onScheduleSlotsChange({
          ...scheduleSlots,
          [day]: [{ start: '', end: '' }]
        });
      }
    }
  };

  const handleRegularTimeChange = (field: 'start' | 'end', value: string) => {
    const newSlots: Record<string, ScheduleSlot[]> = {};
    scheduleDays.forEach((day: any) => {
      newSlots[day] = [{
        start: field === 'start' ? value : scheduleSlots[day]?.[0]?.start || '',
        end: field === 'end' ? value : scheduleSlots[day]?.[0]?.end || ''
      }];
    });
    onScheduleSlotsChange(newSlots);
  };

  const handleCustomSlotChange = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const newSlots = { ...scheduleSlots };
    if (!newSlots[day]) newSlots[day] = [{ start: '', end: '' }];
    newSlots[day][index][field] = value;
    onScheduleSlotsChange(newSlots);
  };

  const addTimeSlot = (day: string) => {
    const newSlots = { ...scheduleSlots };
    if (!newSlots[day]) newSlots[day] = [];
    newSlots[day].push({ start: '', end: '' });
    onScheduleSlotsChange(newSlots);
  };

  const removeTimeSlot = (day: string, index: number) => {
    const newSlots = { ...scheduleSlots };
    newSlots[day].splice(index, 1);
    onScheduleSlotsChange(newSlots);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center mb-3">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        <label className="text-sm font-medium text-gray-700">Class Schedule Configuration</label>
      </div>

      {/* Schedule Type Selection */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              onScheduleTypeChange('regular');
              onScheduleDaysChange([]);
              onScheduleSlotsChange({});
            }}
            className={`p-3 rounded-lg border transition-all ${
              scheduleType === 'regular'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">Regular</div>
            <div className="text-xs mt-1 opacity-75">Same time every day</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onScheduleTypeChange('custom');
              onScheduleDaysChange([]);
              onScheduleSlotsChange({});
            }}
            className={`p-3 rounded-lg border transition-all ${
              scheduleType === 'custom'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">Custom</div>
            <div className="text-xs mt-1 opacity-75">Different times per day</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onScheduleTypeChange('irregular');
              onScheduleDaysChange([]);
              onScheduleSlotsChange({});
            }}
            className={`p-3 rounded-lg border transition-all ${
              scheduleType === 'irregular'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">Flexible</div>
            <div className="text-xs mt-1 opacity-75">Variable schedule</div>
          </button>
        </div>
      </div>

      {/* Regular Schedule */}
      {scheduleType === 'regular' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Select Days</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day: any) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    scheduleDays.includes(day)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {scheduleDays.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduleSlots[scheduleDays[0]]?.[0]?.start || ''}
                  onChange={(e) => handleRegularTimeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  End Time
                </label>
                <input
                  type="time"
                  value={scheduleSlots[scheduleDays[0]]?.[0]?.end || ''}
                  onChange={(e) => handleRegularTimeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Schedule */}
      {scheduleType === 'custom' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 mb-3 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Configure different times for each day
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {DAYS_OF_WEEK.map((day: any) => (
              <div
                key={day}
                className={`border rounded-lg p-3 transition-all ${
                  scheduleDays.includes(day) ? 'bg-white border-purple-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">{day}</span>
                  </label>
                  {scheduleDays.includes(day) && (
                    <button
                      type="button"
                      onClick={() => addTimeSlot(day)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add slot
                    </button>
                  )}
                </div>

                {scheduleDays.includes(day) && (
                  <div className="space-y-2 pl-6">
                    {(scheduleSlots[day] || [{ start: '', end: '' }]).map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleCustomSlotChange(day, index, 'start', e.target.value)}
                          className="px-2 py-1 border rounded text-sm flex-1"
                          placeholder="Start"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleCustomSlotChange(day, index, 'end', e.target.value)}
                          className="px-2 py-1 border rounded text-sm flex-1"
                          placeholder="End"
                        />
                        {scheduleSlots[day].length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(day, index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flexible Schedule */}
      {scheduleType === 'irregular' && (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Flexible Schedule:</strong> This allows you to set different times each week.
                Classes can be scheduled on-demand through the calendar after creation.
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Typical Days (Optional)</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day: any) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    scheduleDays.includes(day)
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Summary */}
      {scheduleDays.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-1">📅 Schedule Summary:</p>
          <div className="text-xs text-blue-700">
            {scheduleType === 'regular' && (
              <p>Classes every {scheduleDays.join(', ')} at the same time</p>
            )}
            {scheduleType === 'custom' && (
              <div>
                <p className="font-medium mb-1">Custom schedule:</p>
                {scheduleDays.map((day: any) => (
                  <p key={day} className="ml-2">
                    • {day}: {(scheduleSlots[day] || []).map((slot: any) =>
                      `${slot.start || 'TBD'}-${slot.end || 'TBD'}`
                    ).join(', ')}
                  </p>
                ))}
              </div>
            )}
            {scheduleType === 'irregular' && (
              <p>Flexible schedule, typically on {scheduleDays.join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}