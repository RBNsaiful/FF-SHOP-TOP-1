
import React, { FC, useEffect, useState, useMemo } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
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
const TrophyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);

// Crown Icon
const CrownIcon: FC<{className?: string, fill?: string}> = ({className, fill = "currentColor"}) => (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4L5 16H19L22 4L15 9L12 3L9 9L2 4Z" stroke="none" />
    </svg>
);

const RankingScreen: FC<RankingScreenProps> = ({ user, texts, adCode, adActive, onClose }) => {
    const [activeTab, setActiveTab] = useState<'transaction' | 'earning'>('transaction');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // --- 1. Real-time Data Fetching (Mount Only) ---
    useEffect(() => {
        setLoading(true);
        const usersRef = ref(db, 'users');
        
        const unsubscribe = onValue(usersRef, (snapshot) => {
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
    }, []);

    // --- 2. Sorting & Ranking Logic (Memoized) ---
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

        const top100 = sortedUsers.slice(0, 100);

        return {
            top3: top100.slice(0, 3),
            rest: top100.slice(3),
            myRank: myRankVal,
            myScore: myScoreVal
        };
    }, [allUsers, activeTab, user.uid]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col font-sans overflow-hidden animate-smart-fade-in text-gray-900 dark:text-white">
            
            {/* --- HEADER --- */}
            <div className="relative z-50 pt-safe-top px-4 pb-3 bg-white/80 dark:bg-dark-card/90 backdrop-blur-md sticky top-0 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4 pt-2">
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{texts.leaderboard}</h1>
                </div>

                {/* THEMED TABS */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('transaction')}
                        className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 ${activeTab === 'transaction' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {texts.topTraders}
                    </button>
                    <button 
                        onClick={() => setActiveTab('earning')}
                        className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 ${activeTab === 'earning' ? 'bg-white dark:bg-dark-card text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {texts.topEarners}
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-40 pb-32 no-scrollbar scroll-smooth">
                
                {/* 1. PODIUM (Top 3) */}
                {!loading && top3.length > 0 && (
                    <div className="bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 pb-8 pt-6">
                        <div className="flex justify-center items-end px-4 gap-3 sm:gap-6">
                            
                            {/* Rank 2 */}
                            {top3[1] && (
                                <div className="flex flex-col items-center w-1/3 order-1 animate-smart-slide-up" style={{ animationDelay: '100ms' }}>
                                    <div className="relative mb-2">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg">
                                            <img 
                                                src={top3[1].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                                                alt="Rank 2"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 shadow-md">2</div>
                                    </div>
                                    <p className="text-xs font-bold mt-3 text-gray-800 dark:text-white truncate max-w-[80px] text-center">{top3[1].name}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{Math.floor(activeTab === 'transaction' ? (Number(top3[1].totalDeposit || 0) + Number(top3[1].totalSpent || 0)) : Number(top3[1].totalEarned || 0)).toLocaleString()}</p>
                                </div>
                            )}

                            {/* Rank 1 */}
                            {top3[0] && (
                                <div className="flex flex-col items-center w-1/3 order-2 -mt-6 animate-smart-slide-up">
                                    <div className="mb-2">
                                        <CrownIcon className="w-8 h-8 text-yellow-500 drop-shadow-sm animate-bounce" fill="currentColor" />
                                    </div>
                                    <div className="relative mb-2">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 shadow-xl shadow-yellow-500/20">
                                            <img 
                                                src={top3[0].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                                                alt="Rank 1"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-black border-2 border-white dark:border-gray-800 shadow-md">1</div>
                                    </div>
                                    <p className="text-sm font-black mt-3 text-gray-900 dark:text-white truncate max-w-[100px] text-center">{top3[0].name}</p>
                                    <p className="text-xs font-bold text-primary">{Math.floor(activeTab === 'transaction' ? (Number(top3[0].totalDeposit || 0) + Number(top3[0].totalSpent || 0)) : Number(top3[0].totalEarned || 0)).toLocaleString()}</p>
                                </div>
                            )}

                            {/* Rank 3 */}
                            {top3[2] && (
                                <div className="flex flex-col items-center w-1/3 order-3 animate-smart-slide-up" style={{ animationDelay: '200ms' }}>
                                    <div className="relative mb-2">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
                                            <img 
                                                src={top3[2].avatarUrl || DEFAULT_AVATAR_URL} 
                                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                                                alt="Rank 3"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 shadow-md">3</div>
                                    </div>
                                    <p className="text-xs font-bold mt-3 text-gray-800 dark:text-white truncate max-w-[80px] text-center">{top3[2].name}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{Math.floor(activeTab === 'transaction' ? (Number(top3[2].totalDeposit || 0) + Number(top3[2].totalSpent || 0)) : Number(top3[2].totalEarned || 0)).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. THE LIST (Rank 4+) */}
                <div className="px-4 space-y-3 pb-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>
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
                                    className={`relative flex items-center p-3.5 rounded-2xl transition-all border
                                        ${isMe 
                                            ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-md' 
                                            : 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800 shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="w-8 flex justify-center text-sm font-bold text-gray-400 font-mono">
                                        #{rank}
                                    </div>

                                    <div className="relative mx-3">
                                        <img 
                                            src={rUser.avatarUrl || DEFAULT_AVATAR_URL} 
                                            alt="User" 
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {rUser.name}
                                        </p>
                                        {isMe && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">You</span>}
                                    </div>

                                    <div className="text-right px-2">
                                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">{Math.floor(score).toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-400 font-medium">{texts.points}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !loading && <div className="text-center py-10 text-gray-400 text-sm">No data available</div>
                    )}
                </div>
            </div>

            {/* --- STICKY FOOTER FOR MY RANK --- */}
            {myRank && myRank > 3 && !loading && (
                <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900">
                    <div className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30 animate-smart-slide-up">
                        <div className="w-10 flex justify-center font-bold text-sm">
                            #{myRank}
                        </div>
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                            alt="Me" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 mx-2"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold">{texts.myRank}</p>
                            <p className="text-[10px] opacity-80">{user.name}</p>
                        </div>
                        <div className="text-right px-3">
                            <p className="text-lg font-black">{Math.floor(myScore).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingScreen;
