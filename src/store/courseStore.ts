import { create } from 'zustand';
import { type Course } from '../types';
import { apiFetch } from '../lib/api';
import { useAuthStore } from './authStore';

interface CourseState {
  courses: Course[];
  fetchCourses: () => Promise<void>;
  markTopicDone: (courseId: string, chapterId: string, topicId: string) => Promise<void>;
  createCourse: (data: { title: string; description: string; category?: string; image?: string; is_open?: boolean }, professorId: string) => Promise<void>;
  updateCourse: (courseId: string, data: { title?: string; description?: string; category?: string; image?: string; is_open?: boolean }) => Promise<void>;
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
      const data = await apiFetch<any[]>(`/api/courses?user_id=${encodeURIComponent(userId)}`);
      set({ courses: data });
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  },

  markTopicDone: async (courseId, chapterId, topicId) => {
    try {
      const userId = useAuthStore.getState().user?.id ?? 'u1';
      await apiFetch(`/api/topics/${topicId}/complete?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
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

  createCourse: async (data, professorId) => {
    try {
      const createdCourse = await apiFetch<any>(`/api/courses?professor_id=${professorId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      set((state) => ({ courses: [...state.courses, createdCourse] }));
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  },

  updateCourse: async (courseId, data) => {
    try {
      const updated = await apiFetch<any>(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      set((state) => ({
        courses: state.courses.map(c => c.id === courseId ? { ...c, ...updated } : c)
      }));
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  },

  deleteCourse: async (courseId) => {
    try {
      await apiFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      set((state) => ({
        courses: state.courses.filter(c => c.id !== courseId)
      }));
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  },

  createChapter: async (courseId, title, summary) => {
    try {
      const newChapter = await apiFetch<any>(`/api/courses/${courseId}/chapters`, {
        method: 'POST',
        body: JSON.stringify({ title, summary })
      });
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
      await apiFetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
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
      await apiFetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
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
      const newTopic = await apiFetch<any>(`/api/chapters/${chapterId}/topics`, {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
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
      await apiFetch(`/api/topics/${topicId}`, {
        method: 'PUT',
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
      await apiFetch(`/api/topics/${topicId}`, { method: 'DELETE' });
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
      const newMaterial = await apiFetch<any>(`/api/materials?course_id=${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ name, type, url })
      });
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
      await apiFetch(`/api/materials/${materialId}`, { method: 'DELETE' });
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
      return await apiFetch<any>(`/api/analytics/course/${courseId}`);
    } catch (error) {
      console.error("Failed to fetch AI report:", error);
      return null;
    }
  },

  generateChapterSummary: async (chapterId: string) => {
    try {
      const data = await apiFetch<any>(`/api/analytics/chapter/${chapterId}/summary`, { method: 'POST' });
      return data.summary;
    } catch (error) {
      console.error("Failed to generate chapter summary:", error);
      return "Failed to generate summary. Please try again.";
    }
  }
}));
