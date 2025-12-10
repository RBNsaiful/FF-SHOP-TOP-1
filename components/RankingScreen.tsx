
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

// Crown Icon
const CrownIcon: FC<{className?: string, fill?: string}> = ({className, fill = "currentColor"}) => (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4L5 16H19L22 4L15 9L12 3L9 9L2 4Z" stroke="none" />
    </svg>
);

// Star Badge Icon
const StarBadgeIcon: FC<{className?: string, fill?: string}> = ({className, fill = "currentColor"}) => (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" stroke="none" />
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
                // CRITICAL FIX: Ensure UID is present by mapping keys
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

    // --- 2. Sorting & Ranking Logic (Memoized for Performance) ---
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

        // Sort Users Descending by Score, Secondary by Name for Stability
        const sortedUsers = [...allUsers].sort((a, b) => {
            const scoreA = getScoreVal(a);
            const scoreB = getScoreVal(b);
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            // Secondary sort: alphabetical by name to prevent jumping
            return (a.name || "").localeCompare(b.name || "");
        });
        
        // Find My Position
        const myIndex = sortedUsers.findIndex(u => u.uid === user.uid);
        const myRankVal = myIndex !== -1 ? myIndex + 1 : null;
        const myScoreVal = myIndex !== -1 ? getScoreVal(sortedUsers[myIndex]) : 0;

        // Slice Data
        const top100 = sortedUsers.slice(0, 100);

        return {
            top3: top100.slice(0, 3),
            rest: top100.slice(3),
            myRank: myRankVal,
            myScore: myScoreVal
        };
    }, [allUsers, activeTab, user.uid]);

    return (
        <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col font-sans overflow-hidden animate-smart-fade-in text-white">
            
            {/* --- DECORATIVE BACKGROUND BLOBS --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/20 blur-[100px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-secondary/10 blur-[100px] rounded-full animate-pulse"></div>
            </div>

            {/* --- HEADER WITH TABS --- */}
            <div className="relative z-50 pt-safe-top px-4 pb-2 bg-[#000000]/80 backdrop-blur-sm sticky top-0">
                <div className="flex items-center justify-between py-3 gap-3">
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-white" />
                    </button>
                    
                    {/* PREMIUM TABS */}
                    <div className="flex-1 bg-[#1E293B] p-1.5 rounded-2xl flex relative border border-white/10 shadow-inner max-w-sm mx-auto">
                        <button 
                            onClick={() => setActiveTab('transaction')}
                            className={`flex-1 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'transaction' ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-lg shadow-primary/30 transform scale-[1.02]' : 'text-gray-400 hover:text-white'}`}
                        >
                            Traders
                        </button>
                        <button 
                            onClick={() => setActiveTab('earning')}
                            className={`flex-1 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'earning' ? 'bg-gradient-to-r from-[#EC4899] to-[#DB2777] text-white shadow-lg shadow-pink-500/30 transform scale-[1.02]' : 'text-gray-400 hover:text-white'}`}
                        >
                            Earners
                        </button>
                    </div>

                    <div className="w-10 flex-shrink-0"></div> {/* Spacer for center alignment */}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-40 pb-28 no-scrollbar scroll-smooth">
                
                {/* 1. PODIUM (Top 3) */}
                {!loading && top3.length > 0 && (
                    <div className="flex justify-center items-end px-4 mt-24 mb-10 gap-2 sm:gap-4">
                        
                        {/* Rank 2 (Silver) */}
                        {top3[1] && (
                            <div className="flex flex-col items-center w-1/3 order-1">
                                <div className="relative mb-2 animate-bounce" style={{ animationDuration: '4s' }}>
                                    <StarBadgeIcon className="w-6 h-6" fill="#C0C0C0" />
                                </div>
                                <div className="relative mb-3 group">
                                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500 shadow-[0_0_20px_rgba(192,192,192,0.3)]">
                                        <img 
                                            src={top3[1].avatarUrl || DEFAULT_AVATAR_URL} 
                                            className="w-full h-full rounded-full object-cover border-2 border-[#000]"
                                            alt="Rank 2"
                                        />
                                    </div>
                                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center border-2 border-[#1E293B] text-white text-[10px] font-black shadow-lg z-10">
                                        2
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-white truncate w-full text-center max-w-[80px]">{top3[1].name || 'N/A'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                    {Math.floor(activeTab === 'transaction' 
                                        ? (Number(top3[1].totalDeposit || 0) + Number(top3[1].totalSpent || 0)) 
                                        : Number(top3[1].totalEarned || 0)
                                    ).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Rank 1 (Gold - Winner) */}
                        {top3[0] && (
                            <div className="flex flex-col items-center w-1/3 order-2 -mt-12 z-10 scale-110">
                                <div className="mb-2 animate-bounce" style={{ animationDuration: '3s' }}>
                                    <CrownIcon className="w-10 h-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]" fill="#FFD700" />
                                </div>
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_40px_rgba(253,224,71,0.5)]">
                                        <img 
                                            src={top3[0].avatarUrl || DEFAULT_AVATAR_URL} 
                                            className="w-full h-full rounded-full object-cover border-4 border-[#000]"
                                            alt="Rank 1"
                                        />
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-[#1E293B] text-white text-xs font-black shadow-xl z-10">
                                        1
                                    </div>
                                </div>
                                <p className="text-sm font-black text-white truncate w-full text-center max-w-[110px]">{top3[0].name || 'N/A'}</p>
                                <div className="bg-yellow-500/10 px-3 py-0.5 rounded-full mt-1 border border-yellow-500/30">
                                    <p className="text-[10px] text-yellow-400 font-bold tracking-wide">
                                        {Math.floor(activeTab === 'transaction' 
                                            ? (Number(top3[0].totalDeposit || 0) + Number(top3[0].totalSpent || 0)) 
                                            : Number(top3[0].totalEarned || 0)
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 (Bronze) */}
                        {top3[2] && (
                            <div className="flex flex-col items-center w-1/3 order-3">
                                <div className="relative mb-2 animate-bounce" style={{ animationDuration: '5s' }}>
                                    <StarBadgeIcon className="w-5 h-5" fill="#CD7F32" />
                                </div>
                                <div className="relative mb-3 group">
                                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-orange-700 via-amber-800 to-amber-900 shadow-[0_0_20px_rgba(205,127,50,0.3)]">
                                        <img 
                                            src={top3[2].avatarUrl || DEFAULT_AVATAR_URL} 
                                            className="w-full h-full rounded-full object-cover border-2 border-[#000]"
                                            alt="Rank 3"
                                        />
                                    </div>
                                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-orange-700 to-amber-900 rounded-full flex items-center justify-center border-2 border-[#1E293B] text-white text-[10px] font-black shadow-lg z-10">
                                        3
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-white truncate w-full text-center max-w-[80px]">{top3[2].name || 'N/A'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                    {Math.floor(activeTab === 'transaction' 
                                        ? (Number(top3[2].totalDeposit || 0) + Number(top3[2].totalSpent || 0)) 
                                        : Number(top3[2].totalEarned || 0)
                                    ).toLocaleString()}
                                </p>
                            </div>
                        )}

                    </div>
                )}

                {/* 2. THE LIST (Rank 4+) */}
                <div className="px-4 space-y-3 pb-10">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div></div>
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
                                    className={`relative flex items-center p-3.5 rounded-3xl transition-all active:scale-[0.98] border
                                        ${isMe 
                                            ? 'bg-[#1E293B] border-primary/50 shadow-[0_4px_15px_-3px_rgba(124,58,237,0.3)]' 
                                            : 'bg-[#1E293B] border-white/5 hover:border-white/10'
                                        }
                                    `}
                                >
                                    {/* Rank Number */}
                                    <div className="w-8 flex justify-center">
                                        <span className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-gray-500'}`}>{rank}</span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative">
                                        <img 
                                            src={rUser.avatarUrl || DEFAULT_AVATAR_URL} 
                                            alt="User" 
                                            className="w-10 h-10 rounded-full object-cover border border-white/10 mx-3"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                                            {rUser.name}
                                        </p>
                                        {isMe && <span className="text-[9px] text-primary font-medium tracking-wide">You</span>}
                                    </div>

                                    {/* Score */}
                                    <div className="text-right px-2">
                                        <p className="text-sm font-black text-white">{Math.floor(score).toLocaleString()}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !loading && <div className="text-center py-10 text-gray-600 text-xs">No data available</div>
                    )}
                </div>
            </div>

            {/* --- STICKY FOOTER FOR MY RANK (If I'm not in view or top 3) --- */}
            {myRank && myRank > 3 && !loading && (
                <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-4 bg-gradient-to-t from-black via-black to-transparent">
                    <div className="flex items-center p-3.5 rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-2xl border border-white/10">
                        <div className="w-8 flex justify-center">
                            <span className="text-sm font-bold text-white">{myRank}</span>
                        </div>
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                            alt="Me" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/30 mx-3"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">My Rank</p>
                        </div>
                        <div className="text-right px-2">
                            <p className="text-sm font-black text-white">{Math.floor(myScore).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingScreen;
