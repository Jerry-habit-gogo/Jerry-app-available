export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PostStatus = 'active' | 'closed' | 'sold' | 'filled' | 'rented' | 'deleted';

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
  region?: string;
  jobType?: 'full_time' | 'part_time' | 'contract';
  realEstateType?: 'studio' | 'apartment' | 'house';
  marketplaceCondition?: 'new' | 'used';
  status?: PostStatus;
  isPinned?: boolean;
}

export type PostSortOption = 'latest' | 'price_low' | 'price_high';

export interface PostFilterOptions {
  category?: Post['category'];
  searchText?: string;
  sortBy?: PostSortOption;
  region?: string;
  jobType?: Post['jobType'];
  realEstateType?: Post['realEstateType'];
  marketplaceCondition?: Post['marketplaceCondition'];
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

export interface ChatParticipant {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
}

export interface ChatRoom {
  id: string;
  postId: string;
  postTitle: string;
  participantIds: string[];
  participants: Record<string, ChatParticipant>;
  lastMessage: string;
  lastMessageSenderId?: string;
  updatedAt: string;
  createdAt: string;
  unreadCounts?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

// --- Moderation ---

export type ReportReason = 'spam' | 'inappropriate' | 'scam' | 'harassment' | 'other';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  postId?: string;
  reason: ReportReason;
  description?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedDisplayName?: string | null;
  blockedPhotoUrl?: string | null;
  createdAt: string;
}

// --- Notifications ---

export type NotificationType = 'chat_message' | 'comment' | 'like' | 'announcement';

export interface NotificationData {
  postId?: string;
  chatRoomId?: string;
  commentId?: string;
  actorId?: string;
  actorName?: string;
  postTitle?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: NotificationData;
}
