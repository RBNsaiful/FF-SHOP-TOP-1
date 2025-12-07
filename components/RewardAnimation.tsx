
import React, { FC, useEffect, useState } from 'react';

interface RewardAnimationProps {
    amount: number;
    texts: any;
    onAnimationEnd: () => void;
}

const RewardAnimation: FC<RewardAnimationProps> = ({ amount, texts, onAnimationEnd }) => {
    const [step, setStep] = useState<'idle' | 'shaking' | 'opening' | 'finished'>('idle');

    useEffect(() => {
        // Load Confetti Script dynamically if not present
        if (!(window as any).confetti) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
            script.async = true;
            document.body.appendChild(script);
        }

        // 2. Start Animation Sequence
        const sequence = async () => {
            // Initial short delay
            await new Promise(r => setTimeout(r, 200));
            
            // --- STEP 1: SHAKE (Rapid & Strong) ---
            setStep('shaking');

            // Shake duration (1.5 seconds)
            await new Promise(r => setTimeout(r, 1500));

            // --- STEP 2: OPEN LID ---
            setStep('opening');
            
            // Delay before money pops (0.5s) - allow lid to start moving
            await new Promise(r => setTimeout(r, 400));
            
            // --- STEP 3: MONEY POP & VIBRATION ---
            
            // Trigger Vibration (200ms) - Replaces Sound
            if (navigator.vibrate) {
                try {
                    navigator.vibrate(200);
                } catch (e) {
                    // Ignore if vibration not supported/allowed
                }
            }

            // Fire Confetti
            if ((window as any).confetti) {
                 (window as any).confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.6 },
                    zIndex: 10001,
                    scalar: 1.2,
                    colors: ['#FFD700', '#FFA500', '#ffffff'] // Gold & White confetti
                 });
            }

            // Visible duration (Money stays for 3 seconds)
            await new Promise(r => setTimeout(r, 3000));
            
            // --- STEP 4: FINISH ---
            setStep('finished');
            onAnimationEnd();
        };

        sequence();

    }, [onAnimationEnd]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <style>{`
                /* 1. SHAKE ANIMATION */
                @keyframes violent-shake {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    10% { transform: translate(-3px, -3px) rotate(-3deg); }
                    20% { transform: translate(3px, 3px) rotate(3deg); }
                    30% { transform: translate(-3px, 3px) rotate(-3deg); }
                    40% { transform: translate(3px, -3px) rotate(3deg); }
                    50% { transform: translate(-2px, -2px) rotate(-2deg); }
                    60% { transform: translate(2px, 2px) rotate(2deg); }
                    70% { transform: translate(-2px, 2px) rotate(-2deg); }
                    80% { transform: translate(2px, -2px) rotate(2deg); }
                    90% { transform: translate(-1px, 1px) rotate(-1deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                /* 2. LID FLY OFF ANIMATION - Revised for better visuals */
                @keyframes lid-open-and-fly {
                    0% { transform: translateY(0) rotate(0deg); }
                    40% { transform: translateY(-60px) rotate(-20deg); } /* Initial pop up */
                    100% { transform: translateY(-400px) translateX(100px) rotate(-120deg) scale(0.8); opacity: 0; } /* Fly away */
                }

                /* 3. MONEY POP UP ANIMATION */
                @keyframes pop-up-money {
                    0% { transform: translate(-50%, 50px) scale(0.5); opacity: 0; }
                    40% { transform: translate(-50%, -150px) scale(1.1); opacity: 1; }
                    70% { transform: translate(-50%, -200px) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -210px) scale(1.0); opacity: 1; }
                }

                /* --- CONTAINER --- */
                .gift-container {
                    position: relative;
                    width: 160px;
                    height: 128px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    perspective: 1000px;
                    margin-top: 100px;
                }

                .gift-container.shaking {
                    animation: violent-shake 0.08s infinite;
                }

                /* --- LID (Premium Purple Gradient) --- */
                .gift-lid {
                    position: absolute;
                    top: -12px;
                    left: -8px;
                    width: 176px;
                    height: 44px;
                    background: linear-gradient(135deg, #7C3AED, #5B21B6, #4C1D95);
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
                    z-index: 30; /* Highest z-index */
                    transform-origin: bottom center;
                    border: 1px solid #4C1D95;
                }
                
                /* Trigger animation when class 'opening' is added */
                .gift-container.opening .gift-lid {
                    animation: lid-open-and-fly 0.8s ease-in forwards;
                }

                /* Ribbon on Lid */
                .gift-lid::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    width: 28px;
                    background: linear-gradient(to right, #FCD34D, #F59E0B);
                    transform: translateX(-50%);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .gift-lid::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 28px;
                    background: linear-gradient(to bottom, #FCD34D, #F59E0B);
                    transform: translateY(-50%);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }

                /* Bow */
                .gift-bow {
                    position: absolute;
                    top: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 56px;
                    height: 28px;
                    z-index: 35;
                }
                .gift-bow::before, .gift-bow::after {
                    content: '';
                    position: absolute;
                    width: 36px;
                    height: 36px;
                    border: 8px solid #FCD34D;
                    border-radius: 50%;
                    top: 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .gift-bow::before { left: -18px; transform: rotate(-30deg); border-bottom-color: transparent; border-right-color: transparent; }
                .gift-bow::after { right: -18px; transform: rotate(30deg); border-bottom-color: transparent; border-left-color: transparent; }

                /* --- BODY (Front) --- */
                .gift-body {
                    position: relative;
                    width: 160px;
                    height: 112px;
                    background: linear-gradient(135deg, #FFD700 0%, #F59E0B 40%, #D97706 100%);
                    border-radius: 0 0 12px 12px;
                    z-index: 20; /* In front of money */
                    box-shadow: 0 20px 50px rgba(0,0,0,0.7), inset 0 -5px 10px rgba(0,0,0,0.1);
                    border: 1px solid #B45309;
                }
                .gift-body::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    width: 28px;
                    background: linear-gradient(to right, #7C3AED, #5B21B6);
                    transform: translateX(-50%);
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                }

                /* --- BACK (Inside) --- */
                .gift-back {
                    position: absolute;
                    width: 152px;
                    height: 104px;
                    background: #92400E;
                    border-radius: 0 0 12px 12px;
                    z-index: 1; /* Behind money */
                    bottom: 4px;
                    left: 4px;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                }

                /* --- MONEY WRAPPER --- */
                .money-wrapper {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, 50px); /* Start hidden deep inside */
                    opacity: 0;
                    z-index: 10; /* Sandwiched between Front (20) and Back (1) */
                    pointer-events: none;
                    width: 300px;
                    text-align: center;
                }

                .gift-container.opening .money-wrapper {
                    animation: pop-up-money 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    animation-delay: 0.3s; 
                }

                .money-text {
                    display: inline-block;
                    font-size: 4.5rem;
                    font-weight: 900;
                    color: #fff;
                    background: linear-gradient(to bottom, #FFD700, #FBBF24);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0px 4px 15px rgba(0,0,0,0.6);
                    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.9));
                    font-family: 'Poppins', sans-serif;
                    white-space: nowrap;
                    line-height: 1;
                }
                
                .money-label {
                    display: block;
                    font-size: 1.2rem;
                    color: #fff;
                    margin-top: 5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                }
            `}</style>

            <div className={`gift-container ${step === 'shaking' ? 'shaking' : ''} ${step === 'opening' || step === 'finished' ? 'opening' : ''}`}>
                
                {/* 1. Back Face (Z-index: 1) */}
                <div className="gift-back"></div>

                {/* 2. Money (Z-index: 10 - pops up from here) */}
                <div className="money-wrapper">
                    <div className="money-text">
                        {texts.currency}{amount}
                    </div>
                    <span className="money-label">Reward</span>
                </div>

                {/* 3. Front Face (Z-index: 20) */}
                <div className="gift-body"></div>

                {/* 4. Lid (Z-index: 30) */}
                <div className="gift-lid">
                    <div className="gift-bow"></div>
                </div>
            </div>
        </div>
    );
};

export default RewardAnimation;
