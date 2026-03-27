import { motion, AnimatePresence } from "framer-motion"
import { useNotificationStore } from "../../store/notificationStore"
import { Trash2, CheckCircle, Bell, X } from "lucide-react"

interface Props {
  close: () => void
}

export default function NotificationPanel({ close }: Props) {
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">{notifications.length} notifications total</p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
              >
                Mark all read
              </button>
            )}
            <button 
              onClick={close}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-500 mt-1">No new notifications for you right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`group relative px-6 py-4 cursor-pointer transition-all ${
                      !n.is_read ? "bg-blue-50/40 hover:bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    {!n.is_read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          <h4 className="text-sm font-bold text-gray-900 truncate">{n.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">{n.date}</p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}