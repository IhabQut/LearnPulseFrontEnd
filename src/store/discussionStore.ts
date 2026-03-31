import { create } from 'zustand';
import { API_BASE } from '../lib/api';

export type Reply = {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
  upvotes: number;
  image?: string | null;
  userVote: number;
  role: 'student' | 'professor';
};

export type Discussion = {
  id: string;
  author: string;
  authorId: string;
  title: string;
  content: string;
  replies: number;
  upvotes: number;
  image?: string | null;
  date: string;
  courseId?: string;
  chapterId?: string;
  topicId?: string;
  userVote: number;
  replyList: Reply[];
};

interface DiscussionState {
  discussions: Discussion[];
  currentDiscussion: Discussion | null;
  fetchDiscussions: (userId?: string) => Promise<void>;
  fetchDiscussion: (id: string, userId?: string) => Promise<void>;
  addDiscussion: (discussion: Omit<Discussion, 'id' | 'replies' | 'date' | 'replyList' | 'upvotes' | 'userVote'>) => Promise<void>;
  addReply: (discussionId: string, reply: Omit<Reply, 'id' | 'date' | 'upvotes' | 'userVote'>) => Promise<void>;
  setVote: (userId: string, discussionId: string, voteType: number) => Promise<void>;
  setReplyVote: (userId: string, discussionId: string, replyId: string, voteType: number) => Promise<void>;
  awardPoints: (discussionId: string, userId: string, points: number) => Promise<void>;
}

const mapDiscussion = (d: any): Discussion => ({
  ...d,
  authorId: d.authorId || d.author_id,
  courseId: d.courseId || d.course_id,
  chapterId: d.chapterId || d.chapter_id,
  topicId: d.topicId || d.topic_id,
  upvotes: d.upvotes || 0,
  image: d.image || null,
  userVote: d.userVote !== undefined ? d.userVote : (d.user_vote || 0),
  replyList: (d.replyList || []).map(mapReply),
});

const mapReply = (r: any): Reply => ({
  ...r,
  authorId: r.authorId || r.author_id,
  upvotes: r.upvotes || 0,
  image: r.image || null,
  userVote: r.userVote !== undefined ? r.userVote : (r.user_vote || 0),
});

export const useDiscussionStore = create<DiscussionState>((set) => ({
  discussions: [],
  currentDiscussion: null,

  fetchDiscussions: async (userId) => {
    try {
      const url = userId ? `${API_BASE}/api/discussions?user_id=${userId}` : `${API_BASE}/api/discussions`;
      const response = await fetch(url);
      const rawData = await response.json();
      set({ discussions: rawData.map(mapDiscussion) });
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
    }
  },

  fetchDiscussion: async (id: string, userId?: string) => {
    try {
      const url = userId ? `${API_BASE}/api/discussions/${id}?user_id=${userId}` : `${API_BASE}/api/discussions/${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      set({ currentDiscussion: mapDiscussion(data) });
    } catch (error) {
      console.error("Failed to fetch discussion:", error);
      set({ currentDiscussion: null });
    }
  },
  
  addDiscussion: async (newDiscussionData) => {
    try {
      const dbDiscussion = {
        ...newDiscussionData,
        id: `d${Date.now()}`,
        date: 'Just now',
        upvotes: 0,
      };
      const response = await fetch(`${API_BASE}/api/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbDiscussion)
      });
      const data = await response.json();
      set((state) => ({
        discussions: [mapDiscussion(data), ...state.discussions]
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
        date: 'Just now',
        upvotes: 0,
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

      const mapped = mapReply(data);

      set((state) => ({
        discussions: state.discussions.map(disc => {
          if (disc.id === discussionId) {
            return { ...disc, replies: disc.replies + 1, replyList: [...(disc.replyList || []), mapped] };
          }
          return disc;
        }),
        currentDiscussion: state.currentDiscussion?.id === discussionId
          ? { ...state.currentDiscussion, replies: state.currentDiscussion.replies + 1, replyList: [...(state.currentDiscussion.replyList || []), mapped] }
          : state.currentDiscussion
      }));
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  },

  setVote: async (userId, discussionId, voteType) => {
    try {
      const res = await fetch(`${API_BASE}/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vote_type: voteType })
      });
      const data = await res.json();
      
      set((state) => ({
        discussions: state.discussions.map(d => d.id === discussionId ? { ...d, upvotes: data.upvotes, userVote: data.user_vote } : d),
        currentDiscussion: state.currentDiscussion?.id === discussionId
          ? { ...state.currentDiscussion, upvotes: data.upvotes, userVote: data.user_vote }
          : state.currentDiscussion
      }));
    } catch (error) {
      console.error("Failed to set discussion vote:", error);
    }
  },

  setReplyVote: async (userId, discussionId, replyId, voteType) => {
    try {
      const res = await fetch(`${API_BASE}/api/discussions/replies/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vote_type: voteType })
      });
      const data = await res.json();
      
      set((state) => ({
        discussions: state.discussions.map(d => {
          if (d.id === discussionId) {
            return { 
              ...d, 
              replyList: d.replyList.map(r => r.id === replyId ? { ...r, upvotes: data.upvotes, userVote: data.user_vote } : r) 
            };
          }
          return d;
        }),
        currentDiscussion: state.currentDiscussion?.id === discussionId
          ? { 
              ...state.currentDiscussion, 
              replyList: state.currentDiscussion.replyList.map(r => r.id === replyId ? { ...r, upvotes: data.upvotes, userVote: data.user_vote } : r) 
            }
          : state.currentDiscussion
      }));
    } catch (error) {
      console.error("Failed to set reply vote:", error);
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
