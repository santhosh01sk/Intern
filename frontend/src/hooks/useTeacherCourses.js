import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../utils/api';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const teacherCourseKeys = {
  all: ['teacherCourses'],
  list: (params) => ['teacherCourses', 'list', params],
  students: (courseId) => ['teacherCourses', 'students', courseId],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Paginated, filtered, sortable list of the teacher's own courses.
 * @param {object} params - { page, size, search, category, sortBy, sortOrder }
 */
export function useTeacherCourses(params) {
  return useQuery({
    queryKey: teacherCourseKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/api/courses', { params });
      return data; // TeacherCoursePageResponse
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Lazy-loaded enrolled students for a specific course.
 * Only fires when `courseId` is non-null.
 */
export function useCourseStudents(courseId) {
  return useQuery({
    queryKey: teacherCourseKeys.students(courseId),
    queryFn: async () => {
      const { data } = await api.get(`/api/teacher/courses/${courseId}/students`);
      return data; // List<EnrolledStudentInfo>
    },
    enabled: courseId != null,
    staleTime: 60_000,
  });
}

/** Create a new course. Invalidates the list on success. */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/api/courses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherCourseKeys.all });
    },
  });
}

/** Update an existing course. Invalidates the list on success. */
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/api/courses/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherCourseKeys.all });
    },
  });
}

/** Delete a course. Invalidates the list on success. */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherCourseKeys.all });
    },
  });
}
