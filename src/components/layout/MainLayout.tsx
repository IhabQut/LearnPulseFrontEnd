import { useEffect, useMemo } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, User as UserIcon, LogOut, Calendar, PlusCircle } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useCourseStore } from "../../store/courseStore";
import { useDiscussionStore } from "../../store/discussionStore";
import NotificationBell from "../notifications/NotificationBell";

export default function MainLayout() {

  const { user, login, logout } = useAuthStore();
  const { fetchCourses } = useCourseStore();
  const { fetchDiscussions } = useDiscussionStore();

  const location = useLocation();

  // Fetch data only when user exists
  useEffect(() => {
    if (!user) return;

    fetchCourses();
    fetchDiscussions(user.id);
  }, [user, fetchCourses, fetchDiscussions]);

  // Navigation items
  const navItems = useMemo(() => {
    const items = [
      { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { to: "/courses", icon: BookOpen, label: "Courses" },
      { to: "/meetings", icon: Calendar, label: "Meetings" },
      { to: "/profile", icon: UserIcon, label: "Profile" },
    ];

    if (user?.role === "professor") {
      items.push({
        to: "/admin",
        icon: BookOpen,
        label: "Admin Panel",
      });
      items.push({
        to: "/courses/create",
        icon: PlusCircle,
        label: "Create Course",
      });
    }

    return items;
  }, [user]);

  // Detect current page
  const currentPage = useMemo(() => {
    return navItems.find((item) =>
      item.exact
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    );
  }, [location.pathname, navItems]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">

        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Learn Pulse
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 mr-3 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}

          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">

          {user ? (
            <div className="flex flex-col gap-3">

              <div className="flex items-center">

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                  {user.name.charAt(0)}
                </div>

                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>

              </div>

              <button
                onClick={logout}
                className="flex items-center justify-center w-full px-4 py-2 text-sm text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>

            </div>
          ) : (

            <div className="flex flex-col gap-2">

              <button
                onClick={() => login("student")}
                className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
              >
                Login as Student
              </button>

              <button
                onClick={() => login("professor")}
                className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all"
              >
                Login as Professor
              </button>

            </div>

          )}

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm justify-between">

          <h2 className="text-lg font-semibold text-gray-800">
            {user ? currentPage?.label : "Welcome to Learn Pulse"}
          </h2>

          {user && (
          <NotificationBell />
          )}
        </header>
        

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>

      </main>
    </div>
  );
}