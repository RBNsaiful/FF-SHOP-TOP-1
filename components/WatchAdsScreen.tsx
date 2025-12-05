import React, { useState, FC, useRef, useEffect } from 'react';
import { DEFAULT_AVATAR_URL } from '../constants';
import type { User, EarnSettings } from '../types';
import { db } from '../firebase';
import { ref, update, runTransaction } from 'firebase/database';
import VideoAdPlayer from './VideoAdPlayer';

// Icons
const PlayCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" /></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const GiftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const TotalEarnedIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const TotalAdsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M3 12h5l-1.42 1.42A2 2 0 0 0 6.17 16H9"/><path d="M3 20h2"/><path d="M17 4h4"/><path d="M17 8h4"/><path d="M17 12h4"/><path d="M3 4h10v10H3z"/></svg>);
const AdMobIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v12"/><path d="M8 10l4-4 4 4"/></svg>); 
const ZapIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);


interface WatchAdsScreenProps {
    user: User;
    texts: any;
    onRewardEarned: (amount: number, showAnim: boolean) => void;
    earnSettings?: EarnSettings;
    onUpdateUser: (updatedData: Partial<User>) => void;
}

const InfoItem: FC<{ icon: FC<{className?: string}>, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
        <div className="p-3 bg-white/10 rounded-full mb-2">
            <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-2xl font-black text-white drop-shadow-md">
            {value}
        </p>
        <p className="text-xs font-bold text-white/70 uppercase tracking-wider mt-1">{label}</p>
    </div>
);


