import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  BookOpen, Send, Users, User, MessageSquare, 
  Hash, Loader2, RefreshCw 
} from 'lucide-react';
import Toast from '../components/Toast';

const Chat = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // States
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Channels
  const [activeChannel, setActiveChannel] = useState(null); // { type: 'group' | 'direct', id?: Long, name: String }
  const [students, setStudents] = useState([]); // Enrolled students (for Teacher DM selection)
  
  // Chat Data
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Toast notifications
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
          const res = await api.get('/api/teacher/courses', {
            params: { page: 0, size: 100 }
          });
          setCourses(res.data?.courses || []);
        } else if (user.role === 'STUDENT') {
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

  // 2. Fetch enrolled students if user is a Teacher and a Course is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse || user.role !== 'TEACHER') return;
      setLoadingStudents(true);
      try {
        const res = await api.get(`/api/courses/${selectedCourse.id}/chats/students`);
        setStudents(res.data || []);
      } catch (err) {
        showToast('Failed to load students roster for this course.', 'error');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
    setActiveChannel(null);
    setMessages([]);
  }, [selectedCourse, user]);

  // 3. Set default channel when course is selected (e.g. Group Chat)
  useEffect(() => {
    if (selectedCourse) {
      setActiveChannel({ type: 'group', name: 'Group Discussion' });
    } else {
      setActiveChannel(null);
    }
  }, [selectedCourse]);

  // 4. Fetch messages function
  const fetchMessages = async (silent = false) => {
    if (!selectedCourse || !activeChannel) return;
    if (!silent) setLoadingMessages(true);
    
    try {
      let url = '';
      if (activeChannel.type === 'group') {
        url = `/api/courses/${selectedCourse.id}/chats/group`;
      } else if (activeChannel.type === 'direct') {
        if (user.role === 'STUDENT') {
          url = `/api/courses/${selectedCourse.id}/chats/direct`;
        } else if (user.role === 'TEACHER') {
          url = `/api/courses/${selectedCourse.id}/chats/direct/${activeChannel.id}`;
        }
      }

      if (url) {
        const res = await api.get(url);
        setMessages(res.data || []);
      }
    } catch (err) {
      if (!silent) {
        showToast('Failed to synchronize chat messages.', 'error');
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // 5. Fetch messages when active channel changes
  useEffect(() => {
    fetchMessages(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel, selectedCourse]);

  // 6. Polling interval for live updates (polls every 3 seconds)
  useEffect(() => {
    if (!selectedCourse || !activeChannel) return;
    
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel, selectedCourse]);

  // 7. Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 8. Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedCourse || !activeChannel) return;

    setSending(true);
    try {
      let url = '';
      if (activeChannel.type === 'group') {
        url = `/api/courses/${selectedCourse.id}/chats/group`;
      } else if (activeChannel.type === 'direct') {
        if (user.role === 'STUDENT') {
          url = `/api/courses/${selectedCourse.id}/chats/direct`;
        } else if (user.role === 'TEACHER') {
          url = `/api/courses/${selectedCourse.id}/chats/direct/${activeChannel.id}`;
        }
      }

      if (url) {
        const payload = { content: messageInput.trim() };
        const res = await api.post(url, payload);
        // Append sent message instantly, then clear input
        setMessages((prev) => [...prev, res.data]);
        setMessageInput('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const getChannelDisplayName = () => {
    if (!activeChannel) return '';
    return activeChannel.name;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn h-[calc(100vh-6rem)] flex flex-col">
      {/* Toast alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Class Discussions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Resolve doubts directly with teachers or chat collectively inside group channels.
          </p>
        </div>
      </div>

      {/* Main Split Chat Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 items-stretch">
        
        {/* Left Sidebar: Course list + Channel List */}
        <div className="w-full md:w-80 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm shrink-0 min-h-[250px] md:min-h-0">
          
          {/* Course select wrapper */}
          <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-900">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <BookOpen size={12} />
              <span>Select Course</span>
            </label>
            
            {loadingCourses ? (
              <div className="py-2 text-center text-xs text-slate-400 animate-pulse font-semibold">
                Loading academic catalogs...
              </div>
            ) : courses.length === 0 ? (
              <div className="py-2 text-center text-[10px] text-slate-450 dark:text-slate-650">
                No active courses registered.
              </div>
            ) : (
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const c = courses.find((course) => course.id === selectedId);
                  setSelectedCourse(c || null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="" disabled>-- Choose Academic Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Channels Directory */}
          {selectedCourse && (
            <div className="flex-1 flex flex-col min-h-0 pt-4 space-y-4">
              
              {/* Group channels */}
              <div className="space-y-1.5 shrink-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1 px-1">
                  <Hash size={11} />
                  <span>Group Rooms</span>
                </p>
                <button
                  onClick={() => setActiveChannel({ type: 'group', name: 'Group Discussion' })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left
                    ${activeChannel?.type === 'group'
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                >
                  <Users size={14} />
                  <span>Group Discussion</span>
                </button>
              </div>

              {/* Direct channels / Doubt Rooms */}
              <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1 px-1 shrink-0">
                  <User size={11} />
                  <span>Doubt Rooms</span>
                </p>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                  {user.role === 'STUDENT' ? (
                    /* Students can only doubt-chat with the teacher of the selected course */
                    <button
                      onClick={() => setActiveChannel({ 
                        type: 'direct', 
                        id: selectedCourse.teacherId, // Wait, teacher id might not be teacherId directly. Let's make sure we find it.
                        name: `Doubt Room: ${selectedCourse.teacherName}` 
                      })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left
                        ${activeChannel?.type === 'direct'
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                    >
                      <User size={14} />
                      <div className="truncate">
                        <p className="truncate font-extrabold">{selectedCourse.teacherName}</p>
                        <p className="text-[9px] text-slate-400">Instructor</p>
                      </div>
                    </button>
                  ) : (
                    /* Teachers see list of students enrolled in the course to chat with */
                    loadingStudents ? (
                      <div className="py-4 text-center text-[10px] text-slate-400 animate-pulse font-semibold">
                        Fetching students list...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="py-4 text-center text-[10px] text-slate-450 dark:text-slate-600 px-2 leading-relaxed">
                        No students enrolled in this course yet.
                      </div>
                    ) : (
                      students.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setActiveChannel({
                            type: 'direct',
                            id: student.id,
                            name: `Doubt Room: ${student.firstName} ${student.lastName}`
                          })}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left
                            ${activeChannel?.type === 'direct' && activeChannel.id === student.id
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                        >
                          <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-extrabold">{student.firstName} {student.lastName}</p>
                            <p className="text-[9px] text-slate-400 truncate">{student.email}</p>
                          </div>
                        </button>
                      ))
                    )
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Panel: Chat Room Box */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-w-0 min-h-[400px] md:min-h-0">
          {!selectedCourse || !activeChannel ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-4">
              <MessageSquare size={48} className="text-slate-200 dark:text-slate-850 animate-bounce-slow" />
              <div>
                <p className="font-semibold text-sm">Welcome to Discussion Board</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 max-w-sm">
                  Select a course and double-click a discussion room or direct chat room in the directory to start messaging.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Active Channel Header */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeChannel.type === 'group' ? (
                    <Users className="text-indigo-500" size={16} />
                  ) : (
                    <User className="text-emerald-500" size={16} />
                  )}
                  <h2 className="text-sm font-extrabold text-slate-850 dark:text-white truncate">
                    {getChannelDisplayName()}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchMessages(false)}
                    disabled={loadingMessages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                    title="Force sync messages"
                  >
                    <RefreshCw size={12} className={loadingMessages ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Message Display Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
                {loadingMessages && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse font-semibold">
                    Fetching discussion transcripts...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-slate-450 dark:text-slate-650 space-y-2">
                    <MessageSquare size={32} className="text-slate-200 dark:text-slate-900" />
                    <p className="font-semibold text-xs">Beginning of conversation</p>
                    <p className="text-[10px] max-w-[200px]">
                      Send a message to start discussion history inside this channel.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.senderId === user.id;
                    const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender name for other users in group chats */}
                        {activeChannel.type === 'group' && !isOwnMessage && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 ml-1">
                            {msg.senderName}
                          </span>
                        )}
                        
                        <div className="max-w-[75%] flex flex-col space-y-0.5">
                          {/* Chat Bubble */}
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm
                              ${isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                              }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          
                          {/* Timestamp */}
                          <span className={`text-[8px] font-bold text-slate-400 dark:text-slate-650 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}>
                            {msgTime}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 shrink-0 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your message or doubt..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                  disabled={sending}
                />
                
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  title="Send Message"
                >
                  {sending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </form>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;
