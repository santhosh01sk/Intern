import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  BookOpen, UploadCloud, Trash2, Download, FileText, 
  AlertCircle, ChevronRight, Loader2 
} from 'lucide-react';
import Toast from '../components/Toast';

const Materials = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // States
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Upload States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // UI Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // 1. Fetch courses depending on user role
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        if (user.role === 'TEACHER') {
          // Fetch teacher's courses (all of them)
          const res = await api.get('/api/teacher/courses', {
            params: { page: 0, size: 100 }
          });
          setCourses(res.data?.courses || []);
        } else if (user.role === 'STUDENT') {
          // Fetch student's enrolled courses
          const res = await api.get('/api/student/courses');
          const enrolled = res.data ? res.data.filter(c => c.enrolled) : [];
          setCourses(enrolled);
        }
      } catch (err) {
        showToast('Failed to fetch courses.', 'error');
      } finally {
        setLoadingCourses(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  // 2. Fetch materials when a course is selected
  const fetchMaterials = async (courseId) => {
    setLoadingMaterials(true);
    try {
      const res = await api.get(`/api/courses/${courseId}/materials`);
      setMaterials(res.data || []);
    } catch (err) {
      showToast('Failed to fetch materials for this course.', 'error');
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse.id);
    } else {
      setMaterials([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  // 3. Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      showToast('Please select a course first.', 'error');
      return;
    }
    if (!uploadTitle.trim()) {
      showToast('Please enter a title for the material.', 'error');
      return;
    }
    if (!uploadFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', uploadTitle.trim());
    formData.append('file', uploadFile);

    setUploading(true);
    try {
      await api.post(`/api/courses/${selectedCourse.id}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Material uploaded successfully!', 'success');
      setUploadTitle('');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMaterials(selectedCourse.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload material.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 4. Handle file download
  const handleDownload = async (material) => {
    try {
      showToast(`Starting download: ${material.fileName}`, 'success');
      const response = await api.get(`/api/courses/${selectedCourse.id}/materials/${material.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: material.contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Failed to download material.', 'error');
    }
  };

  // 5. Handle file delete
  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this course material?')) {
      return;
    }
    try {
      await api.delete(`/api/courses/${selectedCourse.id}/materials/${materialId}`);
      showToast('Material deleted successfully!', 'success');
      fetchMaterials(selectedCourse.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete material.', 'error');
    }
  };


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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Course Materials
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user.role === 'TEACHER' 
              ? 'Upload and manage course curriculum materials, slide decks, and worksheets.' 
              : 'Access notes, resources, and study files uploaded by your instructors.'}
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Course Selector List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <span>Select Course</span>
            </h2>

            {loadingCourses ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse font-semibold">
                Loading academic catalogs...
              </div>
            ) : courses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <AlertCircle size={24} className="mx-auto text-slate-200 dark:text-slate-800" />
                <p className="font-semibold">No active courses registered</p>
                <p className="text-[10px] leading-relaxed">
                  {user.role === 'TEACHER'
                    ? 'Create a course from the course editor first.'
                    : 'Register for an available course offered in the dashboard catalog.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-semibold
                        ${isSelected 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-800'
                        }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate font-extrabold">{course.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {user.role === 'TEACHER' ? course.category : course.teacherName}
                        </p>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Materials List & Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedCourse ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 space-y-4">
              <BookOpen size={48} className="mx-auto text-slate-200 dark:text-slate-850 animate-bounce-slow" />
              <div>
                <p className="font-semibold text-sm">No Course Selected</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                  Choose a course from the sidebar to view documents or upload materials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Selected Course Meta Banner */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 dark:from-indigo-950/20 dark:to-emerald-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Instructor: <span className="font-semibold">{user.role === 'TEACHER' ? `${user.firstName} ${user.lastName} (You)` : selectedCourse.teacherName}</span>
                </p>
              </div>

              {/* Upload panel for teacher */}
              {user.role === 'TEACHER' && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                    <UploadCloud size={16} className="text-emerald-500" />
                    <span>Upload New Material</span>
                  </h3>
                  
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Document Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Document Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Lecture 1 Slides, Homework 3 PDF..."
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                        />
                      </div>

                      {/* File Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Select File
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 hover:border-slate-300 transition-all cursor-pointer text-left truncate"
                          >
                            {uploadFile ? uploadFile.name : 'Choose file...'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading File...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} />
                            <span>Upload Material</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Materials list */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  <span>Curriculum Resources</span>
                </h3>

                {loadingMaterials ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse font-semibold">
                    Fetching course curriculum files...
                  </div>
                ) : materials.length === 0 ? (
                  <div className="py-12 text-center text-slate-450 dark:text-slate-500 space-y-2">
                    <FileText size={32} className="mx-auto text-slate-200 dark:text-slate-900" />
                    <p className="font-semibold text-xs">No materials uploaded yet</p>
                    <p className="text-[10px]">
                      {user.role === 'TEACHER' 
                        ? 'Use the upload panel above to publish study materials.'
                        : 'Your instructor has not uploaded any study resources for this course yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-900">
                    {materials.map((m) => (
                      <div key={m.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 group">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                              {m.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {m.fileName} · Uploaded {new Date(m.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDownload(m)}
                            title="Download resource"
                            className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                          
                          {user.role === 'TEACHER' && (
                            <button
                              onClick={() => handleDelete(m.id)}
                              title="Delete resource"
                              className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-450 transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Materials;
