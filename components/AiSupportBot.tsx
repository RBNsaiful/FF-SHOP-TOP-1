
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, AppSettings, DiamondOffer, PaymentMethod, SupportContact, LevelUpPackage, Membership, PremiumApp, SpecialOffer, Screen } from '../types';
import { DEFAULT_AI_KEY } from '../constants';
import { db } from '../firebase';
import { ref, get, update, runTransaction } from 'firebase/database';

// --- SOUND ASSETS ---
const SEND_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTSVMAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABzgM0AAAAAAOAAAAAAAAAAAA0gAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAALQAAAAADgOAAA///+5JkAAAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD//+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAADcADQAAAAADgAAAAAAAAAtAAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAAAAAANIAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA"; 
const RECEIVE_SOUND = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABzgM0AAAAAAOAAAAAAAAAAAA0gAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAALQAAAAADgOAAA///+5JkAAAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAADcADQAAAAADgAAAAAAAAAtAAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAAAAAANIAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA";

// --- ANIMATED ICONS ---
const LiveRobotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <style>
      {`
        @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes scan { 0% { transform: translateX(-2px); } 50% { transform: translateX(2px); } 100% { transform: translateX(-2px); } }
        .bot-eyes { animation: blink 4s infinite; transform-origin: center; }
        .bot-antenna { animation: scan 3s ease-in-out infinite; }
      `}
    </style>
    <path d="M12 8V4H8" className="bot-antenna" />
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
    <g className="bot-eyes">
        <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface AiSupportBotProps {
  user: User;
  appSettings: AppSettings;
  diamondOffers: DiamondOffer[];
  paymentMethods: PaymentMethod[];
  supportContacts: SupportContact[];
  levelUpPackages: LevelUpPackage[];
  memberships: Membership[];
  premiumApps: PremiumApp[];
  specialOffers: SpecialOffer[];
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const AiSupportBot: React.FC<AiSupportBotProps> = ({
  user,
  appSettings,
  diamondOffers,
  paymentMethods,
  supportContacts,
  levelUpPackages,
  memberships,
  premiumApps,
  specialOffers,
  activeScreen,
  setActiveScreen
}) => {
  const botName = appSettings.aiName || "Support"; 
  const appName = appSettings.appName || "FF SHOP";
  const DAILY_LIMIT = 30; // Max questions per day
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Custom Greeting (Initial ONLY)
  useEffect(() => {
      if (messages.length === 0) {
          setMessages([{ 
              id: 'init', 
              role: 'model', 
              text: `আসসালামু আলাইকুম, ${user.name}। ${appName}-এ আপনাকে স্বাগতম। আমি আপনার স্মার্ট অ্যাসিস্ট্যান্ট। অ্যাপ সম্পর্কিত যেকোনো প্রশ্ন করতে পারেন।` 
          }]);
      }
  }, [appName, user.name]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentHistory, setRecentHistory] = useState<string>(''); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const playSound = (type: 'send' | 'receive') => {
      try {
          const audio = new Audio(type === 'send' ? SEND_SOUND : RECEIVE_SOUND);
          audio.volume = 0.5;
          audio.play().catch(e => {}); 
      } catch (e) {}
  };

  // Dragging Logic
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
      if (typeof window !== 'undefined') {
          setPosition({ x: window.innerWidth - 75, y: window.innerHeight - 140 });
      }
  }, []);

  // Fetch History
  useEffect(() => {
      if (!user.uid) return;
      const ordersRef = ref(db, `orders/${user.uid}`);
      const txnRef = ref(db, `transactions/${user.uid}`);
      
      const updateHistoryContext = async () => {
          try {
              const [ordersSnap, txnsSnap] = await Promise.all([get(ordersRef), get(txnRef)]);
              let historyStr = "";
              
              if (ordersSnap.exists()) {
                  const oList = Object.values(ordersSnap.val()) as any[];
                  const topOrders = oList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map(o => `[Order: ${o.offer?.name || o.offer?.diamonds}] Status: ${o.status}`);
                  historyStr += "LAST ORDERS:\n" + topOrders.join('\n') + "\n";
              }
              if (txnsSnap.exists()) {
                  const tList = Object.values(txnsSnap.val()) as any[];
                  const topTxns = tList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map(t => `[Deposit: ${t.method} ${t.amount}tk] Status: ${t.status}`);
                  historyStr += "LAST DEPOSITS:\n" + topTxns.join('\n');
              }
              setRecentHistory(historyStr);
          } catch (e) { }
      };
      updateHistoryContext();
  }, [user.uid]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeScreen]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; }}, [input]);

  const handlePointerDown = (e: any) => { isDragging.current = true; hasMoved.current = false; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; dragStartPos.current = { x: clientX, y: clientY }; buttonStartPos.current = { ...position }; };
  const handlePointerMove = (e: any) => { if (!isDragging.current) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const deltaX = clientX - dragStartPos.current.x; const deltaY = clientY - dragStartPos.current.y; if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved.current = true; let newX = buttonStartPos.current.x + deltaX; let newY = buttonStartPos.current.y + deltaY; const maxX = window.innerWidth - 60; const maxY = window.innerHeight - 130; if (newX < 0) newX = 0; if (newX > maxX) newX = maxX; if (newY < 0) newY = 0; if (newY > maxY) newY = maxY; setPosition({ x: newX, y: newY }); };
  const handlePointerUp = () => { isDragging.current = false; };
  const handleButtonClick = () => { if (!hasMoved.current) setActiveScreen('aiChat'); };

  // --- THE LOGIC CORE ---
  const systemInstruction = useMemo(() => {
    
    // 1. Live Features Check
    const availableFeatures = [];
    if (appSettings.visibility?.diamonds) availableFeatures.push("- Diamond Topup");
    if (appSettings.visibility?.levelUp) availableFeatures.push("- Level Up Pass");
    if (appSettings.visibility?.membership) availableFeatures.push("- Weekly/Monthly Membership");
    if (appSettings.visibility?.premium) availableFeatures.push("- Premium Apps (Netflix, YT Pro)");
    if (appSettings.visibility?.earn) availableFeatures.push("- Watch Ads & Earn");
    if (appSettings.visibility?.ranking) availableFeatures.push("- Leaderboard");

    const premiumList = premiumApps.length > 0 ? premiumApps.map(p => `${p.name} (${p.price}৳)`).join(', ') : "None";
    const devInfo = appSettings.developerSettings || { title: "RBN Saiful", url: "N/A" };

    return `
      You are the official Smart Assistant for "${appName}". 
      
      ### CRITICAL: SESSION & GREETING RULES
      1. **NO REPETITIVE WELCOME:** The user has ALREADY been welcomed at the start of this chat.
      2. **If the user says "Hi", "Hello", "Salam", or "Start" AGAIN:**
         - DO NOT introduce yourself again.
         - DO NOT say "Welcome to FF SHOP" again.
         - ONLY say: "Yes, how can I help you?" or "Ji bolun?" (in the user's language).
      
      ### CRITICAL: LANGUAGE DETECTION
      - **DETECT USER LANGUAGE:** 
         - If User types in **English** -> You MUST reply in **English**.
         - If User types in **Bengali/Banglish** -> You MUST reply in **Bengali**.
      - **DO NOT** default to Bengali if the user is asking in English.

      ### APP NAVIGATION & FEATURE AWARENESS (PRIORITY 1)
      **1. CHANGE PASSWORD / UPDATE PASSWORD**
      - **Scenario:** User asks "How to change password?", "Change pass", "Password kibhabe change korbo?".
      - **FACT:** The app HAS a Change Password feature.
      - **ACTION:** Guide them to **Profile > Change Password**.
      - **DO NOT** tell them to Contact Us for this.
      - **Response:** "You can change your password easily. Go to **Profile > Change Password**." (Translate if needed)

      **2. FORGOT PASSWORD / LOGIN ISSUES**
      - **Scenario:** User says "Forgot password", "Cannot login", "Password vule gesi".
      - **FACT:** They cannot access the internal setting.
      - **ACTION:** Direct to **Contact Us**.
      - **Response:** "Since you forgot your password, please contact support via **Profile > Contact Us** for a reset."

      ### SUPPORT RULES (PRIORITY 2 - ERRORS ONLY)
      **CASE A: PAYMENT/ORDER ISSUES**
      - Issues: Order pending, money not added, refund, bug.
      - **Action:** Direct them ONLY to "Profile > Contact Us".
      
      **CASE B: USER ASKS ABOUT DEVELOPER**
      - Issues: "Who made this app?", "Contact Owner", "Who is RBN Saiful?".
      - **Action:** Praise the developer and provide this link: ${devInfo.url}
      - **Developer Name:** ${devInfo.title}

      ### LIVE DATA (READ ONLY)
      **Active Features:** ${availableFeatures.join(', ')}
      **Premium Stock:** ${premiumList}
      **User Name:** ${user.name}
      **User Balance:** ${Math.floor(user.balance)} BDT

      ### TONE
      - Smart, Professional, Concise.
      - Act like a human agent, not a robot repeating scripts.
    `;
  }, [appSettings, user, recentHistory, activeScreen, appName, diamondOffers, paymentMethods, supportContacts, premiumApps, levelUpPackages, memberships]);

  // Rate Limiting
  const checkDailyLimit = async (): Promise<boolean> => {
      const today = new Date().toISOString().split('T')[0];
      const usageRef = ref(db, `users/${user.uid}/aiDailyUsage`);
      const countRef = ref(db, `users/${user.uid}/aiRequestCount`); // Global count ref

      try {
          const snapshot = await get(usageRef);
          let currentUsage = { date: today, count: 0 };
          if (snapshot.exists()) {
              const data = snapshot.val();
              if (data.date === today) currentUsage = data;
          }
          if (currentUsage.count >= DAILY_LIMIT) return false;
          
          // Update daily usage
          await update(ref(db, `users/${user.uid}/aiDailyUsage`), { date: today, count: currentUsage.count + 1 });
          
          // NEW: Increment Total Lifetime Usage for Admin Stats
          await runTransaction(countRef, (currentCount) => {
              return (currentCount || 0) + 1;
          });

          return true;
      } catch (error) { return true; }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input;
    setInput('');
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMessage]);
    playSound('send');
    setIsTyping(true);

    const isAllowed = await checkDailyLimit();
    if (!isAllowed) {
        setIsTyping(false);
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: `দুঃখিত ${user.name}, আপনার আজকের লিমিট শেষ। জরুরি প্রয়োজনে সাপোর্টে যোগাযোগ করুন।` 
            }]);
            playSound('receive');
        }, 500);
        return;
    }

    try {
      // Prioritize process.env.API_KEY to prevent 403 errors, fallback to user settings
      const apiKey = process.env.API_KEY || (appSettings.aiApiKey ? appSettings.aiApiKey.trim() : "") || DEFAULT_AI_KEY;
      
      if (!apiKey) {
          throw new Error("API Key Missing");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const chat = ai.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction: systemInstruction }, history: history });

      const result = await chat.sendMessageStream({ message: userMessageText });
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', text: '' }]);

      let fullText = '';
      let soundPlayed = false;

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
            if (!soundPlayed) { playSound('receive'); soundPlayed = true; }
            fullText += chunkText;
            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fullText } : m));
        }
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "নেটওয়ার্ক সমস্যার কারণে উত্তর দিতে পারছি না। দয়া করে আবার চেষ্টা করুন।";
      if (error.message === "API Key Missing") {
          errorMsg = "সিস্টেম এরর: AI কনফিগারেশন সেট করা নেই। অ্যাডমিনকে জানান।";
      } else if (error.status === 403 || (error.message && error.message.includes('403'))) {
          errorMsg = "সিস্টেম এরর: AI পারমিশন নেই (403)। অ্যাডমিনকে API Key চেক করতে বলুন।";
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (!appSettings.aiSupportActive) return null;

  return (
    <>
      {activeScreen !== 'aiChat' && (
        <div
            onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
            onClick={handleButtonClick}
            style={{ left: position.x, top: position.y, position: 'fixed', zIndex: 50, touchAction: 'none' }}
            className="cursor-move active:cursor-grabbing"
        >
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-2.5 rounded-full shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center">
                <LiveRobotIcon className="w-7 h-7" />
            </div>
        </div>
      )}

      {activeScreen === 'aiChat' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-light-bg dark:bg-dark-bg animate-smart-slide-up w-full h-full">
          <div className="flex items-center justify-between py-3 px-4 bg-light-bg dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveScreen('home')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"><ArrowLeftIcon className="w-6 h-6" /></button>
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-full text-white shadow-md">
                          <LiveRobotIcon className="w-5 h-5" />
                      </div>
                  </div>
                  <div><h3 className="font-bold text-lg text-gray-900 dark:text-white leading-none">{botName}</h3></div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0F172A] scroll-smooth pb-20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center self-end mb-1 text-white shadow-sm flex-shrink-0">
                        <LiveRobotIcon className="w-4 h-4" />
                    </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative break-words whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && (
                <div className="flex justify-start w-full items-end">
                    <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                        <LiveRobotIcon className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 flex gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 sticky bottom-0 w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="এখানে লিখুন..." rows={1} className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed pt-1.5" style={{ minHeight: '24px' }} />
            </div>
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center mb-0.5 ${!input.trim() || isTyping ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark active:scale-95'}`}><SendIcon className="w-5 h-5 ml-0.5" /></button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiSupportBot;