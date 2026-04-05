import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Registrations from './pages/Registrations';
import MyCourses from './pages/MyCourses';
import CourseView from './pages/CourseView';
import ChapterView from './pages/ChapterView';
import DiscussionThread from './pages/DiscussionThread';
import Profile from './pages/Profile';
import ProfessorAdmin from './pages/ProfessorAdmin';
import Quiz from './pages/Quiz';
import AIAnalysis from './pages/AIAnalysis';
import Meetings from './pages/Meetings';
import Notifications from './pages/Notifications';
import CreateCourse from './pages/CreateCourse';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:courseId" element={<CourseView />} />
          <Route path="courses/:courseId/discussions/:discussionId" element={<DiscussionThread />} />
          <Route path="courses/:courseId/chapters/:chapterId" element={<ChapterView />} />
          <Route path="courses/:courseId/chapters/:chapterId/quiz" element={<Quiz />} />
          <Route path="courses/:courseId/chapters/:chapterId/topics/:topicId/quiz" element={<Quiz />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="admin" element={<ProfessorAdmin />} />
          <Route path="admin/analytics" element={<AIAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
