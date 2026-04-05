import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, type User } from '../store/authStore';
import { 
  User as UserIcon, Mail, Clock, Calendar, Shield, Save, MessageCircle, ArrowLeft, BookOpen, Plus, Trash, Globe, MapPin, CheckCircle, Trophy, Star, Users, TrendingUp, Activity, ChevronRight, Phone, GraduationCap, Award, Book, Briefcase
} from 'lucide-react';
import { API_BASE } from '../lib/api';
import { StatCard } from '../components/Dashboard/StatCard';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  
  // Student fields
  const [editMajor, setEditMajor] = useState('');
  const [editLevel, setEditLevel] = useState('Undergraduate');
  const [editGraduationYear, setEditGraduationYear] = useState('');
  
  // Professor fields
  const [editDepartment, setEditDepartment] = useState('');
  const [editExpertise, setEditExpertise] = useState('');
  const [editRank, setEditRank] = useState('');
  const [editOfficeLocation, setEditOfficeLocation] = useState('');
  const [editOfficeHours, setEditOfficeHours] = useState<any[]>([]);
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editZoomEnabled, setEditZoomEnabled] = useState(true);
  const [editInPersonEnabled, setEditInPersonEnabled] = useState(true);
  
  const [saved, setSaved] = useState(false);

  // Meeting request state for students
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingNote, setMeetingNote] = useState('');
  const [meetingSlot, setMeetingSlot] = useState('');
  const [meetingType] = useState<'Zoom' | 'In-person'>('Zoom');
  const [meetingRequested, setMeetingRequested] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const viewUserId = userId || currentUser?.id;

  useEffect(() => {
    if (!viewUserId) return;
    document.title = profileUser ? `${profileUser.name} | Profile` : 'Profile | LearnPulse';
    
    const initProfile = (data: User) => {
      setProfileUser(data);
      setEditName(data.name);
      setEditEmail(data.email || '');
      setEditPhone(data.phone_number || '');
      setEditBio(data.bio || '');
      
      if (data.role === 'student' && data.student) {
        setEditMajor(data.student.major);
        setEditLevel(data.student.level);
        setEditGraduationYear(data.student.graduation_year?.toString() || '');
      } else if (data.role === 'professor' && data.professor) {
        setEditDepartment(data.professor.department);
        setEditExpertise(data.professor.expertise);
        setEditRank(data.professor.academic_rank);
        setEditOfficeLocation(data.professor.office_location);
        setEditMeetingLink(data.professor.meeting_link);
        setEditZoomEnabled(data.professor.zoom_enabled !== false);
        setEditInPersonEnabled(data.professor.in_person_enabled !== false);
        try {
          setEditOfficeHours(JSON.parse(data.professor.office_hours || '[]'));
        } catch {
          setEditOfficeHours([]);
        }
      }
    };

    if (isOwnProfile && currentUser) {
      initProfile(currentUser);
    } else {
      setLoading(true);
      fetch(`${API_BASE}/api/profile/${viewUserId}`)
        .then(r => r.json())
        .then(data => {
          initProfile(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [viewUserId, isOwnProfile, currentUser]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-black tracking-widest text-xs uppercase animate-pulse">Synchronizing Data...</p>
    </div>
  );
  
  if (!profileUser) return <div className="text-center py-20 text-gray-500 font-medium font-black uppercase tracking-widest">Profile not found.</div>;

  const officeHoursParsed = profileUser.professor?.office_hours ? (() => {
    try { return JSON.parse(profileUser.professor.office_hours); } catch { return []; }
  })() : [];

  const handleSave = async () => {
    const data: any = { 
      name: editName, 
      email: editEmail, 
      phone_number: editPhone,
      bio: editBio 
    };
    
    if (currentUser?.role === 'professor') {
      data.department = editDepartment;
      data.expertise = editExpertise;
      data.academic_rank = editRank;
      data.office_location = editOfficeLocation;
      data.office_hours = JSON.stringify(editOfficeHours);
      data.meeting_link = editMeetingLink;
      data.zoom_enabled = editZoomEnabled;
      data.in_person_enabled = editInPersonEnabled;
    } else {
      data.major = editMajor;
      data.level = editLevel;
      data.graduation_year = parseInt(editGraduationYear) || null;
    }

    await updateProfile(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setIsEditing(false);
  };

  const addOfficeHour = () => {
    setEditOfficeHours([...editOfficeHours, { day: 'Monday', time: '10:00 AM - 11:00 AM' }]);
  };

  const removeOfficeHour = (index: number) => {
    setEditOfficeHours(editOfficeHours.filter((_, i) => i !== index));
  };

  const updateOfficeHour = (index: number, field: string, value: string) => {
    const next = [...editOfficeHours];
    next[index] = { ...next[index], [field]: value };
    setEditOfficeHours(next);
  };

  const requestMeeting = async () => {
    if (!meetingSlot) return alert("Please select a slot.");
    try {
      await fetch(`${API_BASE}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professor_id: viewUserId,
          note: meetingNote,
          slot: meetingSlot,
          meeting_type: meetingType,
          user_id: currentUser?.id
        })
      });
      setMeetingRequested(true);
      setTimeout(() => {
        setMeetingRequested(false);
        setIsMeetingModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Public Profile View (Premium Design) ─────────────────────
  if (!isOwnProfile) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
        <button 
          onClick={() => window.history.back()} 
          className="group flex items-center gap-2 text-xs font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          Return to Hub
        </button>

        {/* Hero Section */}
        <div className="relative bg-white rounded-[40px] border border-gray-100 p-12 shadow-2xl shadow-gray-200/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl shadow-blue-200">
              <div className="w-full h-full bg-white rounded-[28px] flex items-center justify-center text-5xl font-black text-blue-700">
                {profileUser.name.charAt(0)}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{profileUser.name}</h1>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  profileUser.role === 'professor' 
                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {profileUser.role} Account
                </span>
                {profileUser.role === 'student' && profileUser.student?.level && (
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-purple-50 border-purple-100 text-purple-700">
                    {profileUser.student.level}
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-500 font-medium max-w-2xl mb-8 leading-relaxed">
                {profileUser.bio || `A dedicated ${profileUser.role} at LearnPulse University, contributing to the future of AI-powered education.`}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {profileUser.email && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-bold border border-gray-100">
                    <Mail className="w-4 h-4 text-blue-500" />
                    {profileUser.email}
                  </div>
                )}
                {profileUser.role === 'professor' && profileUser.professor?.department && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-bold border border-gray-100">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    {profileUser.professor.department}
                  </div>
                )}
                {profileUser.role === 'student' && profileUser.student?.major && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-bold border border-gray-100">
                    <Book className="w-4 h-4 text-blue-500" />
                    {profileUser.student.major}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            {/* Performance Stats */}
            <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-8">Performance Metrics</h3>
              <div className="space-y-8">
                {profileUser.role === 'professor' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Instructor Rating</p>
                        <p className="text-3xl font-black">{profileUser.rating || '5.0'}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>
                    {profileUser.professor?.academic_rank && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Academic Rank</p>
                        <p className="text-lg font-extrabold">{profileUser.professor.academic_rank}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Knowledge Points</p>
                        <p className="text-3xl font-black">{profileUser.student?.points || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                    {profileUser.student?.gpa !== undefined && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Current GPA</p>
                        <p className="text-lg font-extrabold">{profileUser.student.gpa.toFixed(2)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Specialized Details Card */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Details</h3>
                <div className="space-y-5">
                    {profileUser.role === 'professor' ? (
                        <>
                            {profileUser.professor?.expertise && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 leading-none">Research Expertise</p>
                                    <p className="text-sm font-bold text-gray-700">{profileUser.professor.expertise}</p>
                                </div>
                            )}
                            {profileUser.professor?.office_location && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 leading-none">Office Location</p>
                                    <p className="text-sm font-bold text-gray-700">{profileUser.professor.office_location}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {profileUser.student?.level && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 leading-none">Academic Level</p>
                                    <p className="text-sm font-bold text-gray-700">{profileUser.student.level}</p>
                                </div>
                            )}
                            {profileUser.student?.graduation_year && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 leading-none">Class Of</p>
                                    <p className="text-sm font-bold text-gray-700">{profileUser.student.graduation_year}</p>
                                </div>
                            )}
                        </>
                    )}
                    {profileUser.phone_number && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Contact Number</p>
                            <p className="text-sm font-bold text-gray-700">{profileUser.phone_number}</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Interaction Card */}
            {profileUser.role === 'professor' ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-10 text-white shadow-2xl shadow-blue-200">
                <div className="max-w-md">
                  <h2 className="text-3xl font-black mb-4">Connect with Professor</h2>
                  <p className="text-blue-100 font-medium mb-8">
                    Available for mentorship, thesis advising, and research collaboration.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                      <Clock className="w-5 h-5 mb-3 text-blue-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Availability</p>
                      <p className="font-bold text-sm">{officeHoursParsed.length} Slots/Week</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                      <MapPin className="w-5 h-5 mb-3 text-blue-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Location</p>
                      <p className="font-bold text-sm">Main Campus / Zoom</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="w-full bg-white text-blue-700 font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition active:scale-[0.98]"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Recent Contributions
                </h2>
                <div className="space-y-6">
                  {profileUser.stats?.recent_activity?.length ? (
                    profileUser.stats.recent_activity.map((act: any) => (
                      <div key={act.id} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-start gap-5 group hover:border-blue-200 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <MessageCircle className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-900 mb-1">{act.title}</h4>
                          <p className="text-xs text-gray-400 font-bold mb-3">{act.date}</p>
                          <p className="text-sm text-gray-600 leading-relaxed italic">"{act.detail}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 font-medium italic">No public contributions recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meeting Modal */}
        {isMeetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Request Meeting</h2>
                <button onClick={() => setIsMeetingModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Preferred Time</label>
                   <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none"
                      value={meetingSlot}
                      onChange={e => setMeetingSlot(e.target.value)}
                    >
                      <option value="">Select an office hour slot...</option>
                      {officeHoursParsed.map((s: any, i: number) => (
                        <option key={i} value={`${s.day} @ ${s.time}`}>{s.day} at {s.time}</option>
                      ))}
                      <option value="Custom time">Custom time (describe in note)</option>
                    </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Meeting Note</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none"
                    placeholder="Briefly describe the purpose of this meeting..."
                    value={meetingNote}
                    onChange={e => setMeetingNote(e.target.value)}
                  />
                </div>
                <button 
                  onClick={requestMeeting}
                  disabled={meetingRequested}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {meetingRequested ? <><CheckCircle className="w-5 h-5" /> Request Transmitted</> : <>Send Request <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Default (Own Profile) View ──────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
        
        <div 
          className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-4xl font-black text-blue-700 cursor-pointer hover:scale-105 transition"
        >
          {profileUser.name.charAt(0)}
        </div>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{profileUser.name}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-gray-500 font-medium capitalize flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-blue-500" /> {profileUser.role} Account
            </span>
            {profileUser.role === 'student' && profileUser.student?.level && (
              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold border border-emerald-100">
                {profileUser.student.level}
              </span>
            )}
            {profileUser.role === 'professor' && profileUser.professor?.academic_rank && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold border border-blue-100">
                {profileUser.professor.academic_rank}
              </span>
            )}
          </div>
          {profileUser.bio && (
            <p className="text-sm text-gray-600 mb-4 max-w-lg">{profileUser.bio}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {profileUser.role === 'student' ? (
          <>
            <StatCard icon={<Trophy />} label="Points" value={profileUser.student?.points || 0} color="amber" />
            <StatCard icon={<CheckCircle />} label="Topics" value={profileUser.stats?.completed_topics_count || 0} color="emerald" />
            <StatCard icon={<TrendingUp />} label="Avg Score" value={`${profileUser.stats?.average_quiz_score || 0}%`} color="blue" />
            <StatCard icon={<BookOpen />} label="Courses" value={profileUser.stats?.courses_enrolled_count || 0} color="indigo" />
          </>
        ) : (
          <>
            <StatCard icon={<Users />} label="Students" value={profileUser.stats?.managed_students_count || 0} color="blue" />
            <StatCard icon={<BookOpen />} label="Courses" value={profileUser.stats?.total_courses_count || 0} color="indigo" />
            <StatCard icon={<Calendar />} label="Meetings" value={4} color="amber" onClick={() => navigate('/meetings')} />
            <StatCard icon={<Star />} label="Rating" value={profileUser.rating || '5.0'} color="emerald" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Personal Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <div className="flex items-center mt-1">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                  {isEditing ? (
                    <input
                      type="text"
                      className="font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">{editName}</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center mt-1">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  {isEditing ? (
                    <input
                      type="email"
                      className="font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">{editEmail}</span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <div className="flex items-center mt-1">
                  <Phone className="w-5 h-5 text-gray-400 mr-2" />
                  {isEditing ? (
                    <input
                      type="tel"
                      className="font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                      placeholder="+1-555-0000"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">{editPhone || 'Not set'}</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio / About</label>
                {isEditing ? (
                  <textarea
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder={currentUser?.role === 'professor' ? "Tell students about yourself..." : "Tell others about yourself..."}
                  />
                ) : (
                  <p className="text-gray-700 text-sm mt-1">{editBio || 'No bio set.'}</p>
                )}
              </div>

            </div>

            {/* Save button */}
            {isEditing && (
              <button
                onClick={handleSave}
                className="mt-6 w-full flex items-center justify-center bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition"
              >
                <Save className="w-4 h-4 mr-2" /> {saved ? 'Saved ✓' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Specialized Info Card (Edit Mode) */}
          {isEditing && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {profileUser.role === 'student' ? <GraduationCap className="w-5 h-5 text-emerald-600" /> : <Award className="w-5 h-5 text-blue-600" />}
                    {profileUser.role === 'student' ? 'Academic Details' : 'Professional Details'}
                </h2>
                <div className="space-y-4">
                    {profileUser.role === 'student' ? (
                        <>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Major / Specialization</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={editMajor}
                                    onChange={e => setEditMajor(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Academic Level</label>
                                <select 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={editLevel}
                                    onChange={e => setEditLevel(e.target.value)}
                                >
                                    <option>Undergraduate</option>
                                    <option>Graduate</option>
                                    <option>PhD</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Graduation Year</label>
                                <input 
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={editGraduationYear}
                                    onChange={e => setEditGraduationYear(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Department</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editDepartment}
                                    onChange={e => setEditDepartment(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Academic Rank</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editRank}
                                    onChange={e => setEditRank(e.target.value)}
                                    placeholder="Associate Professor, etc."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Expertise</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editExpertise}
                                    onChange={e => setEditExpertise(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Office Location</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editOfficeLocation}
                                    onChange={e => setEditOfficeLocation(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Professor Office Hours */}
          {profileUser.role === 'professor' && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
              <div className="flex justify-between items-center border-b border-indigo-200/50 pb-4 mb-4">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" /> Office Hours
                </h2>
                {isEditing && (
                  <button onClick={addOfficeHour} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                {(isEditing ? editOfficeHours : officeHoursParsed).map((slot: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-indigo-100 flex items-center justify-between group">
                    {isEditing ? (
                      <div className="flex gap-2 w-full pr-8 relative">
                        <select 
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold"
                          value={slot.day}
                          onChange={e => updateOfficeHour(i, 'day', e.target.value)}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)}
                        </select>
                        <input 
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium"
                          value={slot.time}
                          onChange={e => updateOfficeHour(i, 'time', e.target.value)}
                          placeholder="e.g. 10:00 AM - 12:00 PM"
                        />
                        <button 
                          onClick={() => removeOfficeHour(i)}
                          className="absolute -right-1 top-1 text-red-500 opacity-0 group-hover:opacity-100 p-1"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-gray-700">{slot.day}</span>
                        <span className="text-indigo-600 font-semibold text-sm">{slot.time}</span>
                      </>
                    )}
                  </div>
                ))}
                {(isEditing ? editOfficeHours : officeHoursParsed).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No office hours set.</p>
                )}
              </div>

              {/* Meeting Options */}
              <div className="space-y-4 pt-4 border-t border-indigo-200/30">
                <div className="flex flex-wrap gap-2">
                  <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition ${profileUser.professor?.zoom_enabled !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <Globe className="w-3.5 h-3.5 mr-1.5" /> Zoom Available
                  </div>
                  <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition ${profileUser.professor?.in_person_enabled !== false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> In-person Available
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3 p-4 bg-white rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Zoom Meetings</span>
                      <button 
                        onClick={() => setEditZoomEnabled(!editZoomEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${editZoomEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editZoomEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">In-person Meetings</span>
                      <button 
                        onClick={() => setEditInPersonEnabled(!editInPersonEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${editInPersonEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editInPersonEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Meeting Link Edit */}
                <div className="flex mt-4">
                  <input
                    type="text"
                    className="flex-1 bg-white border border-indigo-200 rounded-l-lg px-3 py-2 text-sm text-gray-600 font-medium focus:outline-none"
                    value={editMeetingLink}
                    onChange={e => setEditMeetingLink(e.target.value)}
                    placeholder="Zoom Link (https:// zoom.us/j/...)"
                  />
                  <button
                    onClick={handleSave}
                    className="bg-indigo-600 text-white px-3 rounded-r-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Quick Links */}
          {profileUser.role === 'student' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200/50 pb-4 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" /> Quick Links
              </h2>
              <div className="space-y-3">
                <Link
                  to="/courses"
                  className="block bg-white rounded-xl p-3 border border-blue-100 font-bold text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                   My Courses
                </Link>
                <Link
                  to="/discussions"
                  className="block bg-white rounded-xl p-3 border border-blue-100 font-bold text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                   Discussions
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" /> Recent Activity
            </h2>
            <div className="space-y-6">
              {profileUser.stats?.recent_activity && profileUser.stats.recent_activity.length > 0 ? (
                profileUser.stats.recent_activity.map((act, i) => (
                  <div key={act.id} className="relative pl-6 pb-2 last:pb-0">
                    {i !== profileUser.stats!.recent_activity.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-100"></div>
                    )}
                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                      <p className="text-xs text-gray-500 font-medium mb-1">{act.date}</p>
                      <p className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md border border-gray-100 inline-block font-semibold">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}