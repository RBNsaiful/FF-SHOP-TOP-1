
import React, { useState, FC, useRef, useEffect } from 'react';
import { DEFAULT_AVATAR_URL } from '../constants';
import type { User, EarnSettings } from '../types';
import { db } from '../firebase';
import { ref, update, runTransaction, push } from 'firebase/database';
import VideoAdPlayer from './VideoAdPlayer';
import AdRenderer from './AdRenderer'; // Import AdRenderer

// Icons
const PlayCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" /></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const GiftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const TotalEarnedIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const TotalAdsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M3 12h5l-1.42 1.42A2 2 0 0 0 6.17 16H9"/><path d="M3 20h2"/><path d="M17 4h4"/><path d="M17 8h4"/><path d="M17 12h4"/><path d="M3 4h10v10H3z"/></svg>);
const AdMobIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v12"/><path d="M8 10l4-4 4 4"/></svg>); 
const ZapIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const ShieldIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);


interface WatchAdsScreenProps {
    user: User;
    texts: any;
    onRewardEarned: (amount: number, showAnim: boolean) => void;
    earnSettings?: EarnSettings;
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


const WatchAdsScreen: FC<WatchAdsScreenProps> = ({ user, texts, onRewardEarned, earnSettings }) => {
    // UI States
    const [showWebAd, setShowWebAd] = useState(false);
    const [showAdMobSimulator, setShowAdMobSimulator] = useState(false); // For Web Preview of AdMob flow
    const [isRewardPending, setIsRewardPending] = useState(false);
    const [timerString, setTimerString] = useState<string | null>(null);
    const [adCooldown, setAdCooldown] = useState(0);
    const [enableAnimations, setEnableAnimations] = useState(true);
    const [showVpnWarning, setShowVpnWarning] = useState(false);
    const [vpnMode, setVpnMode] = useState<'notice' | 'force'>('notice');
    const [isAdLoading, setIsAdLoading] = useState(false); // Track ad loading state
    const [isCheckingVpn, setIsCheckingVpn] = useState(false); // New state for checking VPN
    
    const cooldownTimerRef = useRef<number | null>(null);
    const resetTimerRef = useRef<number | null>(null);

    // Force Scroll Top on Mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

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
    
    // New Ad Code
    const earnAdCode = earnSettings?.earnAdCode || '';
    const earnAdActive = earnSettings?.earnAdActive ?? true;

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
    const handleStartAd = async () => {
        if (isAdLoading || isCheckingVpn) return; // Prevent double taps

        // 1. Check Limits
        if ((user.adsWatchedInfo?.count || 0) >= dailyLimit) {
            alert(texts.adLimitReached);
            return;
        }
        if (adCooldown > 0) return;

        // @ts-ignore
        const isApk = !!(window.admob || window.AdMob || window.Android); 

        // 2. FORCE MODE CHECK (Global - Web & APK)
        // SILENT CHECK FIRST: Don't annoy the user if they are already connected.
        if (earnSettings?.vpnRequired) {
            setIsCheckingVpn(true); // Show spinner on button
            const isVpnConnected = await checkIpLocation();
            setIsCheckingVpn(false);

            if (isVpnConnected) {
                // VPN IS GOOD: Proceed to play ad without popup
                playAdMobAd();
            } else {
                // VPN IS BAD: Show Popup Warning
                setVpnMode('force');
                setShowVpnWarning(true);
            }
            return;
        }

        // 3. APK Only Logic (If Force Mode is OFF)
        if (isApk) {
            playAdMobAd();
            return;
        }

        // 4. Web Logic (If Force Mode is OFF)
        // Check for Web Notice Toggle
        if (earnSettings?.vpnNoticeActive) {
            const hasSeenNotice = sessionStorage.getItem('vpn_notice_seen');
            if (!hasSeenNotice) {
                setVpnMode('notice');
                setShowVpnWarning(true);
                return;
            }
        }

        // If no notice required or already seen
        if (adMobActive) {
            playAdMobAd();
        } else if (webAdActive) {
            playWebAd();
        } else {
            alert("No ads available right now. Please contact admin.");
        }
    };

    const handleConfirmVpnPopup = async () => {
        if (vpnMode === 'notice') {
            setShowVpnWarning(false);
            // WEB: Mark as seen for session, then load ad (No strict check for notice mode)
            sessionStorage.setItem('vpn_notice_seen', 'true');
            if (adMobActive) {
                playAdMobAd();
            } else if (webAdActive) {
                playWebAd();
            }
        } else {
            // FORCE MODE: User says "Yes I Connected", so we check again.
            setIsCheckingVpn(true);
            const isVpnConnected = await checkIpLocation();
            setIsCheckingVpn(false);

            if (isVpnConnected) {
                setShowVpnWarning(false);
                playAdMobAd(); 
            } else {
                alert("❌ VPN Not Detected or Wrong Country! Please connect to US, UK, CA, DE, or AU.");
            }
        }
    };

    // --- REAL IP CHECK FUNCTION WITH FALLBACK ---
    const checkIpLocation = async (): Promise<boolean> => {
        const allowedCountries = ['US', 'GB', 'CA', 'DE', 'AU'];
        
        try {
            // First Try: ipapi.co (Free, but limited)
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data && data.country_code) {
                console.log("VPN Check (ipapi.co):", data.country_code);
                return allowedCountries.includes(data.country_code);
            }
        } catch (error) {
            console.warn("ipapi.co failed, trying fallback...");
        }

        try {
            // Fallback: api.country.is
            const response = await fetch('https://api.country.is');
            const data = await response.json();
            
            if (data && data.country) {
                console.log("VPN Check (country.is):", data.country);
                return allowedCountries.includes(data.country);
            }
        } catch (err) {
            console.error("All IP checks failed");
            // If all checks fail (e.g. adblocker, network error), assume FALSE to prevent abuse in Force Mode
            // Returning true here would defeat the purpose of "Force VPN".
            return false; 
        }
        
        return false;
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

    // --- ADMOB LOGIC ---
    const playAdMobAd = async () => {
        setIsAdLoading(true);

        // 1. DETECT NATIVE PLUGIN
        // @ts-ignore
        const nativeAdMob = window.admob || window.AdMob;

        if (nativeAdMob) {
            console.log("🔥 Native AdMob Plugin Detected!");
            
            try {
                // A. CREATE REWARD VIDEO INSTANCE
                // @ts-ignore
                const rewardVideo = new nativeAdMob.RewardVideo({
                    id: adMobRewardId || 'ca-app-pub-3940256099942544/5224354917' // Use Test ID if admin ID missing
                });

                // B. LISTENERS
                // @ts-ignore
                rewardVideo.on('load', async () => {
                    await rewardVideo.show();
                });

                // @ts-ignore
                rewardVideo.on('reward', (evt) => {
                    handleRewardClaim(); 
                });

                // @ts-ignore
                rewardVideo.on('dismiss', () => {
                    setIsAdLoading(false);
                });

                // @ts-ignore
                rewardVideo.on('loadfail', (err) => {
                    console.error('AdMob Load Failed:', err);
                    setIsAdLoading(false);
                    alert("Ad failed to load. Please try again or check connection.");
                });

                // C. TRIGGER LOAD
                await rewardVideo.load();

            } catch (err) {
                console.error("❌ AdMob Native Logic Error:", err);
                setIsAdLoading(false);
                alert("Error initializing AdMob. Please ensure the plugin is installed correctly in the APK.");
            }

        } else {
            // 2. WEB SIMULATION (No Native Plugin Found)
            console.log("⚠️ Native AdMob not found. Running Web Simulation.");
            setIsAdLoading(false);
            
            setShowAdMobSimulator(true);
            setTimeout(() => {
                setShowAdMobSimulator(false);
                handleRewardClaim(); // Auto claim for web test
            }, 3000);
        }
    };


    // --- REWARD PROCESSING (Atomic Transaction) ---
    const handleRewardClaim = async () => {
        if (!user.uid) return;

        // Firebase Logic
        const userRef = ref(db, 'users/' + user.uid);
        const today = new Date().toISOString().split('T')[0];

        try {
            let rewarded = false;
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
                        rewarded = true; // Mark as successful locally
                        return userData;
                    } else {
                        // Limit reached, do not increment balance
                        return; 
                    }
                }
                return userData;
            });

            if (rewarded) {
                onRewardEarned(rewardAmount, enableAnimations);
                setAdCooldown(cooldownTime); 

                // NEW: Log Transaction for Admin Stats (Hidden from User Transaction View usually, but good for records)
                const txnRef = ref(db, 'transactions/' + user.uid);
                await push(txnRef, {
                    type: 'ad_reward',
                    amount: rewardAmount,
                    method: 'Ad Watch',
                    transactionId: `AD${Date.now()}`, // Fake ID
                    date: new Date().toISOString(),
                    status: 'Completed',
                    id: `AD${Date.now()}`,
                    userId: user.uid
                });
            }

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

            {/* VPN Warning Popup */}
            {showVpnWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-smart-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-smart-pop-in">
                        {/* Header Image Area */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center animate-pulse">
                                <ShieldIcon className="w-10 h-10 text-red-500" />
                            </div>
                        </div>
                        
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                                VPN Required
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                {vpnMode === 'notice' 
                                    ? "To earn maximum rewards, please connect to a VPN (USA/UK/Canada). Do you want to continue?"
                                    : "You must connect to a VPN (USA/UK/Canada) to watch ads and earn rewards."
                                }
                            </p>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleConfirmVpnPopup}
                                    disabled={isCheckingVpn}
                                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center
                                        ${isCheckingVpn ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}
                                    `}
                                >
                                    {isCheckingVpn ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>
                                            Checking IP...
                                        </>
                                    ) : "YES, I CONNECTED"}
                                </button>
                                <button 
                                    onClick={() => setShowVpnWarning(false)}
                                    disabled={isCheckingVpn}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
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
                            disabled={showWebAd || showAdMobSimulator || isAdLoading || isCheckingVpn || adCooldown > 0}
                            className={`w-full text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg shadow-lg transition-all duration-300 transform 
                                ${showWebAd || showAdMobSimulator || isAdLoading || isCheckingVpn || adCooldown > 0
                                    ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 shadow-primary/30'}`}
                        >
                            {isCheckingVpn ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    <span>Checking IP...</span>
                                </div>
                            ) : isAdLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    <span>Loading Ad...</span>
                                </div>
                            ) : adCooldown > 0 ? (
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

                {/* --- FOOTER ADVERTISEMENT (Scroll to View) --- */}
                {earnAdCode && (
                    <div className="mt-8 animate-fade-in w-full flex justify-center">
                        <AdRenderer code={earnAdCode} active={earnAdActive} />
                    </div>
                )}

            </main>
        </div>
    );
};

export default WatchAdsScreen;
