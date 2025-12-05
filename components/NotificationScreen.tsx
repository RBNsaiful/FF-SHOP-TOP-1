import React, { FC, useEffect, useState } from 'react';
import type { Notification } from '../types';

// Icons
const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const GiftIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
);

const TagIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
);

const InfoIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

const ClockIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

interface NotificationScreenProps {
  texts: any;
  notifications: Notification[];
  onRead: () => void;
}

const NotificationItem: FC<{ notification: Notification, isNew: boolean, index: number }> = ({ notification, isNew, index }) => {
    
    let Icon = InfoIcon;
    let containerClass = "from-blue-50 to-white border-blue-100 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700";
    let iconBgClass = "bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200 dark:shadow-none";
    let accentTextClass = "text-blue-600 dark:text-blue-400";

    if (notification.type === 'bonus') {
        Icon = GiftIcon;
        containerClass = "from-amber-50 to-white border-amber-100 dark:from-slate-800 dark:to-slate-900 dark:border-amber-900/30";
        iconBgClass = "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200 dark:shadow-none";
        accentTextClass = "text-amber-600 dark:text-amber-400";
    } else if (notification.type === 'offer') {
        Icon = TagIcon;
        containerClass = "from-purple-50 to-white border-purple-100 dark:from-slate-800 dark:to-slate-900 dark:border-purple-900/30";
        iconBgClass = "bg-gradient-to-br from-purple-400 to-violet-600 shadow-purple-200 dark:shadow-none";
        accentTextClass = "text-purple-600 dark:text-purple-400";
    }

    return (
        <div 
            className={`
                group relative flex gap-4 p-5 rounded-3xl transition-all duration-500 ease-out
                bg-gradient-to-br border shadow-sm hover:shadow-md hover:-translate-y-1
                opacity-0 animate-smart-slide-up overflow-hidden
                ${containerClass}
            `}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {isNew && (
                <div className="absolute top-0 right-0">
                    <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-wider uppercase">
                        New
                    </div>
                </div>
            )}

            {/* Icon Container */}
            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white ${iconBgClass}`}>
                <Icon className="w-7 h-7 drop-shadow-md" />
            </div>
            
            <div className="flex-grow min-w-0 flex flex-col justify-center">
                <h3 className={`text-base font-bold truncate mb-1 text-gray-900 dark:text-white`}>
                    {notification.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-2">
                    {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${accentTextClass}`}>
                        {notification.type}
                    </span>
                    <div className="flex items-center text-[10px] font-medium text-gray-400">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        <span>
                            {new Date(notification.timestamp).toLocaleDateString(undefined, { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationScreen: FC<NotificationScreenProps> = ({ texts, notifications, onRead }) => {
    const [lastReadTime] = useState<number>(() => {
        return Number(localStorage.getItem('lastReadTimestamp') || 0);
    });

    useEffect(() => {
        // Mark as read after a short delay so user sees the "New" badges first
        const timer = setTimeout(() => {
            onRead();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onRead]);

    return (
        <div className="p-4 pb-24 min-h-screen bg-gray-50/50 dark:bg-transparent animate-smart-fade-in">
            <div className="max-w-md mx-auto pt-2">
                
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-smart-pop-in">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="relative w-24 h-24 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700">
                                 <BellIcon className="w-10 h-10 text-primary/50" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{texts.noNotifications}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                            Stay tuned! We'll notify you about new offers and rewards.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif, index) => (
                            <NotificationItem 
                                key={notif.id} 
                                notification={notif} 
                                isNew={notif.timestamp > lastReadTime}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationScreen;