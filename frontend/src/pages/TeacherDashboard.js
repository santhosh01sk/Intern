import React, { useState, useCallback, useRef } from 'react';
import {
  BookOpen, Users, Pencil, ChevronUp, ChevronDown,
  ChevronsUpDown, Search, Filter, ChevronLeft, ChevronRight, Clock,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { useNavigate } from 'react-router-dom';
import StudentsDrawer from '../components/StudentsDrawer';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef(null);
  const update = useCallback(
    (v) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDebounced(v), delay);
    },
    [delay]
  );
  return [debounced, update];
}

const PAGE_SIZE = 10;

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <ChevronsUpDown size={13} className="text-slate-400 opacity-50" />;
  return sortOrder === 'asc'
    ? <ChevronUp size={13} className="text-emerald-500" />
    : <ChevronDown size={13} className="text-emerald-500" />;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const navigate = useNavigate();

  // Query params
  const [page, setPage]     = useState(0);
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useDebounce('');

  // UI state
  const [drawerCourse, setDrawerCourse] = useState(null);

  // ── React Query ──────────────────────────────────────────────────────────
  const queryParams = {
    page,
    size: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isError, isFetching, refetch } = useTeacherCourses(queryParams);

  const courses      = data?.courses        ?? [];
  const totalPages   = data?.totalPages     ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const categories   = data?.categories     ?? [];

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0);
  };

  // ── Search handler ───────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchInput(v);
    setDebouncedSearch(v);
    setPage(0);
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledCount ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Teacher Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View your list of courses, see enrollment statistics, and track student registration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm flex items-center gap-3">
            <BookOpen className="text-emerald-500" size={20} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Courses</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">{totalElements}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm flex items-center gap-3">
            <Users className="text-indigo-500" size={20} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Page Enrolled</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">{totalEnrolled}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            id="course-search"
            type="text"
            placeholder="Search by title or category..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Refresh */}
        <button
          id="refresh-courses-btn"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

        {/* Table container always visible */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {[
                  { key: 'title',        label: 'Course Title' },
                  { key: 'category',     label: 'Category' },
                  { key: 'duration',     label: 'Duration' },
                  { key: 'enrolledCount',label: 'Enrolled' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      <SortIcon field={key} sortBy={sortBy} sortOrder={sortOrder} />
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {/* Title & Description skeleton */}
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-900/60 rounded w-1/2"></div>
                    </td>
                    {/* Category skeleton */}
                    <td className="px-5 py-4">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16"></div>
                    </td>
                    {/* Duration skeleton */}
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
                    </td>
                    {/* Enrolled skeleton */}
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
                    </td>
                    {/* Actions skeleton */}
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded-lg w-24 inline-block"></div>
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <AlertTriangle size={32} className="text-rose-400" />
                      <p className="text-sm font-semibold text-rose-500">Failed to load courses.</p>
                      <button
                        onClick={() => refetch()}
                        className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                      <BookOpen size={36} className="text-slate-300 dark:text-slate-700" />
                      <p className="font-semibold text-sm">No courses found</p>
                      <p className="text-xs">Adjust your search or category filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors group"
                  >
                    {/* Title */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 dark:text-white">{course.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                        {course.description}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {course.category || '—'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Clock size={13} className="text-slate-400" />
                        {course.duration != null ? `${course.duration} min` : '—'}
                      </span>
                    </td>

                    {/* Enrolled */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                        course.enrolledCount > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <Users size={13} />
                        {course.enrolledCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Students */}
                        <button
                          id={`view-students-${course.id}`}
                          onClick={() => setDrawerCourse(course)}
                          title="View enrolled students"
                          className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <Users size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page <span className="font-bold text-slate-700 dark:text-slate-300">{page + 1}</span> of{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{totalPages}</span>
              {' '}·{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{totalElements}</span> courses
            </p>

            <div className="flex items-center gap-1">
              <button
                id="page-prev-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
                const showPage =
                  p === 0 ||
                  p === totalPages - 1 ||
                  Math.abs(p - page) <= 1;
                const showEllipsisAfter =
                  p === 0 && page > 2;
                const showEllipsisBefore =
                  p === totalPages - 1 && page < totalPages - 3;

                if (!showPage && !showEllipsisAfter && !showEllipsisBefore) return null;
                if (showEllipsisAfter) return (
                  <React.Fragment key={`e-${p}`}>
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        p === page
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >{p + 1}</button>
                    <span className="text-slate-400 text-xs px-1">…</span>
                  </React.Fragment>
                );
                if (showEllipsisBefore) return (
                  <React.Fragment key={`e-${p}`}>
                    <span className="text-slate-400 text-xs px-1">…</span>
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        p === page
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >{p + 1}</button>
                  </React.Fragment>
                );
                return (
                  <button
                    key={p}
                    id={`page-btn-${p}`}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      p === page
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {p + 1}
                  </button>
                );
              })}

              <button
                id="page-next-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit button at the bottom of the listed courses */}
      {!isLoading && !isError && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Pencil size={15} />
            <span>Edit Courses</span>
          </button>
        </div>
      )}

      {/* ── Modals & Drawers ────────────────────────────────────────────── */}

      {/* Students Drawer */}
      <StudentsDrawer
        course={drawerCourse}
        onClose={() => setDrawerCourse(null)}
      />
    </div>
  );
};


export default TeacherDashboard;
