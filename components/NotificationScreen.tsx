
import React, { FC, useEffect, useState } from 'react';
import { Notification } from '../types';

interface NotificationScreenProps {
  texts: any;
  notifications: Notification[];
  onRead: () => void;
}

// --- Bold & Clean Bell Icon 🔔 ---
const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9c.47.292.997.491 1.548.58a2.25 2.25 0 0 0 1.4 0c.551-.089 1.078-.288 1.548-.58a.75.75 0 0 0-.097-1.286 22.955 22.955 0 0 0-4.302 0 .75.75 0 0 0-.097 1.286Z" clipRule="evenodd" />
    </svg>
);

const NotificationScreen: FC<NotificationScreenProps> = ({ texts, notifications, onRead }) => {
    // Capture the read time when component mounts
    const [initialReadTime] = useState(() => Number(localStorage.getItem('lastReadTimestamp') || 0));

    useEffect(() => {
        // Mark all as read after delay
        const timer = setTimeout(() => {
            onRead();
        }, 1500);
        return () => clearTimeout(timer);
    }, [onRead]);

    // Helpers for Date Formatting
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        // Format: "02:30 PM" (Locale aware)
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (days === 0) {
            return timeString; // Just time for today
        } else if (days === 1) {
            return `${texts.yesterday}, ${timeString}`;
        } else {
            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`;
        }
    };

    return (
        <div className="relative min-h-screen pb-24 bg-[#F3F4F6] dark:bg-[#0F172A] animate-smart-fade-in">
             <div className="relative z-10 max-w-xl mx-auto p-3 space-y-3">
                
                {notifications.length > 0 ? (
                    notifications.map((n, index) => {
                        const isUnread = n.timestamp > initialReadTime;

                        return (
                            <div 
                                key={n.id} 
                                className={`
                                    relative flex gap-4 p-4 rounded-2xl transition-all duration-300 animate-smart-slide-up
                                    bg-white dark:bg-[#1E293B]
                                    shadow-sm hover:shadow-md
                                    border border-gray-100 dark:border-gray-700
                                    ${isUnread ? 'bg-white dark:bg-[#1E293B]' : 'opacity-95'}
                                `}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Left Icon - Gradient Theme Color, Clean & No Ring */}
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
                                        <BellIcon className="w-6 h-6" />
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    {/* Header Row: Title */}
                                    <div className="mb-1.5 pr-4">
                                        <h3 className={`text-sm font-bold leading-snug ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {n.title || texts.notificationDefaultTitle}
                                        </h3>
                                    </div>
                                    
                                    {/* Message Body */}
                                    <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words mb-2 ${isUnread ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {n.message}
                                    </p>

                                    {/* Time Row */}
                                    <div className="mt-auto">
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                            {formatTime(n.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Unread Dot (Simple Theme Dot) */}
                                {isUnread && (
                                    <div className="absolute right-4 top-4 w-2.5 h-2.5 bg-primary rounded-full shadow-sm"></div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-60 animate-smart-fade-in">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <BellIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-300 font-bold mb-1 text-sm">{texts.noNotificationsTitle}</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px]">{texts.noNotifications}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default NotificationScreen;
