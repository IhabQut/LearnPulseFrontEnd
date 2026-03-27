import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import { useNotificationStore } from "../../store/notificationStore"
import { useAuthStore } from "../../store/authStore"
import NotificationPanel from "./NotificationPanel"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notifications = useNotificationStore((s) => s.notifications)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id)
      
      // Optional: Polling for notifications (every 30 seconds)
      const interval = setInterval(() => {
        fetchNotifications(user.id)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user, fetchNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen(!open)}
        className="relative text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {open && <NotificationPanel close={() => setOpen(false)} />}
    </div>
  )
}