// Add this data after the classes array (around line 214):

  // Homework Data (Green Highlights)
  const homeworkData = [
    {
      id: 'HW001',
      studentId: 'STU001',
      studentName: 'Fatima Al-Zahra',
      class: 'Class 6A',
      teacherId: 'TCH001',
      teacherName: 'Sheikh Muhammad Ali',
      surah: 'Al-Baqarah',
      ayahRange: '1-5',
      note: 'Practice recitation with proper tajweed rules',
      assignedDate: '2025-01-18',
      dueDate: '2025-01-25',
      status: 'pending',
      replies: 0,
      color: 'green'
    },
    {
      id: 'HW002',
      studentId: 'STU002',
      studentName: 'Abdullah Khan',
      class: 'Class 5B',
      teacherId: 'TCH002',
      teacherName: 'Ustadha Sarah Ahmed',
      surah: 'Al-Mulk',
      ayahRange: '1-10',
      note: 'Memorize these verses by next week',
      assignedDate: '2025-01-17',
      dueDate: '2025-01-24',
      status: 'in-progress',
      replies: 2,
      color: 'green'
    },
    {
      id: 'HW003',
      studentId: 'STU003',
      studentName: 'Aisha Ibrahim',
      class: 'Class 7A',
      teacherId: 'TCH001',
      teacherName: 'Sheikh Muhammad Ali',
      surah: 'Yasin',
      ayahRange: '20-30',
      note: 'Review with focus on makharij',
      assignedDate: '2025-01-16',
      dueDate: '2025-01-23',
      status: 'completed',
      replies: 3,
      color: 'green'
    },
    {
      id: 'HW004',
      studentId: 'STU004',
      studentName: 'Omar Hassan',
      class: 'Class 4A',
      teacherId: 'TCH003',
      teacherName: 'Imam Abdul Rahman',
      surah: 'An-Nas',
      ayahRange: '1-6',
      note: 'Daily practice 5 times',
      assignedDate: '2025-01-19',
      dueDate: '2025-01-26',
      status: 'pending',
      replies: 0,
      color: 'green'
    },
    {
      id: 'HW005',
      studentId: 'STU005',
      studentName: 'Maryam Ahmed',
      class: 'Class 8B',
      teacherId: 'TCH002',
      teacherName: 'Ustadha Sarah Ahmed',
      surah: 'Al-Kahf',
      ayahRange: '1-10',
      note: 'Prepare for weekend recitation test',
      assignedDate: '2025-01-18',
      dueDate: '2025-01-21',
      status: 'overdue',
      replies: 1,
      color: 'green'
    }
  ];

  // Targets Data
  const targetsData = [
    {
      id: 'TGT001',
      title: 'Complete Juz 30 Memorization',
      description: 'All students in Class 6A to complete memorization of Juz 30',
      type: 'class',
      assignedBy: 'Sheikh Muhammad Ali',
      assignedTo: 'Class 6A',
      startDate: '2025-01-01',
      dueDate: '2025-03-30',
      status: 'active',
      category: 'memorization',
      totalStudents: 25,
      completedStudents: 12,
      progress: 48,
      milestones: [
        { name: 'First 5 Surahs', completed: true },
        { name: 'Next 5 Surahs', completed: false },
        { name: 'Final Surahs', completed: false }
      ]
    },
    {
      id: 'TGT002',
      title: 'Master Noon Sakinah Rules',
      description: 'Individual target for Abdullah Khan to master all tajweed rules of Noon Sakinah',
      type: 'individual',
      assignedBy: 'Ustadha Sarah Ahmed',
      assignedTo: 'Abdullah Khan',
      startDate: '2025-01-15',
      dueDate: '2025-02-15',
      status: 'active',
      category: 'tajweed',
      totalLessons: 8,
      completedLessons: 5,
      progress: 62.5,
      testsCompleted: 3,
      averageScore: 85
    },
    {
      id: 'TGT003',
      title: 'Weekend Quran Competition Preparation',
      description: 'Prepare Class 7A for inter-school Quran competition',
      type: 'class',
      assignedBy: 'Sheikh Muhammad Ali',
      assignedTo: 'Class 7A',
      startDate: '2025-01-10',
      dueDate: '2025-02-28',
      status: 'active',
      category: 'competition',
      participatingStudents: 15,
      practiceHours: 45,
      progress: 70
    },
    {
      id: 'TGT004',
      title: 'Improve Tajweed Accuracy',
      description: 'School-wide target to improve overall tajweed accuracy by 20%',
      type: 'school',
      assignedBy: 'School Administration',
      assignedTo: 'All Students',
      startDate: '2025-01-01',
      dueDate: '2025-06-30',
      status: 'active',
      category: 'tajweed',
      currentAccuracy: 75,
      targetAccuracy: 95,
      progress: 37.5
    },
    {
      id: 'TGT005',
      title: 'Complete Surah Al-Baqarah',
      description: 'Individual memorization target for Aisha Ibrahim',
      type: 'individual',
      assignedBy: 'Imam Abdul Rahman',
      assignedTo: 'Aisha Ibrahim',
      startDate: '2024-12-01',
      dueDate: '2025-04-30',
      status: 'active',
      category: 'memorization',
      totalAyahs: 286,
      completedAyahs: 143,
      progress: 50,
      dailyTarget: 2
    }
  ];

