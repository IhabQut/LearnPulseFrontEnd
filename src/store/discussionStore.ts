import { create } from 'zustand';
import { API_BASE } from '../lib/api';

export type Reply = {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
  role: 'student' | 'professor';
};

export type Discussion = {
  id: string;
  author: string;
  authorId: string;
  title: string;
  content: string;
  replies: number;
  date: string;
  courseId?: string;
  chapterId?: string;
  topicId?: string;
  replyList: Reply[];
};

interface DiscussionState {
  discussions: Discussion[];
  fetchDiscussions: () => Promise<void>;
  addDiscussion: (discussion: Omit<Discussion, 'id' | 'replies' | 'date' | 'replyList'>) => Promise<void>;
  addReply: (discussionId: string, reply: Omit<Reply, 'id' | 'date'>) => Promise<void>;
  awardPoints: (discussionId: string, userId: string, points: number) => Promise<void>;
}

export const useDiscussionStore = create<DiscussionState>((set) => ({
  discussions: [],

  fetchDiscussions: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/discussions`);
      const data = await response.json();
      set({ discussions: data });
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
    }
  },
  
  addDiscussion: async (newDiscussionData) => {
    try {
      const dbDiscussion = {
        ...newDiscussionData,
        id: `d${Date.now()}`,
        date: 'Just now'
      };
      const response = await fetch(`${API_BASE}/api/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbDiscussion)
      });
      const data = await response.json();
      set((state) => ({
        discussions: [data, ...state.discussions]
      }));
    } catch (error) {
      console.error("Failed to add discussion:", error);
    }
  },

  addReply: async (discussionId, replyData) => {
    try {
      const dbReply = {
        ...replyData,
        id: `r${Date.now()}`,
        date: 'Just now'
      };
      const response = await fetch(`${API_BASE}/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbReply)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Failed to add reply:", data);
        return;
      }
      set((state) => ({
        discussions: state.discussions.map(disc => {
          if (disc.id === discussionId) {
            return {
              ...disc,
              replies: disc.replies + 1,
              replyList: [...(disc.replyList || []), data]
            };
          }
          return disc;
        })
      }));
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  },

  awardPoints: async (discussionId, userId, points) => {
    try {
      await fetch(`${API_BASE}/api/discussions/${discussionId}/award-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, points })
      });
    } catch (error) {
      console.error("Failed to award points:", error);
    }
  }
}));
