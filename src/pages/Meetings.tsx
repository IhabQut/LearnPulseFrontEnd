import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, Clock, Globe, MapPin, 
  ExternalLink, MessageSquare
} from 'lucide-react';
import { apiFetch } from '../lib/api';

type MeetingRequest = {
  id: string;
  user_id: string;
  user_name: string;
  professor_id: string;
  professor_name: string;
  note: string;
  slot: string;
  meeting_type: string;
  status: string;
  date: string;
};

export default function Meetings() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchMeetings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch<MeetingRequest[]>(`/api/meetings?user_id=${user.id}`);
      setMeetings(data);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    document.title = 'Meetings | AI Learning Hub';
  }, [user]);

  const updateStatus = async (meetingId: string, status: string) => {
    try {
      await apiFetch(`/api/meetings/${meetingId}?status=${status}`, {
        method: 'PUT'
      });
      fetchMeetings();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    return m.status.toLowerCase() === filter;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Meeting Management</h1>
          <p className="text-gray-500 font-medium">Track and manage your {user.role === 'professor' ? 'office hour requests' : 'scheduled meetings'}.</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 self-start">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                filter === f 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading sessions...</p>
          </div>
        ) : filteredMeetings.length > 0 ? (
          filteredMeetings.map((m) => (
            <div 
              key={m.id} 
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                m.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                m.status === 'rejected' ? 'bg-red-50 text-red-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {m.meeting_type === 'Zoom' ? <Globe className="w-8 h-8" /> : <MapPin className="w-8 h-8" />}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {user.role === 'professor' ? m.user_name : `With ${m.professor_name}`}
                  </h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    m.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    m.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-blue-500" /> {m.slot}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> Requested {m.date}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5 text-amber-500" /> {m.note || 'No note provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                {user.role === 'professor' && m.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(m.id, 'rejected')}
                      className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => updateStatus(m.id, 'approved')}
                      className="flex-1 md:flex-none px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                    >
                      Approve
                    </button>
                  </>
                )}
                
                {m.status === 'approved' && m.meeting_type === 'Zoom' && (
                   <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      Join Meeting <ExternalLink className="w-4 h-4" />
                   </button>
                )}
                
                {m.status === 'approved' && m.meeting_type === 'In-person' && (
                  <div className="text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    Confirmed In-person
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {filter === 'all' 
                ? "You haven't scheduled any meetings yet." 
                : `No ${filter} requests at the moment.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
