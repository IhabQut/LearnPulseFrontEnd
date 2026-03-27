import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  Calendar, 
  BookOpen, 
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, loading } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'warning': return <Calendar className="w-5 h-5 text-amber-500" />;
      default: return <MessageSquare className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Notifications</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Your Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                {notifications.filter(n => !n.is_read).length} New
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
           {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold transition-all shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
           )}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">We'll let you know when something important happens in your courses or discussions.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence mode="popLayout">
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group p-6 flex items-start gap-4 transition-all ${
                    !n.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`mt-1 p-2.5 rounded-2xl ${
                    !n.is_read ? 'bg-white shadow-sm ring-1 ring-blue-100' : 'bg-gray-50'
                  }`}>
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-base font-bold truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </h4>
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{n.date}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                      {n.message}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {!n.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2.5 shrink-0 shadow-sm shadow-blue-200" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          Viewing {notifications.length} notifications. Notifications older than 30 days are automatically archived.
        </p>
      </div>
    </div>
  );
}
