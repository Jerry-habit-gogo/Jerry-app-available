export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  createdAt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements';
  title: string;
  content: string;
  images?: string[];
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  price?: number; // For marketplace / real_estate
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}