const WatchAdsScreen: FC<WatchAdsScreenProps> = ({ user, texts, onRewardEarned, earnSettings, onUpdateUser }) => {
    // UI States
    const [showWebAd, setShowWebAd] = useState(false);
    const [showAdMobSimulator, setShowAdMobSimulator] = useState(false); // For Web Preview of AdMob flow
    const [isRewardPending, setIsRewardPending] = useState(false);
    const [timerString, setTimerString] = useState<string | null>(null);
    const [adCooldown, setAdCooldown] = useState(0);
    const [enableAnimations, setEnableAnimations] = useState(true);
    
    const cooldownTimerRef = useRef<number | null>(null);
    const resetTimerRef = useRef<number | null>(null);

    // --- Extract Settings (with safe defaults) ---
    const dailyLimit = earnSettings?.dailyLimit ?? 20;
    const rewardAmount = earnSettings?.rewardPerAd ?? 5;
    const cooldownTime = earnSettings?.adCooldownSeconds ?? 10;
    const resetHours = earnSettings?.resetHours ?? 24;
    
    // Configs for specific ad types
    const webAdActive = earnSettings?.webAds?.active ?? true; // Default to true if undefined
    const webAdUrl = earnSettings?.webAds?.url || '';
    const webAdDuration = earnSettings?.webAds?.duration || 15;

    const adMobActive = earnSettings?.adMob?.active ?? false;
    const adMobRewardId = earnSettings?.adMob?.rewardId || '';

    // --- Init Local Storage Preference ---
    useEffect(() => {
        const savedPref = localStorage.getItem('settings_reward_anim');
        if (savedPref !== null) {
            setEnableAnimations(savedPref === 'true');
        }
    }, []);

    const toggleAnimations = () => {
        const newState = !enableAnimations;
        setEnableAnimations(newState);
        localStorage.setItem('settings_reward_anim', String(newState));
    };

    // --- Logic ---

    // 1. Cooldown Timer Logic
    useEffect(() => {
        if (adCooldown > 0) {
            cooldownTimerRef.current = window.setTimeout(() => setAdCooldown(adCooldown - 1), 1000);
        }
        return () => {
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        };
    }, [adCooldown]);

    // 2. 24-Hour Reset Logic
    useEffect(() => {
        const checkReset = () => {
            if (user.adsWatchedInfo?.limitReachedAt) {
                const now = Date.now();
                const limitReachedTime = user.adsWatchedInfo.limitReachedAt;
                const resetDurationMs = resetHours * 60 * 60 * 1000;
                const timePassed = now - limitReachedTime;

                if (timePassed >= resetDurationMs) {
                    // Reset allowed
                    if (user.uid) {
                        const userRef = ref(db, 'users/' + user.uid);
                        // Safe to use update here as this is a reset logic, not transactional currency
                        update(userRef, {
                            adsWatchedInfo: { count: 0, date: new Date().toISOString().split('T')[0], limitReachedAt: null }
                        });
                    }
                    setTimerString(null);
                } else {
                    // Update Countdown String
                    const remainingMs = resetDurationMs - timePassed;
                    const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
                    const seconds = Math.floor((remainingMs / 1000) % 60);
                    setTimerString(`${hours}h ${minutes}m ${seconds}s`);
                }
            } else {
                setTimerString(null);
            }
        };

        checkReset();
        resetTimerRef.current = window.setInterval(checkReset, 1000);
        return () => { if (resetTimerRef.current) clearInterval(resetTimerRef.current); };
    }, [user.adsWatchedInfo?.limitReachedAt, resetHours, user.uid]);


    // --- Main Action Handler ---
    const handleStartAd = () => {
        // Priority Check: AdMob > Web Ads (if both are active, ideally only one should be active)
        // But user requested if AdMob = ON use AdMob, if Web = ON use Web.
        
        if (adMobActive) {
            playAdMobAd();
        } else if (webAdActive) {
            playWebAd();
        } else {
            alert("No ads available right now. Please contact admin.");
        }
    };

    // --- WEB AD LOGIC ---
    const playWebAd = () => {
        if (webAdUrl) {
            setShowWebAd(true);
            setIsRewardPending(false);
        } else {
            // Fallback if URL is empty but active (simulate)
            simulateAdWatch();
        }
    };

    const simulateAdWatch = () => {
        setShowWebAd(true); // Re-use web overlay but show loading
        setTimeout(() => {
            handleRewardClaim();
            setShowWebAd(false);
        }, 2000);
    };

    const handleWebAdComplete = () => {
        setIsRewardPending(true);
    };

    const handleWebAdClose = () => {
        setShowWebAd(false);
        if (isRewardPending) {
            handleRewardClaim();
            setIsRewardPending(false);
        }
    };

    // --- ADMOB LOGIC (Hybrid Support) ---
    const playAdMobAd = () => {
        // 1. Check if Native AdMob Plugin is available (For future APK)
        // @ts-ignore
        if (window.AdMob) {
            // REAL APK CODE WOULD GO HERE
            // AdMob.showRewardVideoAd({ adId: adMobRewardId }).then(...)
            console.log("Running Native AdMob Logic with ID:", adMobRewardId);
        } else {
            // 2. Web Simulation (Since we are in Browser now)
            setShowAdMobSimulator(true);
            setTimeout(() => {
                setShowAdMobSimulator(false);
                handleRewardClaim(); // Auto claim for test
            }, 3000);
        }
    };


    // --- REWARD PROCESSING (Atomic Transaction) ---
    const handleRewardClaim = async () => {
        if (!user.uid) return;

        // Guest User Logic (Bypass Firebase)
        if (user.uid.startsWith("guest_") || user.role === 'admin' && user.uid === 'guest_demo_123') {
             const today = new Date().toISOString().split('T')[0];
             const currentInfo = user.adsWatchedInfo && user.adsWatchedInfo.date === today 
                ? user.adsWatchedInfo 
                : { count: 0, date: today };
             
             if ((currentInfo.count || 0) < dailyLimit) {
                 const newCount = (currentInfo.count || 0) + 1;
                 const newBalance = (user.balance || 0) + rewardAmount;
                 
                 const updatedInfo = {
                     count: newCount,
                     date: today,
                     lastAdTimestamp: Date.now(),
                     limitReachedAt: newCount >= dailyLimit ? Date.now() : undefined
                 };

                 // Update Local State via Parent Wrapper
                 onUpdateUser({
                     balance: newBalance,
                     totalEarned: (user.totalEarned || 0) + rewardAmount,
                     totalAdsWatched: (user.totalAdsWatched || 0) + 1,
                     adsWatchedInfo: updatedInfo
                 });
                 
                 onRewardEarned(rewardAmount, enableAnimations);
                 setAdCooldown(cooldownTime);
             }
             return;
        }

        // Firebase Logic
        const userRef = ref(db, 'users/' + user.uid);
        const today = new Date().toISOString().split('T')[0];

        try {
            await runTransaction(userRef, (userData) => {
                if (userData) {
                    const currentInfo = userData.adsWatchedInfo || { count: 0, date: today };
                    
                    // Reset count if date changed inside transaction (double safety)
                    if (currentInfo.date !== today) {
                        currentInfo.count = 0;
                        currentInfo.date = today;
                        currentInfo.limitReachedAt = null;
                    }

                    if (currentInfo.count < dailyLimit) {
                        userData.balance = (userData.balance || 0) + rewardAmount;
                        userData.totalEarned = (userData.totalEarned || 0) + rewardAmount;
                        userData.totalAdsWatched = (userData.totalAdsWatched || 0) + 1;
                        
                        currentInfo.count = (currentInfo.count || 0) + 1;
                        currentInfo.lastAdTimestamp = Date.now();

                        if (currentInfo.count >= dailyLimit) {
                            currentInfo.limitReachedAt = Date.now();
                        }
                        
                        userData.adsWatchedInfo = currentInfo;
                        return userData;
                    } else {
                        // Limit reached, do not increment balance
                        return; 
                    }
                }
                return userData;
            });

            onRewardEarned(rewardAmount, enableAnimations);
            
            // Only set local cooldown if we successfully watched
            setAdCooldown(cooldownTime); 

        } catch (error) {
            console.error("Reward Transaction failed", error);
        }
    };

    const currentCount = user.adsWatchedInfo?.count || 0;
    const isLocked = !!user.adsWatchedInfo?.limitReachedAt; 
    const progressPercentage = Math.min((currentCount / dailyLimit) * 100, 100);

    return (
        <div className="relative bg-gradient-to-b from-primary to-secondary min-h-screen -mt-16 pt-16 pb-24 text-white">
            
            {/* --- Web Ad Player Overlay --- */}
            {showWebAd && webAdUrl && (
                <VideoAdPlayer 
                    videoUrl={webAdUrl}
                    onComplete={handleWebAdComplete}
                    onClose={handleWebAdClose}
                    duration={webAdDuration}
                />
            )}

            {/* --- Web Ad Fallback Loading --- */}
            {showWebAd && !webAdUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p>Loading Web Ad...</p>
                </div>
            )}

            {/* --- AdMob Simulation Overlay (For Web Preview) --- */}
            {showAdMobSimulator && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
                    <div className="bg-white text-black p-6 rounded-xl text-center max-w-xs">
                        <AdMobIcon className="w-12 h-12 mx-auto mb-2 text-blue-600"/>
                        <h3 className="font-bold text-lg">AdMob Reward Ad</h3>
                        <p className="text-sm text-gray-500 mb-4">(Simulation for Web)</p>
                        <p className="text-xs text-gray-400 font-mono mb-4">ID: {adMobRewardId || 'TEST-ID'}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                            <div className="bg-blue-600 h-1.5 rounded-full animate-[width_3s_linear]"></div>
                        </div>
                        <p className="text-xs font-bold text-blue-600">Playing Ad...</p>
                    </div>
                </div>
            )}

            <main className="w-full px-4 space-y-5">
                <header className="flex flex-col items-center text-center mb-4 animate-fade-in-up">
                    <img 
                        src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg mb-4"
                    />
                    <h1 className="text-2xl sm:text-3xl font-extrabold drop-shadow-lg uppercase tracking-wider">
                        {texts.watchAdsScreenTitle}
                    </h1>
                </header>

                <div 
                    className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" 
                    style={{ animationDelay: '150ms' }}
                >
                    <div className="flex justify-between items-center mb-2 text-sm font-medium">
                        <p>Daily Progress</p>
                        <p>{currentCount} / {dailyLimit}</p>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mb-5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-[#32CD32] to-green-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}>
                        </div>
                    </div>

                    {isLocked ? (
                        <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                            <p className="text-sm text-white/80 mb-1">{texts.adLimitReached}</p>
                            <p className="text-xs text-white/60 mb-3">Come back in:</p>
                            <div className="text-2xl font-mono font-bold text-yellow-300 tracking-widest animate-pulse">
                                {timerString || "Loading..."}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartAd}
                            disabled={showWebAd || showAdMobSimulator || adCooldown > 0}
                            className={`w-full text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg shadow-lg transition-all duration-300 transform 
                                ${showWebAd || showAdMobSimulator || adCooldown > 0
                                    ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 shadow-primary/30'}`}
                        >
                            {adCooldown > 0 ? (
                                <span className="flex items-center font-mono text-lg">
                                    <ClockIcon className="w-6 h-6 mr-2" />
                                    {texts.nextAdIn} {adCooldown}s
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <PlayCircleIcon className="w-7 h-7 mr-3" />
                                    {texts.watchAnAd}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div 
                    className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" 
                    style={{ animationDelay: '300ms' }}
                >
                    <div className="flex justify-around items-start">
                        <InfoItem icon={TotalEarnedIcon} label={texts.totalEarned} value={`${texts.currency}${Math.floor(user.totalEarned)}`} />
                        <InfoItem icon={TotalAdsIcon} label={texts.totalAdsWatched} value={user.totalAdsWatched} />
                    </div>
                </div>
                
                <div 
                    className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" 
                    style={{ animationDelay: '450ms' }}
                >
                    <div className="flex justify-around items-start">
                        <InfoItem icon={GiftIcon} label={texts.rewardPerAd} value={`${texts.currency}${rewardAmount}`} />
                        <InfoItem icon={ClockIcon} label={texts.dailyAdLimit} value={dailyLimit} />
                    </div>
                </div>

                {/* Animation Toggle */}
                <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-sm animate-fade-in-up" style={{ animationDelay: '550ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <ZapIcon className="w-5 h-5 text-purple-300" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Show Reward Animation</span>
                    </div>
                    
                    <button 
                        onClick={toggleAnimations}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${enableAnimations ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enableAnimations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

            </main>
        </div>
    );
};

export default WatchAdsScreen;