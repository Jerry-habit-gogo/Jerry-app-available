import { Post, Comment } from '../types';

export const mockPosts: Post[] = [
    {
        id: 'p1',
        authorId: 'u1',
        authorName: 'Sydney Recruiter',
        authorAvatar: 'https://i.pravatar.cc/150?u=u1',
        category: 'jobs',
        region: '시드니',
        jobType: 'full_time',
        title: 'Looking for a Senior React Native Developer',
        content: 'We are a fast-growing startup in Sydney CBD looking for an experienced React Native developer to join our mobile team. Flexible working hours and great culture.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        viewCount: 154,
        commentCount: 5,
        likeCount: 12,
    },
    {
        id: 'p2',
        authorId: 'u2',
        authorName: 'Strathfield Landlord',
        category: 'real_estate',
        region: '멜버른',
        realEstateType: 'studio',
        title: 'Sunny Studio in Strathfield, 5 mins to station',
        content: 'Fully furnished studio apartment available for rent. All bills included. Perfect for a student or single professional.',
        price: 450,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        viewCount: 302,
        commentCount: 1,
        likeCount: 8,
    },
    {
        id: 'p3',
        authorId: 'u3',
        authorName: 'Tech Seller',
        authorAvatar: 'https://i.pravatar.cc/150?u=u3',
        category: 'marketplace',
        region: '브리즈번',
        marketplaceCondition: 'used',
        title: 'MacBook Pro M2 2023 - Like New',
        content: 'Selling my MacBook Pro M2, 16GB RAM, 512GB SSD. Barely used, battery cycle count under 20. Comes with original box and charger.',
        price: 1800,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        viewCount: 89,
        commentCount: 3,
        likeCount: 2,
    },
    {
        id: 'p4',
        authorId: 'admin',
        authorName: 'Jerry Admin',
        category: 'news',
        region: '시드니',
        title: 'New Public Transport Updates for Sydney',
        content: 'The NSW government has announced new updates to the train schedule affecting the T1 and T9 lines starting next month.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        viewCount: 1024,
        commentCount: 45,
        likeCount: 150,
    },
    {
        id: 'p5',
        authorId: 'admin',
        authorName: 'Jerry Admin',
        category: 'announcements',
        region: '시드니',
        title: 'Welcome to the Jerry App!',
        content: 'We are thrilled to launch the Jerry App for our community. Please be respectful to others and enjoy your stay.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
        viewCount: 5000,
        commentCount: 120,
        likeCount: 450,
    }
];

export const mockComments: Record<string, Comment[]> = {
    'p1': [
        {
            id: 'c1',
            postId: 'p1',
            authorId: 'u4',
            authorName: 'Developer Dan',
            authorAvatar: 'https://i.pravatar.cc/150?u=u4',
            content: 'Is this a remote position?',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
            id: 'c2',
            postId: 'p1',
            authorId: 'u1',
            authorName: 'Sydney Recruiter',
            authorAvatar: 'https://i.pravatar.cc/150?u=u1',
            content: 'Hybrid, 2 days in office.',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        }
    ],
    'p3': [
        {
            id: 'c3',
            postId: 'p3',
            authorId: 'u5',
            authorName: 'Bargain Hunter',
            content: 'Would you take $1500?',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        }
    ]
};
