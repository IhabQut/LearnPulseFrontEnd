import { create } from 'zustand';
import { type Course } from '../data/mockData';
import { API_BASE } from '../lib/api';
import { useAuthStore } from './authStore';

interface CourseState {
  courses: Course[];
  fetchCourses: () => Promise<void>;
  markTopicDone: (courseId: string, chapterId: string, topicId: string) => Promise<void>;
  createCourse: (title: string, description: string, professorId: string) => Promise<void>;
  updateCourse: (courseId: string, data: { title?: string; description?: string }) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  createChapter: (courseId: string, title: string, summary: string) => Promise<void>;
  updateChapter: (chapterId: string, data: { title?: string; summary?: string }) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  createTopic: (chapterId: string, title: string, description: string) => Promise<void>;
  updateTopic: (topicId: string, data: { title?: string; description?: string }) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  addMaterial: (courseId: string, name: string, type: string, url: string) => Promise<void>;
  removeMaterial: (courseId: string, materialId: string) => Promise<void>;
  fetchAIReport: (courseId: string) => Promise<any>;
  generateChapterSummary: (chapterId: string) => Promise<string>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  
  fetchCourses: async () => {
    try {
      const userId = useAuthStore.getState().user?.id ?? 'u1';
      const response = await fetch(`${API_BASE}/api/courses?user_id=${encodeURIComponent(userId)}`);
      const data = await response.json();
      set({ courses: data });
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  },

  markTopicDone: async (courseId, chapterId, topicId) => {
    try {
      const userId = useAuthStore.getState().user?.id ?? 'u1';
      await fetch(`${API_BASE}/api/topics/${topicId}/complete?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
      set((state) => ({
        courses: state.courses.map(course => {
          if (course.id !== courseId) return course;
          return {
            ...course,
            chapters: course.chapters.map(chapter => {
              if (chapter.id !== chapterId) return chapter;
              return {
                ...chapter,
                topics: chapter.topics.map(topic => {
                  if (topic.id !== topicId) return topic;
                  return { ...topic, completed: true };
                })
              };
            })
          };
        })
      }));
    } catch (error) {
      console.error("Failed to mark topic as done:", error);
    }
  },

  createCourse: async (title, description, professorId) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses?professor_id=${professorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const data = await response.json();
      set((state) => ({ courses: [...state.courses, data] }));
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  },

  updateCourse: async (courseId, data) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const updated = await response.json();
      set((state) => ({
        courses: state.courses.map(c => c.id === courseId ? { ...c, ...updated } : c)
      }));
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  },

  deleteCourse: async (courseId) => {
    try {
      await fetch(`${API_BASE}/api/courses/${courseId}`, { method: 'DELETE' });
      set((state) => ({
        courses: state.courses.filter(c => c.id !== courseId)
      }));
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  },

  createChapter: async (courseId, title, summary) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary })
      });
      const newChapter = await response.json();
      set((state) => ({
        courses: state.courses.map(c => {
          if (c.id !== courseId) return c;
          return { ...c, chapters: [...c.chapters, { ...newChapter, topics: [] }] };
        })
      }));
    } catch (error) {
      console.error("Failed to create chapter:", error);
    }
  },

  updateChapter: async (chapterId, data) => {
    try {
      await fetch(`${API_BASE}/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      set((state) => ({
        courses: state.courses.map(c => ({
          ...c,
          chapters: c.chapters.map(ch => ch.id === chapterId ? { ...ch, ...data } : ch)
        }))
      }));
    } catch (error) {
      console.error("Failed to update chapter:", error);
    }
  },

  deleteChapter: async (chapterId) => {
    try {
      await fetch(`${API_BASE}/api/chapters/${chapterId}`, { method: 'DELETE' });
      set((state) => ({
        courses: state.courses.map(c => ({
          ...c,
          chapters: c.chapters.filter(ch => ch.id !== chapterId)
        }))
      }));
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  },

  createTopic: async (chapterId, title, description) => {
    try {
      const response = await fetch(`${API_BASE}/api/chapters/${chapterId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const newTopic = await response.json();
      set((state) => ({
        courses: state.courses.map(c => ({
          ...c,
          chapters: c.chapters.map(ch => {
            if (ch.id !== chapterId) return ch;
            return { ...ch, topics: [...ch.topics, newTopic] };
          })
        }))
      }));
    } catch (error) {
      console.error("Failed to create topic:", error);
    }
  },

  updateTopic: async (topicId, data) => {
    try {
      await fetch(`${API_BASE}/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      set((state) => ({
        courses: state.courses.map(c => ({
          ...c,
          chapters: c.chapters.map(ch => ({
            ...ch,
            topics: ch.topics.map(t => t.id === topicId ? { ...t, ...data } : t)
          }))
        }))
      }));
    } catch (error) {
      console.error("Failed to update topic:", error);
    }
  },
  
  deleteTopic: async (topicId) => {
    try {
      await fetch(`${API_BASE}/api/topics/${topicId}`, { method: 'DELETE' });
      set((state) => ({
        courses: state.courses.map(c => ({
          ...c,
          chapters: c.chapters.map(ch => ({
            ...ch,
            topics: ch.topics.filter(t => t.id !== topicId)
          }))
        }))
      }));
    } catch (error) {
      console.error("Failed to delete topic:", error);
    }
  },

  addMaterial: async (courseId, name, type, url) => {
    try {
      const response = await fetch(`${API_BASE}/api/materials?course_id=${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, url })
      });
      const newMaterial = await response.json();
      set((state) => ({
        courses: state.courses.map(c => {
          if (c.id !== courseId) return c;
          return { ...c, materials: [...(c.materials || []), newMaterial] };
        })
      }));
    } catch (error) {
      console.error("Failed to add material:", error);
    }
  },

  removeMaterial: async (courseId, materialId) => {
    try {
      await fetch(`${API_BASE}/api/materials/${materialId}`, { method: 'DELETE' });
      set((state) => ({
        courses: state.courses.map(c => {
          if (c.id !== courseId) return c;
          return { ...c, materials: (c.materials || []).filter(m => m.id !== materialId) };
        })
      }));
    } catch (error) {
      console.error("Failed to remove material:", error);
    }
  },

  fetchAIReport: async (courseId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/course/${courseId}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch AI report:", error);
      return null;
    }
  },

  generateChapterSummary: async (chapterId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/chapter/${chapterId}/summary`, { method: 'POST' });
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error("Failed to generate chapter summary:", error);
      return "Failed to generate summary. Please try again.";
    }
  }
}));
