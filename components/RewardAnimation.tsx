
import React, { FC, useEffect, useState } from 'react';

interface RewardAnimationProps {
    amount: number;
    texts: any;
    onAnimationEnd: () => void;
}

// Rotating Sunburst/God Rays Effect
const Sunburst: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
        </defs>
        <g fill="url(#grad1)">
            {Array.from({ length: 12 }).map((_, i) => (
                <polygon 
                    key={i} 
                    points="100,100 90,0 110,0" 
                    transform={`rotate(${i * 30} 100 100)`} 
                />
            ))}
        </g>
    </svg>
);

// Premium 3D-style Chest Icon
const PremiumChestIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
            <linearGradient id="chestGold" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="chestPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
        </defs>
        
        {/* Chest Body */}
        <path d="M20 12V22H4V12" fill="url(#chestPurple)" stroke="#4C1D95" strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 7H22V12H2Z" fill="url(#chestGold)" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" />
        
        {/* Straps/Details */}
        <path d="M12 22V7" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" />
        <rect x="10" y="9" width="4" height="6" rx="1" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
        
        {/* Lid Highlight */}
        <path d="M2 7L4.5 4H19.5L22 7" fill="url(#chestGold)" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

const RewardAnimation: FC<RewardAnimationProps> = ({ amount, texts, onAnimationEnd }) => {
    const [stage, setStage] = useState<'pop' | 'shake' | 'open'>('pop');

    useEffect(() => {
        // Stage 1: Entrance (0ms)
        
        // Stage 2: Suspense Shake (600ms)
        const timer1 = setTimeout(() => {
            setStage('shake');
            if (navigator.vibrate) navigator.vibrate(50); // Small Haptic Tick
        }, 600);

        // Stage 3: Reveal Reward (1400ms)
        const timer2 = setTimeout(() => {
            setStage('open');
            if (navigator.vibrate) navigator.vibrate([50, 50, 100]); // Premium Success Haptic
        }, 1400);

        // End: Close (3500ms) - slightly longer to enjoy the view
        const timer3 = setTimeout(onAnimationEnd, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onAnimationEnd]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in transition-all duration-300">
            
            {/* Rotating Sunburst Background */}
            {stage === 'open' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                    <Sunburst className="w-[150vw] h-[150vw] animate-[spin_10s_linear_infinite] opacity-50" />
                </div>
            )}

            {/* Container for Centered Elements */}
            <div className="relative flex flex-col items-center justify-center w-full">

                {/* --- GIFT BOX STAGE --- */}
                <div className={`relative transition-all duration-500 ease-in-out transform
                    ${stage === 'pop' ? 'scale-0 opacity-0 animate-smart-pop-in' : ''}
                    ${stage === 'shake' ? 'scale-110 animate-wallet-shake' : ''}
                    ${stage === 'open' ? 'scale-[1.8] -translate-y-12 opacity-0 absolute' : 'opacity-100'}
                `}>
                    {/* Glow behind box */}
                    <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full animate-pulse"></div>
                    <PremiumChestIcon className="w-32 h-32 relative z-10 drop-shadow-[0_15px_30px_rgba(245,158,11,0.4)]" />
                </div>

                {/* --- REVEAL STAGE --- */}
                {stage === 'open' && (
                    <div className="flex flex-col items-center justify-center animate-smart-slide-up relative z-20">
                        
                        {/* Radiant Background Burst */}
                        <div className="absolute w-[90vw] h-[90vw] max-w-[450px] max-h-[450px] bg-gradient-to-tr from-purple-600/30 to-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
                        
                        {/* Currency Symbol & Amount */}
                        <div className="relative z-10 text-center transform scale-110">
                            <p className="text-yellow-200 font-bold text-lg mb-2 uppercase tracking-[0.2em] drop-shadow-md animate-fade-in-up">Reward Unlocked</p>
                            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-500 drop-shadow-[0_4px_10px_rgba(234,179,8,0.5)] mb-4 animate-smart-pop-in">
                                +{amount}
                            </h1>
                            <div className="flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                <span className="bg-gradient-to-r from-primary to-secondary px-6 py-2 rounded-full border border-white/20 shadow-lg text-white font-bold text-lg tracking-wide flex items-center gap-2">
                                    <span className="text-yellow-300">{texts.currency}</span> Wallet Updated
                                </span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardAnimation;