// Add these sections after the assignments section (after line 2004):

        {/* Homework Section */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <BookOpen className="w-7 h-7 mr-3" />
                    School Homework Overview
                  </h2>
                  <p className="text-green-100 mt-1">All green highlights (homework) assigned by teachers across the school</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{homeworkData.length}</div>
                  <div className="text-green-100">Total Assignments</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={homeworkFilter.class}
                    onChange={(e) => setHomeworkFilter({...homeworkFilter, class: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                  <select
                    value={homeworkFilter.student}
                    onChange={(e) => setHomeworkFilter({...homeworkFilter, student: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Students</option>
                    {students.map((student: any) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={homeworkFilter.teacher}
                    onChange={(e) => setHomeworkFilter({...homeworkFilter, teacher: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Teachers</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={homeworkFilter.status}
                    onChange={(e) => setHomeworkFilter({...homeworkFilter, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={homeworkFilter.dateRange}
                    onChange={(e) => setHomeworkFilter({...homeworkFilter, dateRange: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by student name, surah, or note..."
                    value={homeworkSearchTerm}
                    onChange={(e) => setHomeworkSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setHomeworkFilter({
                      class: 'all',
                      student: 'all',
                      teacher: 'all',
                      status: 'all',
                      dateRange: '7days'
                    });
                    setHomeworkSearchTerm('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Homework</p>
                    <p className="text-2xl font-bold text-gray-900">{homeworkData.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {homeworkData.filter((h: any) => h.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {homeworkData.filter((h: any) => h.status === 'in-progress').length}
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {homeworkData.filter((h: any) => h.status === 'overdue').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Homework Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {homeworkData
                .filter((hw: any) => {
                  if (homeworkFilter.class !== 'all' && hw.class !== homeworkFilter.class) return false;
                  if (homeworkFilter.student !== 'all' && hw.studentId !== homeworkFilter.student) return false;
                  if (homeworkFilter.teacher !== 'all' && hw.teacherId !== homeworkFilter.teacher) return false;
                  if (homeworkFilter.status !== 'all' && hw.status !== homeworkFilter.status) return false;
                  if (homeworkSearchTerm) {
                    const search = homeworkSearchTerm.toLowerCase();
                    return hw.studentName.toLowerCase().includes(search) ||
                           hw.surah.toLowerCase().includes(search) ||
                           hw.note.toLowerCase().includes(search);
                  }
                  return true;
                })
                .map((homework: any) => (
                  <div key={homework.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white text-lg">{homework.studentName}</h3>
                          <p className="text-green-100 text-sm">{homework.class}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          homework.status === 'completed' ? 'bg-white text-green-600' :
                          homework.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          homework.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {homework.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Book className="w-4 h-4 mr-2" />
                          <span className="font-medium">Surah {homework.surah}</span>
                          <span className="mx-2">•</span>
                          <span>Ayah {homework.ayahRange}</span>
                        </div>
                        <p className="text-gray-700">{homework.note}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Teacher:</span>
                          <span className="text-gray-700 font-medium">{homework.teacherName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Assigned:</span>
                          <span className="text-gray-700">{homework.assignedDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Due Date:</span>
                          <span className={`font-medium ${
                            homework.status === 'overdue' ? 'text-red-600' : 'text-gray-700'
                          }`}>
                            {homework.dueDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{homework.replies} replies</span>
                        </div>
                        <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {homeworkData.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No homework found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}

        {/* Targets Section */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Target className="w-7 h-7 mr-3" />
                    School-wide Learning Targets
                  </h2>
                  <p className="text-purple-100 mt-1">Track all learning goals and milestones across the school</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{targetsData.filter((t: any) => t.status === 'active').length}</div>
                  <div className="text-purple-100">Active Targets</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={targetsFilter.type}
                    onChange={(e) => setTargetsFilter({...targetsFilter, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="class">Class</option>
                    <option value="school">School-wide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <select
                    value={targetsFilter.student}
                    onChange={(e) => setTargetsFilter({...targetsFilter, student: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All</option>
                    {students.map((student: any) => (
                      <option key={student.id} value={student.name}>{student.name}</option>
                    ))}
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={targetsFilter.teacher}
                    onChange={(e) => setTargetsFilter({...targetsFilter, teacher: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Teachers</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={targetsFilter.status}
                    onChange={(e) => setTargetsFilter({...targetsFilter, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="memorization">Memorization</option>
                    <option value="tajweed">Tajweed</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search targets by title or description..."
                    value={targetsSearchTerm}
                    onChange={(e) => setTargetsSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Target Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {targetsData
                .filter((target: any) => {
                  if (targetsFilter.type !== 'all' && target.type !== targetsFilter.type) return false;
                  if (targetsFilter.status !== 'all' && target.status !== targetsFilter.status) return false;
                  if (targetsSearchTerm) {
                    const search = targetsSearchTerm.toLowerCase();
                    return target.title.toLowerCase().includes(search) ||
                           target.description.toLowerCase().includes(search);
                  }
                  return true;
                })
                .map((target: any) => (
                  <div key={target.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className={`h-2 ${
                      target.type === 'individual' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      target.type === 'class' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}></div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{target.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{target.description}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            target.type === 'individual' ? 'bg-blue-100 text-blue-700' :
                            target.type === 'class' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {target.type}
                          </span>
                          <span className="mt-2 text-xs text-gray-500">
                            {target.status === 'active' && '🟢 Active'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Assigned By</p>
                          <p className="text-sm font-medium text-gray-700">{target.assignedBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Assigned To</p>
                          <p className="text-sm font-medium text-gray-700">{target.assignedTo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium text-gray-700">{target.startDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium text-gray-700">{target.dueDate}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-gray-900">{target.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              target.type === 'individual' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              target.type === 'class' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              'bg-gradient-to-r from-purple-500 to-purple-600'
                            }`}
                            style={{width: `${target.progress}%`}}
                          ></div>
                        </div>
                      </div>

                      {/* Milestones or Stats */}
                      {target.milestones && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
                          <div className="space-y-1">
                            {target.milestones.map((milestone, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                {milestone.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                )}
                                <span className={`text-sm ${milestone.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                                  {milestone.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Stats */}
                      {target.category === 'memorization' && target.totalAyahs && (
                        <div className="border-t pt-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Ayahs Completed</p>
                            <p className="text-lg font-bold text-gray-900">
                              {target.completedAyahs} / {target.totalAyahs}
                            </p>
                          </div>
                          {target.dailyTarget && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Daily Target</p>
                              <p className="text-lg font-bold text-gray-900">{target.dailyTarget} Ayahs</p>
                            </div>
                          )}
                        </div>
                      )}

                      {target.category === 'tajweed' && target.averageScore !== undefined && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Lessons</p>
                              <p className="text-lg font-bold text-gray-900">
                                {target.completedLessons} / {target.totalLessons}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Average Score</p>
                              <p className="text-lg font-bold text-gray-900">{target.averageScore}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {targetsData.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No targets found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}