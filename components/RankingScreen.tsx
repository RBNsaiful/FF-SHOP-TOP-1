
import React, { FC, useEffect, useState } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { DEFAULT_AVATAR_URL } from '../constants';
import AdRenderer from './AdRenderer';

interface RankingScreenProps {
    user: User;
    texts: any;
    adCode?: string;
    adActive?: boolean;
}

// Icons
const GiftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const TrendingIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const RefreshIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>);

// Crown Icons
const GoldCrown: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="url(#goldGradient)" className={className} style={{ filter: 'drop-shadow(0px 2px 4px rgba(255, 215, 0, 0.5))' }}>
        <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FDB931" />
                <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
        </defs>
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
    </svg>
);

const SilverCrown: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E0E0E0" className={className} style={{ filter: 'drop-shadow(0px 2px 4px rgba(192, 192, 192, 0.5))' }}>
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
    </svg>
);

const BronzeCrown: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#CD7F32" className={className} style={{ filter: 'drop-shadow(0px 2px 4px rgba(205, 127, 50, 0.5))' }}>
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
    </svg>
);

const RankingScreen: FC<RankingScreenProps> = ({ user, texts, adCode, adActive }) => {
    const [activeTab, setActiveTab] = useState<'transaction' | 'earning'>('transaction');
    const [rankings, setRankings] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [myRank, setMyRank] = useState<number | null>(null);

    // Format safe numbers to prevent huge scientific notation strings
    const safeNumber = (val: any) => {
        let num = Number(val);
        if (isNaN(num) || !isFinite(num)) return 0;
        // Cap unrealistic numbers (e.g., > 100 Billion likely a bug)
        if (num > 100000000000) return 9999999999;
        return Math.floor(num);
    };

    const fetchData = () => {
        setLoading(true);
        setError('');
        
        const usersRef = ref(db, 'users');
        
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const usersList: User[] = Object.values(data);
                
                // Sorting
                const sortedUsers = usersList.sort((a, b) => {
                    if (activeTab === 'transaction') {
                        const volA = safeNumber(a.totalDeposit) + safeNumber(a.totalSpent);
                        const volB = safeNumber(b.totalDeposit) + safeNumber(b.totalSpent);
                        return volB - volA; 
                    } else {
                        const earnA = safeNumber(a.totalEarned);
                        const earnB = safeNumber(b.totalEarned);
                        return earnB - earnA; 
                    }
                });
                
                // Limit rendering to top 100 for performance
                setRankings(sortedUsers.slice(0, 100));
                
                // Find current user's rank in full list
                const rank = sortedUsers.findIndex(u => u.uid === user.uid);
                setMyRank(rank !== -1 ? rank + 1 : null);
            } else {
                setRankings([]);
            }
            setLoading(false);
        }, (err) => {
            console.error("Ranking fetch error:", err);
            setError(err.message);
            setLoading(false);
        });

        return unsubscribe;
    };

    useEffect(() => {
        const unsub = fetchData();
        return () => unsub();
    }, [user.uid, activeTab]);

    const TopPlayer: FC<{ user: User, rank: 1 | 2 | 3 }> = ({ user, rank }) => {
        const styleConfig = {
            1: {
                containerClass: 'order-2 z-30 -mt-10 transform scale-110',
                avatarSize: 'w-24 h-24 sm:w-28 sm:h-28',
                borderClass: 'border-yellow-400',
                glowClass: 'shadow-[0_0_30px_rgba(255,215,0,0.4)]',
                crown: <GoldCrown className="w-14 h-14 absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce" />,
                badge: 'bg-yellow-400 text-black',
                platformClass: 'bg-gradient-to-t from-yellow-500/20 to-transparent h-24'
            },
            2: {
                containerClass: 'order-1 z-20 mt-4',
                avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
                borderClass: 'border-gray-300',
                glowClass: 'shadow-[0_0_20px_rgba(192,192,192,0.3)]',
                crown: <SilverCrown className="w-10 h-10 absolute -top-8 left-1/2 -translate-x-1/2" />,
                badge: 'bg-gray-300 text-gray-800',
                platformClass: 'bg-gradient-to-t from-gray-400/20 to-transparent h-16'
            },
            3: {
                containerClass: 'order-3 z-20 mt-8',
                avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
                borderClass: 'border-orange-400',
                glowClass: 'shadow-[0_0_20px_rgba(205,127,50,0.3)]',
                crown: <BronzeCrown className="w-10 h-10 absolute -top-8 left-1/2 -translate-x-1/2" />,
                badge: 'bg-orange-400 text-white',
                platformClass: 'bg-gradient-to-t from-orange-500/20 to-transparent h-12'
            }
        };

        const config = styleConfig[rank];
        
        let score = 0;
        if (activeTab === 'transaction') {
            score = safeNumber(user.totalDeposit) + safeNumber(user.totalSpent);
        } else {
            score = safeNumber(user.totalEarned);
        }

        return (
            <div className={`flex flex-col items-center ${config.containerClass} transition-transform duration-500 hover:scale-105`}>
                <div className="relative">
                    {config.crown}
                    <div className={`rounded-full p-1 bg-white dark:bg-gray-800 ${config.glowClass}`}>
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                            alt={user.name} 
                            className={`rounded-full object-cover border-4 ${config.borderClass} ${config.avatarSize}`}
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }}
                        />
                    </div>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white dark:border-dark-card ${config.badge}`}>
                        {rank}
                    </div>
                </div>
                
                <div className="text-center mt-3 relative z-10">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[100px] mb-0.5">
                        {user.name}
                    </p>
                    <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold text-primary dark:text-yellow-400 shadow-sm">
                        {texts.currency}{score.toLocaleString()}
                    </span>
                </div>
            </div>
        );
    };

    const top3 = rankings.slice(0, 3);
    const rest = rankings.slice(3);

    // Skeleton Loader for sleek experience
    const SkeletonItem = () => (
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="flex items-center gap-4 w-full">
                <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex flex-col gap-2 w-1/2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] relative overflow-hidden flex flex-col font-sans">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
            <div className="absolute top-40 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full relative z-10">
                
                {/* Custom Stylish Tab Switcher - No Title Duplicate */}
                <div className="px-6 pt-4 mb-2 animate-smart-slide-down">
                    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white/20 flex relative">
                        <button 
                            onClick={() => setActiveTab('transaction')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 ${activeTab === 'transaction' ? 'text-white shadow-lg shadow-primary/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <TrendingIcon className="w-4 h-4" /> {texts.topPlayers || "Top Traders"}
                        </button>
                        <button 
                            onClick={() => setActiveTab('earning')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 ${activeTab === 'earning' ? 'text-white shadow-lg shadow-green-500/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <GiftIcon className="w-4 h-4" /> {texts.topEarners || "Top Earners"}
                        </button>
                        
                        {/* Animated Background Slider */}
                        <div className={`absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out w-[calc(50%-6px)] 
                            ${activeTab === 'transaction' ? 'left-1.5 bg-gradient-to-r from-primary to-purple-600' : 'left-[calc(50%+3px)] bg-gradient-to-r from-green-500 to-emerald-600'}`}>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 p-4 mt-10">
                        {/* Fake Podium Loading */}
                        <div className="flex justify-center items-end gap-4 mb-10 h-32">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse -mb-4"></div>
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-3xl p-2 shadow-sm">
                            {[1,2,3,4,5].map(i => <SkeletonItem key={i} />)}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center flex-1 text-center p-6">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-3 text-red-500 animate-bounce">
                            <TrendingIcon className="w-8 h-8" />
                        </div>
                        <p className="text-gray-800 dark:text-white font-bold mb-2">Something went wrong</p>
                        <p className="text-xs text-gray-500 mb-6">{error}</p>
                        <button onClick={fetchData} className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                            <RefreshIcon className="w-4 h-4" /> Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium Area */}
                        {rankings.length > 0 ? (
                            <div className="relative pt-8 pb-10 px-4">
                                <div className="flex justify-center items-end gap-2 sm:gap-6 animate-smart-pop-in min-h-[220px]">
                                    {/* Rank 2 */}
                                    <div className="w-1/3 flex justify-center">{top3[1] && <TopPlayer user={top3[1]} rank={2} />}</div>
                                    {/* Rank 1 */}
                                    <div className="w-1/3 flex justify-center z-20">{top3[0] && <TopPlayer user={top3[0]} rank={1} />}</div>
                                    {/* Rank 3 */}
                                    <div className="w-1/3 flex justify-center">{top3[2] && <TopPlayer user={top3[2]} rank={3} />}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400 opacity-60">
                                <GiftIcon className="w-16 h-16 mx-auto mb-4" />
                                <p>No rankings available yet.</p>
                            </div>
                        )}

                        {/* List View (Rank 4+) - Glassmorphism Style */}
                        {rest.length > 0 && (
                            <div className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-white/20 dark:border-gray-800 relative z-20 -mt-4 animate-smart-slide-up pb-24">
                                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-2 opacity-50"></div>
                                <div className="overflow-y-auto px-2">
                                    {rest.map((rUser, index) => {
                                        let score = activeTab === 'transaction' 
                                            ? safeNumber(rUser.totalDeposit) + safeNumber(rUser.totalSpent)
                                            : safeNumber(rUser.totalEarned);
                                        
                                        const rank = index + 4;
                                        const isMe = rUser.uid === user.uid;

                                        return (
                                            <div 
                                                key={rUser.uid} 
                                                className={`flex items-center justify-between p-3 mb-2 rounded-2xl transition-all duration-200 border border-transparent
                                                    ${isMe 
                                                        ? 'bg-gradient-to-r from-primary/10 to-transparent border-primary/20 shadow-sm' 
                                                        : 'hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                    <span className={`font-black w-6 text-center text-sm ${rank <= 10 ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                                                        #{rank}
                                                    </span>
                                                    <div className="relative flex-shrink-0">
                                                        <img 
                                                            src={rUser.avatarUrl || DEFAULT_AVATAR_URL} 
                                                            alt={rUser.name} 
                                                            className={`w-10 h-10 rounded-full object-cover border-2 ${isMe ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}
                                                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {rUser.name}
                                                        </p>
                                                        {isMe && <p className="text-[9px] text-primary font-bold uppercase tracking-wider">You</p>}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right pl-2">
                                                    <div className="font-black text-sm text-gray-800 dark:text-white">
                                                        {texts.currency}{score.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sticky User Rank Footer (If not in top 3) */}
            {myRank && myRank > 3 && !loading && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/90 animate-smart-slide-up">
                    <div className="max-w-lg mx-auto bg-gray-900 text-white dark:bg-white dark:text-black rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/10 dark:border-gray-200 ring-1 ring-black/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-black shadow-lg text-sm text-white">
                                #{myRank}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{texts.myRank}</span>
                                <span className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Your Position</span>
                            </div>
                        </div>
                        <div className="px-4 text-right">
                            <span className="font-black block text-base leading-none">
                                {texts.currency}
                                {(activeTab === 'transaction' 
                                    ? safeNumber(user.totalDeposit) + safeNumber(user.totalSpent) 
                                    : safeNumber(user.totalEarned)
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FOOTER ADVERTISEMENT --- */}
            {adCode && (
                <div className="w-full flex justify-center pb-2 bg-gray-50 dark:bg-[#0F172A]">
                    <AdRenderer code={adCode} active={adActive} />
                </div>
            )}
        </div>
    );
};

export default RankingScreen;
