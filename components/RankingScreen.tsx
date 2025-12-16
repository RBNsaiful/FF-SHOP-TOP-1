
import React, { FC, useEffect, useState, useMemo } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { ref, onValue, query, limitToLast, orderByChild } from 'firebase/database';
import { DEFAULT_AVATAR_URL } from '../constants';

interface RankingScreenProps {
    user: User;
    texts: any;
    adCode?: string;
    adActive?: boolean;
    onClose?: () => void;
}

// Icons
const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const CrownIcon: FC<{className?: string, fill?: string}> = ({className, fill = "currentColor"}) => (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4L5 16H19L22 4L15 9L12 3L9 9L2 4Z" stroke="none" />
    </svg>
);

const RankingScreen: FC<RankingScreenProps> = ({ user, texts, adCode, adActive, onClose }) => {
    const [activeTab, setActiveTab] = useState<'transaction' | 'earning'>('transaction');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Optimized Real-time Data Fetching ---
    useEffect(() => {
        setLoading(true);
        const usersRef = ref(db, 'users');
        
        // FIX: limitToLast helps performance but might cut off the *actual* top user if index is missing.
        // For accurate ranking on small datasets (<1000), fetching all is safer for "My Rank". 
        // Assuming dataset is moderate for this challenge.
        const rankingQuery = query(usersRef, orderByChild(activeTab === 'transaction' ? 'totalSpent' : 'totalEarned'), limitToLast(100));
        
        const unsubscribe = onValue(rankingQuery, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const usersList: User[] = Object.entries(data).map(([key, val]: [string, any]) => ({
                    ...val,
                    uid: key
                }));
                setAllUsers(usersList);
            } else {
                setAllUsers([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab]);

    // --- Sorting & Ranking Logic (Memoized) ---
    const { top3, rest, myRank, myScore } = useMemo(() => {
        const safeNumber = (val: any) => {
            if (val === undefined || val === null) return 0;
            const num = parseFloat(val); 
            return (isNaN(num) || !isFinite(num)) ? 0 : num;
        };

        const getScoreVal = (u: User) => {
            if (activeTab === 'transaction') {
                return safeNumber(u.totalDeposit) + safeNumber(u.totalSpent);
            } else {
                return safeNumber(u.totalEarned);
            }
        };

        const sortedUsers = [...allUsers].sort((a, b) => {
            const scoreA = getScoreVal(a);
            const scoreB = getScoreVal(b);
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            return (a.name || "").localeCompare(b.name || "");
        });
        
        const myIndex = sortedUsers.findIndex(u => u.uid === user.uid);
        const myRankVal = myIndex !== -1 ? myIndex + 1 : null;
        const myScoreVal = myIndex !== -1 ? getScoreVal(sortedUsers[myIndex]) : 0;

        return {
            top3: sortedUsers.slice(0, 3),
            rest: sortedUsers.slice(3),
            myRank: myRankVal,
            myScore: myScoreVal
        };
    }, [allUsers, activeTab, user.uid]);

    return (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col font-sans overflow-hidden animate-smart-fade-in text-slate-900 dark:text-white">
            
            {/* --- HEADER --- */}
            <div className="relative z-50 pt-safe-top px-4 pb-4 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl sticky top-0 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-4 mb-5 pt-2">
                    <button 
                        onClick={onClose} 
                        className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-wide">
                        {texts.leaderboard}
                    </h1>
                </div>

                {/* THEMED TABS */}
                <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('transaction')}
                        className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm ${activeTab === 'transaction' ? 'bg-white dark:bg-slate-700 text-primary scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
                    >
                        {texts.topTraders}
                    </button>
                    <button 
                        onClick={() => setActiveTab('earning')}
                        className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm ${activeTab === 'earning' ? 'bg-white dark:bg-slate-700 text-secondary scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
                    >
                        {texts.topEarners}
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-40 pb-32 no-scrollbar scroll-smooth">
                
                {/* 1. PODIUM (Top 3) */}
                {!loading && top3.length > 0 && (
                    <div className="relative pt-12 pb-10 px-4">
                        {/* Background Decor */}
                        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 pointer-events-none" />

                        <div className="flex justify-center items-end gap-3 sm:gap-6 relative z-10">
                            
                            {/* --- Rank 2 (Silver) - Left Side --- */}
                            {top3[1] && (
                                <div className="flex flex-col items-center w-1/3 order-1 animate-smart-slide-up" style={{ animationDelay: '150ms' }}>
                                    <div className="relative mb-2 group">
                                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] shadow-lg shadow-slate-400/30 transform transition-transform group-hover:scale-105">
                                            <img 
                                                src={top3[1].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-800"
                                                alt="Rank 2"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-7 sm:h-7 bg-[#94A3B8] text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 border-white dark:border-slate-800 shadow-md z-20">
                                            2
                                        </div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[70px] sm:max-w-[80px] mx-auto">{top3[1].name}</p>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5">
                                            {Math.floor(activeTab === 'transaction' ? (Number(top3[1].totalDeposit || 0) + Number(top3[1].totalSpent || 0)) : Number(top3[1].totalEarned || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- Rank 1 (Gold) - Center (LARGEST & HIGHEST) --- */}
                            {top3[0] && (
                                <div className="flex flex-col items-center w-1/3 order-2 -mt-10 sm:-mt-12 animate-smart-slide-up z-20">
                                    <div className="mb-1 relative">
                                        <CrownIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 drop-shadow-md animate-bounce" fill="currentColor" />
                                        <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse"></div>
                                    </div>
                                    <div className="relative mb-3 group">
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-[#FCD34D] via-[#F59E0B] to-[#B45309] shadow-xl shadow-yellow-500/40 transform transition-transform group-hover:scale-105">
                                            <img 
                                                src={top3[0].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800"
                                                alt="Rank 1"
                                            />
                                        </div>
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-black border-2 border-white dark:border-slate-800 shadow-lg z-20">
                                            1
                                        </div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate max-w-[90px] sm:max-w-[110px] mx-auto">{top3[0].name}</p>
                                        <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">
                                            {Math.floor(activeTab === 'transaction' ? (Number(top3[0].totalDeposit || 0) + Number(top3[0].totalSpent || 0)) : Number(top3[0].totalEarned || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- Rank 3 (Bronze) - Right Side (SMALLEST) --- */}
                            {top3[2] && (
                                <div className="flex flex-col items-center w-1/3 order-3 animate-smart-slide-up" style={{ animationDelay: '300ms' }}>
                                    <div className="relative mb-2 group">
                                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-[#FDBA74] via-[#EA580C] to-[#9A3412] shadow-lg shadow-orange-700/20 transform transition-transform group-hover:scale-105">
                                            <img 
                                                src={top3[2].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800"
                                                alt="Rank 3"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-[#EA580C] text-white rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border-2 border-white dark:border-slate-800 shadow-md z-20">
                                            3
                                        </div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[70px] sm:max-w-[80px] mx-auto">{top3[2].name}</p>
                                        <p className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5">
                                            {Math.floor(activeTab === 'transaction' ? (Number(top3[2].totalDeposit || 0) + Number(top3[2].totalSpent || 0)) : Number(top3[2].totalEarned || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. THE LIST (Rank 4+) */}
                <div className="px-4 space-y-3 pb-6">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>
                    ) : rest.length > 0 ? (
                        rest.map((rUser, index) => {
                            const rank = index + 4;
                            const isMe = rUser.uid === user.uid;
                            const score = activeTab === 'transaction' 
                                ? (Number(rUser.totalDeposit || 0) + Number(rUser.totalSpent || 0)) 
                                : Number(rUser.totalEarned || 0);

                            return (
                                <div 
                                    key={rUser.uid || index} 
                                    className={`relative flex items-center p-3 sm:p-4 rounded-2xl transition-all border
                                        ${isMe 
                                            ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-md transform scale-[1.01]' 
                                            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="w-8 flex justify-center text-sm font-black text-slate-300 dark:text-slate-600 font-mono">
                                        #{rank}
                                    </div>

                                    <div className="relative mx-3">
                                        <img 
                                            src={rUser.avatarUrl || DEFAULT_AVATAR_URL} 
                                            alt="User" 
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {rUser.name}
                                        </p>
                                        {isMe && <span className="inline-block mt-0.5 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">You</span>}
                                    </div>

                                    <div className="text-right pl-2">
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{Math.floor(score).toLocaleString()}</p>
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">{texts.points}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !loading && <div className="text-center py-20 text-gray-400 text-sm">No data available</div>
                    )}
                </div>
            </div>

            {/* --- STICKY FOOTER FOR MY RANK --- */}
            {myRank && myRank > 3 && !loading && (
                <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0B1120] dark:via-[#0B1120]">
                    <div className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30 animate-smart-slide-up border border-white/20">
                        <div className="w-10 flex justify-center font-black text-sm text-white/80">
                            #{myRank}
                        </div>
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                            alt="Me" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/30 mx-2"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{texts.myRank}</p>
                            <p className="text-[10px] text-white/80 truncate">{user.name}</p>
                        </div>
                        <div className="text-right px-3">
                            <p className="text-lg font-black text-white">{Math.floor(myScore).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingScreen;