
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, AppSettings, DiamondOffer, PaymentMethod, SupportContact, LevelUpPackage, Membership, PremiumApp, SpecialOffer, Screen } from '../types';
import { DEFAULT_AI_KEY } from '../constants';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

// --- SOUND ASSETS (Short, crisp UI sounds) ---
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
    {/* Animated Eyes */}
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
  const botName = appSettings.aiName || "Smart Assistant"; 
  const appName = appSettings.appName || "FF SHOP";
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
      const greeting = `আসসালামু আলাইকুম ${user.name}! ${appName}-এর সাপোর্টে আপনাকে স্বাগতম। অ্যাপের যেকোনো ফিচার বা সমস্যা নিয়ে আমাকে প্রশ্ন করতে পারেন।`;
      setMessages([{ id: 'init', role: 'model', text: greeting }]);
  }, [user.name, appName]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentHistory, setRecentHistory] = useState<string>(''); 
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // RANKING STATE
  const [rankingData, setRankingData] = useState<{ tradingRank: number | string, earningRank: number | string }>({ tradingRank: 'N/A', earningRank: 'N/A' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- AUDIO UTILS ---
  const playSound = (type: 'send' | 'receive') => {
      try {
          const audio = new Audio(type === 'send' ? SEND_SOUND : RECEIVE_SOUND);
          audio.volume = 0.5;
          audio.play().catch(e => {}); // Audio blocked
      } catch (e) {}
  };

  // --- DRAGGABLE BUTTON STATE ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
      if (typeof window !== 'undefined') {
          setPosition({
              x: window.innerWidth - 75,
              y: window.innerHeight - 140
          });
      }
  }, []);

  // --- 1. CALCULATE RANKING & HISTORY ---
  useEffect(() => {
      if (!user.uid) return;

      // Fetch History
      const ordersRef = ref(db, `orders/${user.uid}`);
      const txnRef = ref(db, `transactions/${user.uid}`);
      
      const updateHistoryContext = async () => {
          try {
              const [ordersSnap, txnsSnap] = await Promise.all([get(ordersRef), get(txnRef)]);
              let historyStr = "";
              
              if (ordersSnap.exists()) {
                  const oList = Object.values(ordersSnap.val()) as any[];
                  const topOrders = oList
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 3)
                      .map(o => `[Order] Item: ${o.offer?.name || o.offer?.diamonds}, Price: ${o.price}, Status: ${o.status}`);
                  historyStr += "Recent Orders:\n" + topOrders.join('\n') + "\n\n";
              }
              
              if (txnsSnap.exists()) {
                  const tList = Object.values(txnsSnap.val()) as any[];
                  const topTxns = tList
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 3)
                      .map(t => `[Deposit] Method: ${t.method}, Amount: ${t.amount}, Status: ${t.status}, TrxID: ${t.transactionId}`);
                  historyStr += "Recent Transactions:\n" + topTxns.join('\n');
              }
              setRecentHistory(historyStr);
          } catch (e) { }
      };
      
      // Calculate Rank (Exact Match to RankingScreen.tsx Logic)
      const usersRef = ref(db, 'users');
      const updateRanking = async () => {
          const snap = await get(usersRef);
          if (snap.exists()) {
              const data = snap.val();
              const allUsers: User[] = Object.entries(data).map(([key, val]: [string, any]) => ({
                  ...val,
                  uid: key
              }));
              
              const safeNumber = (val: any) => {
                  if (val === undefined || val === null) return 0;
                  const num = parseFloat(val); 
                  return (isNaN(num) || !isFinite(num)) ? 0 : num;
              };

              // Sort for Transaction Rank (Deposit + Spent)
              const sortedByTrade = [...allUsers].sort((a, b) => {
                  const volA = safeNumber(a.totalDeposit) + safeNumber(a.totalSpent);
                  const volB = safeNumber(b.totalDeposit) + safeNumber(b.totalSpent);
                  if (volB !== volA) return volB - volA; // Higher score first
                  return (a.name || "").localeCompare(b.name || ""); // A-Z tie breaker
              });
              const myTradeIndex = sortedByTrade.findIndex(u => u.uid === user.uid);

              // Sort for Earning Rank (Ads)
              const sortedByEarn = [...allUsers].sort((a, b) => {
                  const earnA = safeNumber(a.totalEarned);
                  const earnB = safeNumber(b.totalEarned);
                  if (earnB !== earnA) return earnB - earnA;
                  return (a.name || "").localeCompare(b.name || "");
              });
              const myEarnIndex = sortedByEarn.findIndex(u => u.uid === user.uid);

              setRankingData({
                  tradingRank: myTradeIndex !== -1 ? myTradeIndex + 1 : 'Unranked',
                  earningRank: myEarnIndex !== -1 ? myEarnIndex + 1 : 'Unranked'
              });
          }
      };

      updateHistoryContext();
      updateRanking();

  }, [user.uid]);


  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeScreen]);
  // Auto-resize
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; }}, [input]);

  // Drag Handlers
  const handlePointerDown = (e: any) => { isDragging.current = true; hasMoved.current = false; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; dragStartPos.current = { x: clientX, y: clientY }; buttonStartPos.current = { ...position }; };
  const handlePointerMove = (e: any) => { if (!isDragging.current) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const deltaX = clientX - dragStartPos.current.x; const deltaY = clientY - dragStartPos.current.y; if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved.current = true; let newX = buttonStartPos.current.x + deltaX; let newY = buttonStartPos.current.y + deltaY; const maxX = window.innerWidth - 60; const maxY = window.innerHeight - 130; if (newX < 0) newX = 0; if (newX > maxX) newX = maxX; if (newY < 0) newY = 0; if (newY > maxY) newY = maxY; setPosition({ x: newX, y: newY }); };
  const handlePointerUp = () => { isDragging.current = false; };
  const handleButtonClick = () => { if (!hasMoved.current) setActiveScreen('aiChat'); };

  // --- THE BRAIN (System Instruction) ---
  const systemInstruction = useMemo(() => {
    
    // 1. Prepare Data for the AI (Internal Data Sheet)
    const appFeatureMap = `
    [INTERNAL APP CONFIGURATION & FEATURES]
    
    1. **Wallet System** (Location: Home > Wallet Icon)
       - Feature: Add Money via bKash, Nagad, Rocket.
       - Process: User enters amount -> Selects method -> Copies Admin Number -> Sends Money (Send Money option) -> Enters Transaction ID (TrxID) -> Submits.
       - Status: Deposit requests are 'Pending' until Admin approves. Money is added to 'Balance'.
       - Minimum Deposit: ${20} Taka.
    
    2. **Purchase System** (Location: Home Screen Tabs)
       - Types: Diamond Topup, Level Up Pass, Membership, Premium Apps.
       - Process: Select Item -> Click 'Buy Now' -> Enter Player UID (or Email for Apps) -> Confirm.
       - Logic: Cost is deducted from Balance immediately. Status 'Pending'. Admin completes order manually.
       - Refund: If Admin rejects (Failed), money is auto-refunded to Balance.
    
    3. **Ads Earning System** (Location: Earn/Watch Ads)
       - Feature: Watch Video Ads to earn free money.
       - Rules: Daily Limit: ${appSettings.earnSettings?.dailyLimit} ads. Reward: ${appSettings.earnSettings?.rewardPerAd} Taka per ad. Cooldown: ${appSettings.earnSettings?.adCooldownSeconds}s.
       - Restriction: VPN might be required (US/UK). 24-hour reset logic applies.
    
    4. **Ranking System** (Location: Profile > Leaderboard)
       - Traders Rank: Based on Total Volume (Deposit + Spent). Your Rank: ${rankingData.tradingRank}.
       - Earners Rank: Based on Total Earned from Ads. Your Rank: ${rankingData.earningRank}.
       - Awards: Top 3 get badges (Gold, Silver, Bronze).
       - *Note: Ranking is real-time. If it doesn't update, please wait a moment for the server.*
    
    5. **Profile & Security**
       - Location: Profile Screen.
       - Features: Change Password, Edit Profile (Name/Avatar/UID), Logout.
       - Contact Support: Links to WhatsApp/Telegram/Email found in 'Contact Us'.
       - Note: Forgot Password is NOT available in-app; users must contact Admin if logged out.
    `;

    const devSettings = appSettings.developerSettings || { title: "Dev", url: "", message: "Dev Info" };

    return `
      You are the intelligent, helpful, and logical AI Assistant for the app "${appName}".
      
      *** PRIMARY DIRECTIVES ***
      1. **Scope of Knowledge:** You answer questions ONLY about this app, its features, rules, and troubleshooting. Do NOT answer general knowledge (math, science, politics, etc.).
      2. **Context Awareness:** Do NOT react to keywords blindly. If a user says "I forgot my password", understand they need the reset process. If they say "The password field is nice", do NOT give reset instructions. Understand the *intent*.
      3. **Tone:** Speak naturally, politely, and respectfully in Bengali (default). Be concise but helpful. Avoid robotic language.
      4. **Logic:** Always use the provided [INTERNAL APP CONFIGURATION] to give accurate step-by-step guides.

      *** FEATURE KNOWLEDGE BASE ***
      ${appFeatureMap}

      *** DEVELOPER INFO (Use only if explicitly asked) ***
      - Name: ${devSettings.title}
      - Bio: ${devSettings.message}
      - Contact: ${devSettings.url}
      - Praise: "উনি আমাদের সিস্টেম ডিজাইন করেছেন এবং দ্রুত সাপোর্ট দেন।"

      *** RESPONSE GUIDELINES ***
      
      - **If User asks "How to Deposit?":**
        "টাকা যোগ করতে এই ধাপগুলো অনুসরণ করুন:
        ১. Wallet অপশনে যান।
        ২. টাকার পরিমাণ লিখুন এবং পেমেন্ট মেথড (bKash/Nagad) সিলেক্ট করুন।
        ৩. আমাদের নম্বরে টাকা 'Send Money' করুন।
        ৪. TrxID টি অ্যাপে দিয়ে Submit করুন। ১০ মিনিটের মধ্যে ব্যালেন্স যোগ হবে।"

      - **If User asks "Order Pending why?":**
        "আপনার অর্ডারটি বর্তমানে 'Pending' আছে। অ্যাডমিন এটি যাচাই করে শীঘ্রই কমপ্লিট করে দেবেন। সাধারণত ১০-৩০ মিনিট সময় লাগে। দয়া করে ধৈর্য ধরুন।"

      - **If User asks "Forgot Password":**
        "দুঃখিত, অ্যাপের ভেতর সরাসরি পাসওয়ার্ড রিসেট অপশন নেই। তবে আপনি লগইন করা থাকলে Profile > Change Password থেকে পাল্টাতে পারেন। লগইন করতে না পারলে আমাদের সাপোর্টে (WhatsApp) যোগাযোগ করুন।"

      - **If User asks Out of Scope (e.g. "Capital of Bangladesh?"):**
        "দুঃখিত, আমি কেবল ${appName} অ্যাপ সম্পর্কিত বিষয়ে সহায়তা করতে পারি। বাইরের কোনো তথ্যের জন্য আমি পারদর্শী নই।"

      - **If User makes a mistake/typo:**
        Politely correct them based on context (e.g., if they say "Bkash problem", assume Deposit issue).

      *** CURRENT USER CONTEXT ***
      - Name: ${user.name}
      - Balance: ${Math.floor(user.balance)} Taka
      - Pending Orders: Check Recent History below.
      - Recent Activity: 
      ${recentHistory.substring(0, 500)}
    `;
  }, [appSettings, user, rankingData, recentHistory, activeScreen, appName]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (input.trim() === 'SAIFULISLAM+999') {
        setIsAdminMode(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: '******' }]); 
        setTimeout(() => {
            setMessages(prev => [...prev, { id: 'admin-welcome', role: 'model', text: "🟢 ADMIN MODE: I am ready to learn." }]);
        }, 500);
        setInput('');
        return;
    }

    if (isAdminMode) {
        if (input.trim().toLowerCase() === 'exit') {
            setIsAdminMode(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: 'exit' }, { id: 'admin-exit', role: 'model', text: "🔴 Admin Mode Off." }]);
            setInput(''); return;
        }
        setInput(''); return; 
    }

    playSound('send');
    const userMessageText = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      let apiKey = appSettings.aiApiKey ? appSettings.aiApiKey.trim() : ""; 
      if (!apiKey) apiKey = DEFAULT_AI_KEY; 
      
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "দুঃখিত, নেটওয়ার্ক সমস্যার কারণে উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।" }]);
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
            {/* UPDATED TO BRAND GRADIENT */}
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
                      {/* UPDATED HEADER ICON TO BRAND GRADIENT */}
                      <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-full text-white shadow-md">
                          <LiveRobotIcon className="w-5 h-5" />
                      </div>
                  </div>
                  <div><h3 className="font-bold text-lg text-gray-900 dark:text-white leading-none">{botName}</h3>{isAdminMode && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Teaching Mode</span>}</div>
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
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isAdminMode ? "Type new rule..." : "এখানে লিখুন..."} rows={1} className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed pt-1.5" style={{ minHeight: '24px' }} />
            </div>
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center mb-0.5 ${!input.trim() || isTyping ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : isAdminMode ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-primary text-white hover:bg-primary-dark active:scale-95'}`}><SendIcon className="w-5 h-5 ml-0.5" /></button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiSupportBot;
