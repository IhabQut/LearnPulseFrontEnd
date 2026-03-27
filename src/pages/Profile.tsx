import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, type User } from '../store/authStore';
import { 
  User as UserIcon, Mail, Clock, Calendar, Shield, Save, MessageCircle, Link as LinkIcon, ArrowLeft, BookOpen, Plus, Trash, Globe, MapPin, CheckCircle, Trophy, Star, Users, TrendingUp, ClipboardList, Activity
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
  const [editBio, setEditBio] = useState('');
  const [editOfficeHours, setEditOfficeHours] = useState<any[]>([]);
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editZoomEnabled, setEditZoomEnabled] = useState(true);
  const [editInPersonEnabled, setEditInPersonEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  // Meeting request state for students
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingNote, setMeetingNote] = useState('');
  const [meetingSlot, setMeetingSlot] = useState('');
  const [meetingType, setMeetingType] = useState<'Zoom' | 'In-person'>('Zoom');
  const [meetingRequested, setMeetingRequested] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const viewUserId = userId || currentUser?.id;

  useEffect(() => {
    if (!viewUserId) return;
    document.title = profileUser ? `${profileUser.name} | Profile` : 'Profile | AI Learning Hub';
    if (isOwnProfile && currentUser) {
      setProfileUser(currentUser);
      setEditName(currentUser.name);
      setEditEmail(currentUser.email || `${currentUser.name.toLowerCase().replace(' ', '.')}@university.edu`);
      setEditBio(currentUser.bio || '');
      try {
        setEditOfficeHours(JSON.parse(currentUser.office_hours || '[]'));
      } catch {
        setEditOfficeHours([]);
      }
      setEditMeetingLink(currentUser.meeting_link || '');
      setEditZoomEnabled(currentUser.zoom_enabled !== false);
      setEditInPersonEnabled(currentUser.in_person_enabled !== false);
    } else {
      setLoading(true);
      fetch(`${API_BASE}/api/profile/${viewUserId}`)
        .then(r => r.json())
        .then(data => {
          setProfileUser(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [viewUserId, isOwnProfile, currentUser]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Loading profile...</div>;
  if (!profileUser) return <div className="text-center py-20 text-gray-500 font-medium">Profile not found.</div>;

  const officeHoursParsed = profileUser.office_hours ? (() => {
    try { return JSON.parse(profileUser.office_hours); } catch { return []; }
  })() : [];

  const handleSave = async () => {
    const data: any = { name: editName, email: editEmail, bio: editBio };
    if (currentUser?.role === 'professor') {
      data.office_hours = JSON.stringify(editOfficeHours);
      data.meeting_link = editMeetingLink;
      data.zoom_enabled = editZoomEnabled;
      data.in_person_enabled = editInPersonEnabled;
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
          meeting_type: meetingType
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Back button for visiting others */}
      {!isOwnProfile && (
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
        
        <div 
          className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-4xl font-black text-blue-700 cursor-pointer hover:scale-105 transition"
          onClick={() => console.log('Avatar clicked')}
        >
          {profileUser.name.charAt(0)}
        </div>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{profileUser.name}</h1>
          <p className="text-gray-500 font-medium capitalize flex items-center justify-center md:justify-start mb-2">
            <Shield className="w-4 h-4 mr-1.5 text-blue-500" /> {profileUser.role} Account
          </p>
          {profileUser.bio && (
            <p className="text-sm text-gray-600 mb-4 max-w-lg">{profileUser.bio}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {profileUser.role === 'student' ? (
          <>
            <StatCard icon={<Trophy />} label="Points" value={profileUser.points} color="amber" />
            <StatCard icon={<CheckCircle />} label="Topics" value={profileUser.stats?.completed_topics_count || 0} color="emerald" />
            <StatCard icon={<TrendingUp />} label="Avg Score" value={`${profileUser.stats?.average_quiz_score || 0}%`} color="blue" />
            <StatCard icon={<BookOpen />} label="Courses" value={profileUser.stats?.courses_enrolled_count || 0} color="indigo" />
          </>
        ) : (
          <>
            <StatCard icon={<Users />} label="Students" value={profileUser.stats?.managed_students_count || 0} color="blue" />
            <StatCard icon={<BookOpen />} label="Courses" value={profileUser.stats?.total_courses_count || 0} color="indigo" />
            <StatCard icon={<Calendar />} label="Meetings" value={4} color="amber" onClick={() => navigate('/meetings')} />
            <StatCard icon={<Star />} label="Rating" value="4.9" color="emerald" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Personal Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
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
                      className="font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
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
                      className="font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">{editEmail}</span>
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
                className="mt-6 w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition"
              >
                <Save className="w-4 h-4 mr-2" /> {saved ? 'Saved ✓' : 'Save Changes'}
              </button>
            )}
          </div>
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
                {isOwnProfile && isEditing && (
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
                  <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition ${profileUser.zoom_enabled !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <Globe className="w-3.5 h-3.5 mr-1.5" /> Zoom Available
                  </div>
                  <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition ${profileUser.in_person_enabled !== false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> In-person Available
                  </div>
                </div>

                {isOwnProfile && isEditing && (
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

                {/* Meeting Link / Request */}
                {isOwnProfile ? (
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
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    {profileUser.meeting_link && profileUser.zoom_enabled !== false && (
                      <a
                        href={profileUser.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center bg-indigo-100 text-indigo-700 font-bold text-sm px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-200 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4 inline mr-1.5" /> Join Regular Zoom
                      </a>
                    )}
                    <button
                      onClick={() => setIsMeetingModalOpen(true)}
                      className="w-full bg-indigo-600 text-white font-bold text-sm px-4 py-3 rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" /> Request Custom Meeting
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meeting Request Modal */}
          {isMeetingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Request a Meeting</h2>
                  <button onClick={() => setIsMeetingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <Trash className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Preferred Slot</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Meeting Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        disabled={profileUser.zoom_enabled === false}
                        onClick={() => setMeetingType('Zoom')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition ${meetingType === 'Zoom' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${profileUser.zoom_enabled === false ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <Globe className="w-4 h-4" /> Zoom
                      </button>
                      <button 
                        disabled={profileUser.in_person_enabled === false}
                        onClick={() => setMeetingType('In-person')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition ${meetingType === 'In-person' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${profileUser.in_person_enabled === false ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <MapPin className="w-4 h-4" /> In-person
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Purpose / Note</label>
                    <textarea 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="What would you like to discuss?"
                      value={meetingNote}
                      onChange={e => setMeetingNote(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={requestMeeting}
                    disabled={meetingRequested}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    {meetingRequested ? <><CheckCircle className="w-5 h-5" /> Request Sent!</> : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Quick Links */}
          {profileUser.role === 'student' && isOwnProfile && (
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