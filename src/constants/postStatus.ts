import { Post, PostStatus } from '../types';

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  active: '활성',
  closed: '마감',
  sold: '판매완료',
  filled: '충원완료',
  rented: '임대완료',
  deleted: '삭제됨',
};

export const POST_STATUS_STYLES: Record<PostStatus, { color: string; bg: string }> = {
  active: { color: '#059669', bg: '#D1FAE5' },
  closed: { color: '#6B7280', bg: '#F3F4F6' },
  sold: { color: '#DC2626', bg: '#FEF2F2' },
  filled: { color: '#2563EB', bg: '#EFF6FF' },
  rented: { color: '#7C3AED', bg: '#F5F3FF' },
  deleted: { color: '#EF4444', bg: '#FEE2E2' },
};

export const getPostStatus = (post?: Pick<Post, 'status'> | null): PostStatus =>
  post?.status ?? 'active';

export const isPostActive = (post?: Pick<Post, 'status'> | null): boolean =>
  getPostStatus(post) === 'active';

export const isPostDeleted = (post?: Pick<Post, 'status'> | null): boolean =>
  getPostStatus(post) === 'deleted';
