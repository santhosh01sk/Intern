import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  BookOpen, PlusCircle, Search, Compass, ArrowUpDown,
  Filter, ChevronLeft, ChevronRight, User, Save, AlertTriangle, Trash2, Pencil
} from 'lucide-react';
import Toast from '../components/Toast';

// Search validation schema
const searchSchema = yup.object().shape({
  search: yup.string().max(50, 'Search keyword is too long'),
  category: yup.string().default('all'),
  sortBy: yup.string().default('title'),
  sortOrder: yup.string().default('asc')
});

// Profile validation schema
const profileSchema = yup.object().shape({
  firstName: yup.string().required('First name is required').min(2, 'Must be at least 2 chars'),
  lastName: yup.string().required('Last name is required').min(2, 'Must be at least 2 chars'),
  email: yup.string().required('Email is required').email('Must be a valid email address')
});

const StudentDashboard = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [page, setPage] = useState(0);

  const [toast, setToast] = useState(null);

  // Modal states for action confirmations
  const [confirmEnrollId, setConfirmEnrollId] = useState(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);

  // React Hook Form for Search & Filters
  const { register: registerSearch, watch } = useForm({
    resolver: yupResolver(searchSchema),
    defaultValues: {
      search: '',
      category: 'all',
      sortBy: 'title',
      sortOrder: 'asc'
    }
  });

  const watchSearch = watch('search');
  const watchCategory = watch('category');
  const watchSortBy = watch('sortBy');
  const watchSortOrder = watch('sortOrder');

  // Debounced search term to avoid excessive API requests
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(watchSearch);
    }, 350);
    return () => clearTimeout(handler);
  }, [watchSearch]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, watchCategory, watchSortBy, watchSortOrder]);

  // Query: Fetch paginated course list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', page, debouncedSearch, watchCategory, watchSortBy, watchSortOrder],
    queryFn: async () => {
      const res = await api.get('/api/courses', {
        params: {
          page,
          size: 6,
          search: debouncedSearch,
          category: watchCategory === 'all' ? '' : watchCategory,
          sortBy: watchSortBy,
          sortOrder: watchSortOrder
        }
      });
      return res.data;
    }
  });

  // Query: Fetch all courses to extract enrolled list globally
  const { data: allCoursesData } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get('/api/student/courses');
      return res.data;
    }
  });

  const myEnrollments = allCoursesData ? allCoursesData.filter(c => c.enrolled) : [];

  // React Hook Form for User Profile updates
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    }
  });

  // Sync profile form values if user object shifts
  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user, resetProfile]);

  // Helper function to trigger toast messages
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // Mutation: Register Course
  const enrollMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await api.post('/api/enrolments/enroll', { courseId });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      showToast(resData.message || 'Successfully enrolled!', 'success');
      setConfirmEnrollId(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to enroll', 'error');
      setConfirmEnrollId(null);
    }
  });

  // Mutation: Withdraw Course
  const withdrawMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await api.post('/api/enrolments/withdraw', { courseId });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      showToast(resData.message || 'Successfully withdrawn!', 'success');
      setConfirmWithdrawId(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to withdraw', 'error');
      setConfirmWithdrawId(null);
    }
  });

  // Mutation: Update Profile Details
  const profileMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.put('/api/student/profile', formData);
      return res.data;
    },
    onSuccess: (resData, variables) => {
      updateUser(variables);
      if (isEditing) {
        setIsEditing(false);
      }
      else{
        setIsEditing(true);
      }
      showToast(resData.message || 'Profile updated successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  });

  const onProfileSubmit = (formData) => {
    profileMutation.mutate(formData);
  };

  // Find course details for modals
  const activeEnrollTarget = allCoursesData?.find(c => c.id === confirmEnrollId);
  const activeWithdrawTarget = allCoursesData?.find(c => c.id === confirmWithdrawId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal: ENROLL */}
      {confirmEnrollId && activeEnrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Compass size={24} className="animate-spin-slow" />
              <h3 className="text-base font-extrabold tracking-tight">Confirm Enrollment</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to register for <strong>{activeEnrollTarget.title}</strong>? You will be added to the student roster.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmEnrollId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => enrollMutation.mutate(confirmEnrollId)}
                disabled={enrollMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer focus:outline-none disabled:opacity-50"
              >
                {enrollMutation.isPending ? 'Registering...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: WITHDRAW */}
      {confirmWithdrawId && activeWithdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle size={24} />
              <h3 className="text-base font-extrabold tracking-tight">Withdraw from Course</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to withdraw from <strong>{activeWithdrawTarget.title}</strong>? This will remove your record from the catalog and roster.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmWithdrawId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => withdrawMutation.mutate(confirmWithdrawId)}
                disabled={withdrawMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md cursor-pointer focus:outline-none disabled:opacity-50"
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover catalog classes, manage profiles, and review enrollments
          </p>
        </div>

        {/* Quick Stats Panel */}
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm flex items-center gap-3">
            <Compass className="text-indigo-500" size={20} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Catalog Size</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">
                {data?.totalElements || 0} Courses
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm flex items-center gap-3">
            <BookOpen className="text-emerald-500" size={20} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Enrolled</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">{myEnrollments.length} Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left 2 Columns: Catalog List & Search/Filters */}
        <div className="lg:col-span-2 space-y-6">

          {/* Controls Bar (Search Form) */}
          <form className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search by title, category, or teacher..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition-all font-medium"
                {...registerSearch('search')}
              />
            </div>

            {/* Filter and Sort controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">

              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Filter size={10} />
                  <span>Category</span>
                </label>
                <select
                  {...registerSearch('category')}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="all">All Categories</option>
                  {data?.categories?.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort By Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <ArrowUpDown size={10} />
                  <span>Sort By</span>
                </label>
                <select
                  {...registerSearch('sortBy')}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="title">Course Title</option>
                  <option value="category">Category</option>
                  <option value="teacher">Instructor</option>
                </select>
              </div>

            </div>

          </form>

          {/* Catalog Section Header */}
          <div className="flex items-center gap-2">
            <Compass className="text-indigo-600 dark:text-indigo-400" size={22} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Course Catalog
            </h2>
            {data && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full ml-1">
                {data.totalElements} results
              </span>
            )}
          </div>

          {/* Catalog Renders */}
          {isLoading ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold animate-pulse">
              Syncing catalog databases...
            </div>
          ) : isError ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-12 text-center text-rose-500">
              <AlertTriangle className="mx-auto mb-3" size={32} />
              <p className="font-bold">Telemetry Sync Failure</p>
              <p className="text-xs text-slate-400 mt-1">Check database ports or re-auth.</p>
            </div>
          ) : data.courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center text-slate-500 dark:text-slate-400">
              <Compass size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-semibold">No courses match your criteria</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting search parameters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.courses.map(course => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-bold text-[9px] uppercase tracking-wider">
                          {course.category || 'General'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase tracking-tight shrink-0">
                          {course.teacherName.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                          {course.teacherName}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {course.enrolled ? (
                          <button
                            onClick={() => setConfirmWithdrawId(course.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Withdraw</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmEnrollId(course.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white dark:text-indigo-100 text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <PlusCircle size={12} />
                            <span>Register</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Page {page + 1} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, data.totalPages - 1))}
                    disabled={page === data.totalPages - 1}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column Sidebar panels */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">

          {/* Edit Profile Form Panel */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <User size={16} className="text-indigo-500" />
                <span>Profile Details</span>
              </h2>
            </div>

            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-3.5">

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                  placeholder="John"
                  {...registerProfile('firstName')}
                  disabled={!isEditing}
                />

                {profileErrors.firstName && (
                  <p className="text-[10px] text-rose-500 font-bold">{profileErrors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                  placeholder="Doe"
                  {...registerProfile('lastName')}
                  disabled={!isEditing}
                />
                {profileErrors.lastName && (
                  <p className="text-[10px] text-rose-500 font-bold">{profileErrors.lastName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                  placeholder="student@example.com"
                  {...registerProfile('email')}
                  disabled={true}
                />
                {profileErrors.email && (
                  <p className="text-[10px] text-rose-500 font-bold">{profileErrors.email.message}</p>
                )}
              </div>


              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        resetProfile({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email
                        });
                      }
                    }}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{profileMutation.isPending ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <Pencil size={14} />
                  <span>Edit Profile</span>
                </button>
              )}


            </form>
          </div>

          {/* Sticky Enrollments Panel */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-900">
              <BookOpen className="text-emerald-500" size={18} />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                My Enrollments
              </h2>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full ml-auto">
                {myEnrollments.length} Active
              </span>
            </div>

            {myEnrollments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <BookOpen size={24} className="mx-auto text-slate-200 dark:text-slate-800" />
                <p className="text-xs font-semibold">No active courses yet</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-normal max-w-[200px] mx-auto">
                  Select a class from the catalog to enroll.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {myEnrollments.map(course => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900/60 rounded-xl hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                          {course.teacherName}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setConfirmWithdrawId(course.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none shrink-0"
                      aria-label={`Withdraw from ${course.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
