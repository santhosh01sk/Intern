import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  Shield, Users, BookOpen, UserCheck, Award, Calendar,
  Mail, Search, Filter, Plus, Pencil, Trash2, X, Sparkles, AlertTriangle, Loader2, CheckSquare, Square
} from 'lucide-react';
import {
  Cell, Tooltip,
  ResponsiveContainer, PieChart, Pie
} from 'recharts';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab control: 'overview', 'teachers', or 'students'
  const [activeTab, setActiveTab] = useState('overview');
  // Toggle between 'categories' and 'courses' for the pie chart
  const [chartView, setChartView] = useState('categories');

  // Teachers directory states
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersSearch, setTeachersSearch] = useState('');
  const [teachersSpecializationFilter, setTeachersSpecializationFilter] = useState('all');

  // Students directory states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [deleteStudentConfirm, setDeleteStudentConfirm] = useState(null);

  // Modals & Feedback states
  const [toast, setToast] = useState(null);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null); // null = create mode
  const [deleteConfirm, setDeleteConfirm] = useState(null); // teacher object to delete
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Form states
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');

  const teacherPasswordCriteria = {
    minLength: formPassword.length >= 8,
    hasUpper: /[A-Z]/.test(formPassword),
    hasLower: /[a-z]/.test(formPassword),
    hasNumber: /[0-9]/.test(formPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(formPassword),
  };
  const isTeacherPasswordValid = Object.values(teacherPasswordCriteria).every(Boolean);

  // Fetch overview statistics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/admin/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers directory
  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const res = await api.get('/api/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Failed to load teachers list', err);
    } finally {
      setTeachersLoading(false);
    }
  };

  // Fetch students directory
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await api.get('/api/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students list', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
    } else if (activeTab === 'students') {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // ── Modal Handlers ──────────────────────────────────────────────────────────
  const openAddTeacher = () => {
    setEditingTeacher(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPassword('');
    setFormSpecialization('');
    setActionError(null);
    setTeacherModalOpen(true);
  };

  const openEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormFirstName(teacher.firstName || '');
    setFormLastName(teacher.lastName || '');
    setFormEmail(teacher.email || '');
    setFormPassword(''); // Password optional on edit
    setFormSpecialization(teacher.specialization || '');
    setActionError(null);
    setTeacherModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim()) {
      setActionError('First name, last name, and email are required fields.');
      return;
    }
    if (!editingTeacher && !formPassword.trim()) {
      setActionError('Password is required when creating a new teacher.');
      return;
    }
    if (formPassword.trim() && !isTeacherPasswordValid) {
      setActionError('Password does not meet the complexity requirements.');
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const payload = {
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      email: formEmail.trim(),
      specialization: formSpecialization.trim() || null,
      role: 'TEACHER'
    };

    if (formPassword.trim()) {
      payload.password = formPassword;
    }

    try {
      if (editingTeacher) {
        await api.put(`/api/admin/teachers/${editingTeacher.id}`, payload);
        showToast('Teacher updated successfully!', 'success');
      } else {
        await api.post('/api/admin/teachers', payload);
        showToast('Teacher profile created successfully!', 'success');
      }
      setTeacherModalOpen(false);
      fetchTeachers();
      fetchAnalytics(); // Refresh teacher total count
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.delete(`/api/admin/users/${deleteConfirm.id}`);
      showToast('Teacher profile deleted successfully.', 'success');
      setDeleteConfirm(null);
      fetchTeachers();
      fetchAnalytics();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Delete operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentConfirm) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.delete(`/api/admin/users/${deleteStudentConfirm.id}`);
      showToast('Student profile deleted successfully.', 'success');
      setDeleteStudentConfirm(null);
      fetchStudents();
      fetchAnalytics();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Delete operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 dark:text-slate-400 font-semibold animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <span>Syncing system analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-rose-500 font-semibold flex flex-col items-center justify-center gap-3 py-24">
        <AlertTriangle size={36} />
        <span>Failed to load control room telemetry. Please check backend log.</span>
      </div>
    );
  }

  // Get distinct specializations for the filter list
  const specializationsList = Array.from(
    new Set(teachers.map(t => t.specialization).filter(Boolean))
  ).sort();

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    const email = t.email.toLowerCase();
    const matchesSearch = fullName.includes(teachersSearch.toLowerCase()) || 
                          email.includes(teachersSearch.toLowerCase()) ||
                          t.courseTitles.some(title => title.toLowerCase().includes(teachersSearch.toLowerCase()));
    
    const matchesSpec = teachersSpecializationFilter === 'all' || 
                        t.specialization === teachersSpecializationFilter;

    return matchesSearch && matchesSpec;
  });

  // Filter students
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = s.email.toLowerCase();
    return fullName.includes(studentsSearch.toLowerCase()) || 
           email.includes(studentsSearch.toLowerCase());
  });


  // Recharts Chart Config
  const chartColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const popularCatData = data.popularCategories || [];
  const enrollmentsPerCourseData = data.enrollmentsPerCourse || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-amber-500" size={32} />
            <span>Admin Control Room</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System metrics, course directories, and administrative diagnostics.
          </p>
        </div>

        {/* Tab Switched Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500
              ${activeTab === 'overview'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500
              ${activeTab === 'teachers'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            Teachers Directory
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500
              ${activeTab === 'students'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            Students Directory
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* ANALYTICS OVERVIEW TAB */
        <div className="space-y-8">
          
          {/* Analytics Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Students', val: data.totalStudents, icon: <Users size={22} />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/30' },
              { label: 'Teachers', val: data.totalTeachers, icon: <UserCheck size={22} />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30' },
              { label: 'Courses', val: data.totalCourses, icon: <BookOpen size={22} />, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-100 dark:border-pink-900/30' },
              { label: 'Enrollments', val: data.totalEnrollments, icon: <Award size={22} />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/30' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {stat.label}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {stat.val}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart: Popular Categories / Enrollments (Pie) */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="text-pink-500 shrink-0" size={18} />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {chartView === 'categories' ? 'Popular Categories' : 'Enrollment Per Course'}
                  </h3>
                </div>
                {/* Switcher Button Group */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setChartView('categories')}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer focus:outline-none
                      ${chartView === 'categories'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('courses')}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer focus:outline-none
                      ${chartView === 'courses'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Per Course
                  </button>
                </div>
              </div>
              <div className="h-56 relative flex items-center justify-center">
                {chartView === 'categories' ? (
                  popularCatData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={popularCatData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="courseCount"
                          nameKey="category"
                        >
                          {popularCatData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#FFF', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-400 text-xs font-semibold">No categories recorded.</div>
                  )
                ) : (
                  enrollmentsPerCourseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={enrollmentsPerCourseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="enrollmentCount"
                          nameKey="courseTitle"
                        >
                          {enrollmentsPerCourseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#FFF', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-400 text-xs font-semibold">No course enrollments recorded.</div>
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center mt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {chartView === 'categories' ? (
                  popularCatData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span>
                      <span>{entry.category} ({entry.courseCount})</span>
                    </div>
                  ))
                ) : (
                  enrollmentsPerCourseData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span>
                      <span>{entry.courseTitle} ({entry.enrollmentCount})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activities Log */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-900">
                <Calendar className="text-pink-500" size={18} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Activity Logs</h3>
              </div>

              {data.recentEnrollments.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  No registration activity logs recorded.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-900 bg-white dark:bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-3.5 px-4 font-bold">Student</th>
                        <th className="p-3.5 px-4 font-bold">Course</th>
                        <th className="p-3.5 px-4 font-bold">Enrolled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {data.recentEnrollments.map((log, index) => (
                        <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 text-slate-700 dark:text-slate-300 transition-colors">
                          <td className="p-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{log.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              <Mail size={10} />
                              <span>{log.studentEmail}</span>
                            </div>
                          </td>
                          <td className="p-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold text-[10px] border border-pink-100 dark:border-pink-900/35">
                              {log.courseTitle}
                            </span>
                          </td>
                          <td className="p-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(log.enrollmentDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'teachers' ? (
        /* TEACHERS DIRECTORY TAB VIEW */
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search teachers by name, email, or courses..."
                value={teachersSearch}
                onChange={(e) => setTeachersSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
              />
            </div>

            {/* Specialization Filter */}
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400 shrink-0" />
              <select
                value={teachersSpecializationFilter}
                onChange={(e) => setTeachersSpecializationFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              >
                <option value="all">All Specializations</option>
                {specializationsList.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Add Teacher Trigger */}
            <button
              onClick={openAddTeacher}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Plus size={14} />
              <span>Add Teacher</span>
            </button>
          </div>

          {/* Teachers Renders */}
          {teachersLoading ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold animate-pulse flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span>Loading teachers registry...</span>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center text-slate-500 dark:text-slate-400">
              <Users size={36} className="mx-auto text-slate-350 dark:text-slate-800 mb-3" />
              <p className="font-semibold">No teachers found matching your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try updating filters or add a new teacher.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4 px-5 font-bold">Instructor</th>
                    <th className="p-4 px-5 font-bold">Email</th>
                    <th className="p-4 px-5 font-bold">Specialization</th>
                    <th className="p-4 px-5 font-bold">Courses Taught</th>
                    <th className="p-4 px-5 font-bold">Total Students</th>
                    <th className="p-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 text-slate-700 dark:text-slate-300 transition-colors group">
                      <td className="p-4 px-5 font-bold text-slate-900 dark:text-white">
                        <span className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-100 dark:border-emerald-900/20">
                            {teacher.firstName.charAt(0)}
                          </span>
                          <span>{teacher.firstName} {teacher.lastName}</span>
                        </span>
                      </td>
                      <td className="p-4 px-5 font-medium">
                        <span className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" />
                          <span>{teacher.email}</span>
                        </span>
                      </td>
                      <td className="p-4 px-5 font-bold">
                        {teacher.specialization ? (
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30">
                            {teacher.specialization}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 px-5">
                        {teacher.courseTitles.length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500 italic">None created yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {teacher.courseTitles.map((title, idx) => (
                              <span key={idx} className="inline-flex px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-450 border border-slate-200 dark:border-slate-800 font-medium text-[9px] truncate max-w-[120px]">
                                {title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 px-5 font-bold text-slate-900 dark:text-white text-sm">
                        {teacher.totalStudents}
                      </td>
                      <td className="p-4 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => openEditTeacher(teacher)}
                            title="Edit teacher"
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer focus:outline-none"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => { setDeleteConfirm(teacher); setActionError(null); }}
                            title="Delete teacher"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer focus:outline-none"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* STUDENTS DIRECTORY TAB VIEW */
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentsSearch}
                onChange={(e) => setStudentsSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Students Renders */}
          {studentsLoading ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold animate-pulse flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span>Loading student directory...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center text-slate-500 dark:text-slate-400">
              <Users size={36} className="mx-auto text-slate-350 dark:text-slate-800 mb-3" />
              <p className="font-semibold">No students found matching search filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4 px-5 font-bold">Student</th>
                    <th className="p-4 px-5 font-bold">Email Address</th>
                    <th className="p-4 px-5 font-bold">Status</th>
                    <th className="p-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 text-slate-700 dark:text-slate-300 transition-colors group">
                      <td className="p-4 px-5 font-bold text-slate-900 dark:text-white">
                        <span className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-100 dark:border-indigo-900/20">
                            {student.firstName.charAt(0)}
                          </span>
                          <span>{student.firstName} {student.lastName}</span>
                        </span>
                      </td>
                      <td className="p-4 px-5 font-medium">
                        <span className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" />
                          <span>{student.email}</span>
                        </span>
                      </td>
                      <td className="p-4 px-5 font-bold">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          student.emailVerified 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20' 
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
                        }`}>
                          {student.emailVerified ? 'Verified' : 'Under Verification'}
                        </span>
                      </td>
                      <td className="p-4 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Delete */}
                          <button
                            onClick={() => { setDeleteStudentConfirm(student); setActionError(null); }}
                            title="Delete student"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer focus:outline-none"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Teacher Modal ── */}
      {teacherModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setTeacherModalOpen(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-2">
                <UserCheck className="text-emerald-500" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingTeacher ? 'Edit Teacher Profile' : 'Create Teacher Profile'}
                </h2>
              </div>
              <button
                onClick={() => setTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="px-6 py-5 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {actionError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold" role="alert">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password {editingTeacher && <span className="text-[10px] text-slate-400 font-normal lowercase">(leave empty to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required={!editingTeacher}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
                {(!editingTeacher || formPassword.length > 0) && (
                  <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs transition-all">
                    <span className="block font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Password Requirements:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        { key: 'minLength', label: 'Min 8 characters' },
                        { key: 'hasUpper', label: '1 uppercase letter' },
                        { key: 'hasLower', label: '1 lowercase letter' },
                        { key: 'hasNumber', label: '1 number' },
                        { key: 'hasSpecial', label: '1 special character' }
                      ].map((crit) => {
                        const met = teacherPasswordCriteria[crit.key];
                        return (
                          <div
                            key={crit.key}
                            className={`flex items-center gap-2 font-semibold transition-colors duration-200 ${
                              met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'
                            }`}
                          >
                            {met ? (
                              <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Square size={14} className="text-slate-400 dark:text-slate-650 shrink-0" />
                            )}
                            <span>{crit.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Specialization / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Mathematics"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTeacherModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer disabled:opacity-60 text-xs"
                >
                  <Sparkles size={14} />
                  <span>{submitting ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Create Teacher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm space-y-4 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/40 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Remove Teacher?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirm.firstName} {deleteConfirm.lastName}</span> will be permanently deleted from the directory. This cannot be undone.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2" role="alert">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setActionError(null); }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeacher}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-60 shadow-lg shadow-rose-600/15 text-xs"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{submitting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Student Confirm Modal ── */}
      {deleteStudentConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm space-y-4 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/40 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Remove Student?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{deleteStudentConfirm.firstName} {deleteStudentConfirm.lastName}</span> will be permanently deleted from the database along with all their course enrollments. This cannot be undone.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2" role="alert">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteStudentConfirm(null); setActionError(null); }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-60 shadow-lg shadow-rose-600/15 text-xs"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{submitting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Up Transition Keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

