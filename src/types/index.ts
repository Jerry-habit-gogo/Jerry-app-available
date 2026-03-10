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
  category: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements';
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  viewCount: number;
}
