import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, BookOpen, Sparkles } from 'lucide-react';

// ─── Yup Validation Schema ────────────────────────────────────────────────────
const courseSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or fewer')
    .required('Title is required'),
  description: yup
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or fewer')
    .required('Description is required'),
  category: yup
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(60, 'Category must be 60 characters or fewer')
    .required('Category is required'),
  duration: yup
    .number()
    .typeError('Duration must be a number')
    .integer('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(9999, 'Duration must be 9999 minutes or fewer')
    .required('Duration is required'),
});

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </label>
    {children}
    {error && (
      <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5" role="alert">
        {error}
      </p>
    )}
  </div>
);

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium';

const inputErrCls =
  'w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all font-medium';

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onSubmit  - (data) => Promise<void>
 * @param {object|null} props.editingCourse - null = create mode, object = edit mode
 * @param {boolean} props.isSubmitting
 * @param {string|null} props.serverError
 */
const CourseFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingCourse = null,
  isSubmitting = false,
  serverError = null,
}) => {
  const isEditMode = editingCourse != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      duration: '',
    },
  });

  // When the modal opens or the editing course changes, reset the form values
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          title: editingCourse.title ?? '',
          description: editingCourse.description ?? '',
          category: editingCourse.category ?? '',
          duration: editingCourse.duration ?? '',
        });
      } else {
        reset({ title: '', description: '', category: '', duration: '' });
      }
    }
  }, [isOpen, editingCourse, isEditMode, reset]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Course' : 'Create Course'}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        style={{ animation: 'slideUp 0.2s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {isEditMode ? 'Edit Course' : 'Create New Course'}
            </h2>
          </div>
          <button
            id="course-modal-close"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold" role="alert">
              {serverError}
            </div>
          )}

          <Field label="Course Title" error={errors.title?.message}>
            <input
              id="course-title"
              type="text"
              placeholder="e.g. Advanced Chemistry"
              className={errors.title ? inputErrCls : inputCls}
              {...register('title')}
            />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea
              id="course-description"
              placeholder="Describe what students will learn, objectives, and prerequisites..."
              className={`${errors.description ? inputErrCls : inputCls} min-h-[100px] resize-none leading-relaxed`}
              rows={4}
              {...register('description')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.category?.message}>
              <input
                id="course-category"
                type="text"
                placeholder="e.g. Mathematics"
                className={errors.category ? inputErrCls : inputCls}
                {...register('category')}
              />
            </Field>

            <Field label="Duration (minutes)" error={errors.duration?.message}>
              <input
                id="course-duration"
                type="number"
                min={1}
                max={9999}
                placeholder="e.g. 60"
                className={errors.duration ? inputErrCls : inputCls}
                {...register('duration')}
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              id="course-form-submit"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Sparkles size={15} />
              <span>{isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Publish Course')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Slide-up keyframe */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CourseFormModal;
