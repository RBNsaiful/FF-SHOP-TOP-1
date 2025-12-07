
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, AppSettings, DiamondOffer, PaymentMethod, SupportContact, LevelUpPackage, Membership, PremiumApp, SpecialOffer, Screen } from '../types';
import { DEFAULT_AI_KEY } from '../constants';
import { db, auth } from '../firebase';
import { ref, runTransaction, onValue, push } from 'firebase/database';

// --- SOUND ASSETS (Short, crisp UI sounds) ---
// Pop sound for sending
const SEND_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTSVMAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABzgM0AAAAAAOAAAAAAAAAAAA0gAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAALQAAAAADgOAAA///+5JkAAAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD//+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAADcADQAAAAADgAAAAAAAAAtAAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAAAAAANIAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA"; 
// Soft ping for receiving
const RECEIVE_SOUND = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABzgM0AAAAAAOAAAAAAAAAAAA0gAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAALQAAAAADgOAAA///+5JkAAAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD//+5JkAAANwANAAAAAAAOAAAAAAAAC0AAAAAA4DgAAAP///uSZAAAADcADQAAAAADgAAAAAAAAAtAAAAAAOA4AAAD///7kmQAAAA3AA0AAAAAAA4AAAAAAAALQAAAAADgOAAA///+5JkAAAAAAANIAAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA//uQZAAAAAAA0gAAAAOA4AAAD///7kmQAAAAAADgOAAAA";

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
  const botName = appSettings.aiName || "Tuktuki"; 
  
  // INITIAL MESSAGE: Use "Sir" instead of "Bhaiya"
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: `আসসালামু আলাইকুম স্যার! 😊 আমি ${botName}। ${appSettings.appName}-এ আপনাকে স্বাগতম। অ্যাপ সম্পর্কে কিছু জানতে চাইলে বলুন, আমি সাহায্য করছি! 👇` }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [financialStats, setFinancialStats] = useState({ totalDeposit: 0, totalSpent: 0 });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [dynamicKnowledge, setDynamicKnowledge] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- AUDIO UTILS ---
  const playSound = (type: 'send' | 'receive') => {
      try {
          const audio = new Audio(type === 'send' ? SEND_SOUND : RECEIVE_SOUND);
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play blocked by browser interaction policy"));
      } catch (e) {
          // Ignore audio errors
      }
  };

  // --- DRAGGABLE BUTTON STATE ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position
  useEffect(() => {
      if (typeof window !== 'undefined') {
          setPosition({
              x: window.innerWidth - 75,
              y: window.innerHeight - 140
          });
      }
  }, []);

  // --- FETCH DYNAMIC KNOWLEDGE (For Admin Teaching) ---
  useEffect(() => {
      // FIX: Using 'ai_knowledge' path to avoid permission issues with 'config'
      const knowledgeRef = ref(db, 'ai_knowledge');
      const unsubscribe = onValue(knowledgeRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              // Convert object values to string array (handling both string pushes and object pushes)
              const knowledgeArray = Object.values(data).map((item: any) => 
                  typeof item === 'string' ? item : item.content
              ).filter(Boolean);
              setDynamicKnowledge(knowledgeArray);
          } else {
              setDynamicKnowledge([]);
          }
      }, (error) => {
          console.error("Error fetching knowledge:", error);
      });
      return () => unsubscribe();
  }, []);

  // --- REAL-TIME DATA FETCHING (User Financials) ---
  useEffect(() => {
      if (!user.uid) return;

      // Fetch Orders for Total Spent
      const ordersRef = ref(db, `orders/${user.uid}`);
      const unsubOrders = onValue(ordersRef, (snap) => {
          let spent = 0;
          if (snap.exists()) {
              const data = snap.val();
              Object.values(data).forEach((order: any) => {
                  if (order.status === 'Completed') {
                      spent += Number(order.price || order.offer?.price || 0);
                  }
              });
          }
          setFinancialStats(prev => ({ ...prev, totalSpent: spent }));
      });

      // Fetch Transactions for Total Deposit
      const txnRef = ref(db, `transactions/${user.uid}`);
      const unsubTxn = onValue(txnRef, (snap) => {
          let deposit = 0;
          if (snap.exists()) {
              const data = snap.val();
              Object.values(data).forEach((txn: any) => {
                  if (txn.status === 'Completed') {
                      deposit += Number(txn.amount || 0);
                  }
              });
          }
          setFinancialStats(prev => ({ ...prev, totalDeposit: deposit }));
      });

      return () => {
          unsubOrders();
          unsubTxn();
      };
  }, [user.uid]);


  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeScreen]);

  // Auto-resize Textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // --- DRAG HANDLERS ---
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      isDragging.current = true;
      hasMoved.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX, y: clientY };
      buttonStartPos.current = { ...position };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const deltaX = clientX - dragStartPos.current.x;
      const deltaY = clientY - dragStartPos.current.y;
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved.current = true;
      let newX = buttonStartPos.current.x + deltaX;
      let newY = buttonStartPos.current.y + deltaY;
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      if (newX < 0) newX = 0; if (newX > maxX) newX = maxX;
      if (newY < 0) newY = 0; if (newY > maxY) newY = maxY;
      setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => { isDragging.current = false; };
  const handleButtonClick = () => { if (!hasMoved.current) setActiveScreen('aiChat'); };

  // --- KNOWLEDGE INJECTION (Strictly Scoped & Professional) ---
  const systemInstruction = useMemo(() => {
    const earnSettings = appSettings.earnSettings;
    const learnedKnowledge = dynamicKnowledge.map(k => `- ${k}`).join('\n');
    
    return `
      *** IDENTITY ***
      You are "${botName}", the Professional Female Assistant for "${appSettings.appName}".
      
      *** STRICT PERSONA RULES (MANDATORY) ***
      1. **ADDRESSING:** You MUST address the user as "Sir" (স্যার). **NEVER** use "Bhaiya", "Bro", "Saiful Bhaiya", or "Ogo".
      2. **GREETING:** Use "As-salamu Alaykum" ONLY at the start of a conversation or if the user greets first. Do NOT repeat it in every message.
      3. **TONE:** Professional, Efficient, Helpful, yet Polite and Muslim.
      4. **LANGUAGE:** ONLY Bengali (Bangla).

      *** CRITICAL LOGIC OVERRIDES (HIGHEST PRIORITY) ***
      1. **PASSWORD RESET:** If the user mentions "password", "forgot password", "reset password", or "password change" (when confused), you MUST reply EXACTLY with this text:
         "স্যার, পাসওয়ার্ড রিসেট করার কোনো স্বয়ংক্রিয় অপশন আমাদের সিস্টেমে নেই। আপনি দয়া করে প্রোফাইল মেনুর মধ্যে থাকা 'Contact Us' অপশনে গিয়ে সরাসরি আমাদের সাথে যোগাযোগ করুন। আপনার সঠিক তথ্য যাচাই করে আমরা ম্যানুয়ালি পাসওয়ার্ড পরিবর্তন করে দেবো।"
         (Do NOT suggest clicking a 'Forgot Password' button).
         
      2. **CONTACT INFO:** The "Contact Us" page contains real phone numbers, email, and social links. If a user asks how to contact, direct them to the "Contact Us" page. Do not say you don't know.

      *** APP NAVIGATION MAP (KNOWLEDGE BASE) ***
      If the user asks where to find something, guide them accurately:
      
      1. **Profile Menu (প্রোফাইল মেনু)** contains:
         - My Orders (অর্ডার হিস্টোরি)
         - My Transaction (ডিপোজিট হিস্টোরি)
         - Add Money (টাকা এড করা)
         - Contact Us (যোগাযোগ)
         - Change Password (পাসওয়ার্ড পরিবর্তন)
         - Language (ভাষা পরিবর্তন)
         - Theme (লাইট/ডার্ক মোড)
         - Logout
      
      2. **Edit Profile (এডিট প্রোফাইল)** contains:
         - Name, Email, Save UID, Change Photo
         - Show Reward Animation Toggle
      
      3. **Offers (অফার)** types:
         - Diamond, Level Up, Membership, Premium App, Special Event.
         
      4. **Navigation Bar (নিচের মেনু)**:
         - Home, Wallet, Earn (Watch Ads), Profile.

      *** REAL-TIME USER DATA (SECRET ACCESS) ***
      - User Name: ${user.name}
      - Phone/Email: ${user.email}
      - **Current Balance:** ৳${Math.floor(user.balance)}
      - **Total Deposit:** ৳${financialStats.totalDeposit}
      - **Total Spent:** ৳${financialStats.totalSpent}
      
      *** DEVELOPER INFO (ONLY IF ASKED) ***
      If asked "Who made you?" or "Developer contact", provide EXACTLY:
      - Developer Name: RBN Saiful
      - Contact Number: 01614157071
      - Website: https://rbm-saiful-contact.vercel.app
      - Description: "RBN Saiful is a professional App & Web Developer known for clean code and unique designs."

      *** EARN FEATURE ***
      - Location: "Earn" tab.
      - Limit: ${earnSettings?.dailyLimit || 20} ads/day.
      - Reward: ৳${earnSettings?.rewardPerAd || 5}/ad.

      *** DYNAMIC KNOWLEDGE BASE (LEARNED RULES) ***
      ${learnedKnowledge}
    `;
  }, [appSettings, diamondOffers, user, botName, financialStats, paymentMethods, dynamicKnowledge]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    // --- ADMIN TEACHING MODE TRIGGER ---
    if (input.trim() === 'SAIFULISLAM+999') {
        setIsAdminMode(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: '******' }]); // Hide pass
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: 'admin-welcome', 
                role: 'model', 
                text: "🟢 ADMIN TEACHING MODE ACTIVATED.\nAnything you type now will be saved to my memory. Type 'exit' to quit." 
            }]);
        }, 500);
        setInput('');
        return;
    }

    // --- ADMIN MODE LOGIC ---
    if (isAdminMode) {
        const adminInput = input.trim();
        
        if (adminInput.toLowerCase() === 'exit') {
            setIsAdminMode(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: adminInput }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { id: 'admin-exit', role: 'model', text: "🔴 Admin Mode Deactivated." }]);
            }, 500);
            setInput('');
            return;
        }

        // Save to Firebase (Simpler, more robust approach)
        try {
            // Path: ai_knowledge (Root) - Matches relaxed DB rule
            const knowledgeRef = ref(db, 'ai_knowledge');
            const currentUser = auth.currentUser;
            
            // Basic auth check
            if (!currentUser) {
                throw new Error("You must be logged in to save knowledge.");
            }

            // Optimistic update for UI
            setMessages(prev => [...prev, 
                { id: Date.now().toString(), role: 'user', text: adminInput },
            ]);
            
            // 3. Structured Data Push
            const newEntry = {
                content: adminInput,
                addedBy: currentUser.uid,
                timestamp: Date.now()
            };

            await push(knowledgeRef, newEntry);
            
            setMessages(prev => [...prev, 
                { id: (Date.now()+1).toString(), role: 'model', text: "✅ Learned!" }
            ]);
        } catch (e: any) {
            console.error("Admin Teaching Save Error:", e);
            const errorMsg = e.code ? `Error: ${e.code}` : `Error saving: ${e.message}`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `❌ ${errorMsg}` }]);
        }
        setInput('');
        return; // Stop here, do not call Gemini
    }

    // --- STANDARD AI CHAT LOGIC ---
    playSound('send'); // Send Sound

    const userMessageText = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userMessageText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Track AI Usage
    if (user.uid) {
        const userRef = ref(db, `users/${user.uid}`);
        runTransaction(userRef, (userData) => {
            if (userData) {
                userData.aiRequestCount = (userData.aiRequestCount || 0) + 1;
            }
            return userData;
        }).catch(err => console.error(err));
    }

    try {
      let apiKey = appSettings.aiApiKey; 
      if (!apiKey || apiKey.trim() === "") apiKey = DEFAULT_AI_KEY; 
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction: systemInstruction },
        history: history
      });

      const result = await chat.sendMessageStream({ message: userMessageText });
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', text: '' }]);

      let fullText = '';
      let soundPlayed = false;

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
            if (!soundPlayed) {
                playSound('receive'); // Play sound once when reply starts
                soundPlayed = true;
            }
            fullText += chunkText;
            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fullText } : m));
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "নেটওয়ার্ক সমস্যা হচ্ছে স্যার! একটু পরে আবার চেষ্টা করুন। 🥺" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  if (!appSettings.aiSupportActive) return null;

  return (
    <>
      {/* Draggable Floating Button */}
      {activeScreen !== 'aiChat' && (
        <div
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onClick={handleButtonClick}
            style={{ left: position.x, top: position.y, position: 'fixed', zIndex: 50, touchAction: 'none' }}
            className="cursor-move active:cursor-grabbing"
        >
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-2.5 rounded-full shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center group relative border border-white/20">
                <LiveRobotIcon className="w-7 h-7" />
            </div>
        </div>
      )}

      {/* Chat Interface */}
      {activeScreen === 'aiChat' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-light-bg dark:bg-dark-bg animate-smart-slide-up w-full h-full">
          <div className="flex items-center justify-between py-3 px-4 bg-light-bg dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveScreen('home')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-full text-white shadow-md">
                        <LiveRobotIcon className="w-5 h-5" />
                      </div>
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-none">{botName}</h3>
                      {isAdminMode && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Teaching Mode</span>}
                  </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0F172A] scroll-smooth pb-20">
            <div className="flex justify-center mb-6">
                <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold">Safe & Secure Chat</span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center self-end mb-1 text-white shadow-sm flex-shrink-0">
                        <LiveRobotIcon className="w-4 h-4" />
                    </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start w-full items-end">
                 <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm">
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
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isAdminMode ? "Type new rule to learn..." : "এখানে লিখুন..."}
                  rows={1}
                  className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed pt-1.5"
                  style={{ minHeight: '24px' }}
                />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center mb-0.5
                  ${!input.trim() || isTyping 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : isAdminMode ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
                  }`}
            >
              <SendIcon className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiSupportBot;
