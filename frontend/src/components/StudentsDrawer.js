import React from 'react';
import { X, Users, Mail, Calendar, Loader2, BookOpen } from 'lucide-react';
import { useCourseStudents } from '../hooks/useTeacherCourses';

/**
 * Side drawer that lazy-loads enrolled students for a given course.
 *
 * @param {object}   props
 * @param {object|null} props.course  - course object { id, title } or null when closed
 * @param {function} props.onClose
 */
const StudentsDrawer = ({ course, onClose }) => {
  const isOpen = course != null;
  const { data: students, isLoading, isError } = useCourseStudents(course?.id ?? null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-out translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-label="Enrolled Students"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-900 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="text-indigo-500 shrink-0" size={20} />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 dark:text-white truncate">
                Enrolled Students
              </h2>
              {course && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {course.title}
                </p>
              )}
            </div>
          </div>
          <button
            id="students-drawer-close"
            onClick={onClose}
            className="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Count badge */}
        {!isLoading && !isError && students && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Users size={12} />
              {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 dark:text-slate-500">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Loading students...</span>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-rose-500">
              <span className="text-sm font-semibold">Failed to load students.</span>
              <span className="text-xs text-slate-400">Please close and try again.</span>
            </div>
          )}

          {!isLoading && !isError && students?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 dark:text-slate-500">
              <BookOpen size={36} className="text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">No students enrolled yet</p>
              <p className="text-xs text-center">Students will appear here once they enrol in this course.</p>
            </div>
          )}

          {!isLoading && !isError && students?.length > 0 && (
            <div className="space-y-3">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                >
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {student.firstName?.[0]?.toUpperCase()}{student.lastName?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Student #{idx + 1}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 pl-11">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar size={11} className="text-slate-400 shrink-0" />
                      <span>
                        Enrolled{' '}
                        {new Date(student.enrollmentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentsDrawer;
