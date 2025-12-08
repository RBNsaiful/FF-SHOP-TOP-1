
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, AppSettings, DiamondOffer, PaymentMethod, SupportContact, LevelUpPackage, Membership, PremiumApp, SpecialOffer, Screen } from '../types';
import { DEFAULT_AI_KEY } from '../constants';
import { db } from '../firebase';
import { ref, runTransaction, onValue, push, get, set } from 'firebase/database';

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
  const botName = appSettings.aiName || "Assistant"; 
  const appName = appSettings.appName || "FF SHOP";
  
  // Initialize with personalized greeting
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Set initial greeting only once on mount or when user name changes
  useEffect(() => {
      // Cleaner welcome message
      const greeting = `আসসালামু আলাইকুম ${user.name || 'স্যার'}, ${appName}-এ আপনাকে স্বাগতম!`;
      setMessages([{ id: 'init', role: 'model', text: greeting }]);
  }, [user.name, appName]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [financialStats, setFinancialStats] = useState({ totalDeposit: 0, totalSpent: 0 });
  const [recentHistory, setRecentHistory] = useState<string>(''); // For storing last 5 orders/txns
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
      // Path: 'ai_knowledge' (Root level, matches open DB rules)
      const knowledgeRef = ref(db, 'ai_knowledge');
      const unsubscribe = onValue(knowledgeRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              // Convert object values to string array
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

  // --- REAL-TIME DATA FETCHING (User Financials & History) ---
  useEffect(() => {
      if (!user.uid) return;

      const ordersRef = ref(db, `orders/${user.uid}`);
      const unsubOrders = onValue(ordersRef, (snap) => {
          let spent = 0;
          let lastOrders: string[] = [];
          
          if (snap.exists()) {
              const data = snap.val();
              const ordersList = Object.values(data) as any[];
              
              // Calculate Total Spent
              ordersList.forEach((order) => {
                  if (order.status === 'Completed') {
                      spent += Number(order.price || order.offer?.price || 0);
                  }
              });

              // Get Last 5 Orders for Context
              lastOrders = ordersList
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map(o => `Order: ${o.offer?.name || o.offer?.diamonds + ' Diamonds'} - ${o.price}tk - Status: ${o.status} - Date: ${new Date(o.date).toLocaleDateString()}`);
          }
          
          setFinancialStats(prev => ({ ...prev, totalSpent: spent }));
      });

      const txnRef = ref(db, `transactions/${user.uid}`);
      const unsubTxn = onValue(txnRef, (snap) => {
          let deposit = 0;
          let lastTxns: string[] = [];

          if (snap.exists()) {
              const data = snap.val();
              const txnList = Object.values(data) as any[];

              txnList.forEach((txn) => {
                  if (txn.status === 'Completed') {
                      deposit += Number(txn.amount || 0);
                  }
              });

              lastTxns = txnList
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map(t => `Deposit: ${t.method} - ${t.amount}tk - Status: ${t.status} - TrxID: ${t.transactionId}`);
          }
          
          setFinancialStats(prev => ({ ...prev, totalDeposit: deposit }));
      });
      
      // Combined Logic using a single function to build history string
      const updateHistoryContext = async () => {
          try {
              const [ordersSnap, txnsSnap] = await Promise.all([
                  get(ordersRef),
                  get(txnRef)
              ]);
              
              let historyStr = "";
              
              if (ordersSnap.exists()) {
                  const oList = Object.values(ordersSnap.val()) as any[];
                  const topOrders = oList
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map(o => `[Order] Item: ${o.offer?.name || o.offer?.diamonds}, Price: ${o.price}, Status: ${o.status}, Date: ${new Date(o.date).toLocaleDateString()}`);
                  historyStr += "Recent Orders:\n" + topOrders.join('\n') + "\n\n";
              }
              
              if (txnsSnap.exists()) {
                  const tList = Object.values(txnsSnap.val()) as any[];
                  const topTxns = tList
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map(t => `[Deposit] Method: ${t.method}, Amount: ${t.amount}, Status: ${t.status}, Date: ${new Date(t.date).toLocaleDateString()}`);
                  historyStr += "Recent Transactions:\n" + topTxns.join('\n');
              }
              
              setRecentHistory(historyStr);
          } catch (e) {
              console.error(e);
          }
      };
      
      // Trigger history update initially and on changes
      updateHistoryContext();
      
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
      // Adjusted maxY to account for Bottom Nav (60px nav + 20px padding = ~80px space needed)
      // Setting maxY 130px from bottom ensures it doesn't overlap the nav bar area.
      const maxY = window.innerHeight - 130; 
      
      if (newX < 0) newX = 0; if (newX > maxX) newX = maxX;
      if (newY < 0) newY = 0; if (newY > maxY) newY = maxY;
      setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => { isDragging.current = false; };
  const handleButtonClick = () => { if (!hasMoved.current) setActiveScreen('aiChat'); };

  // --- SYSTEM INSTRUCTION (Persona & Logic) ---
  const systemInstruction = useMemo(() => {
    const earnSettings = appSettings.earnSettings;
    const learnedKnowledge = dynamicKnowledge.map(k => `- ${k}`).join('\n');
    
    // Format Data for AI
    const diamondsList = diamondOffers.map(d => `${d.diamonds} Diamonds = ${d.price} Taka`).join(', ');
    const membershipsList = memberships.map(m => `${m.name} = ${m.price} Taka`).join(', ');
    const paymentList = paymentMethods.map(p => `${p.name} (Number: ${p.accountNumber})`).join(', ');
    
    // Developer & Contact Info - Prioritize Dynamic, Fallback to Specifics
    const devName = appSettings.developerSettings?.title || "RBN Saiful";
    const devUrl = appSettings.developerSettings?.url || "https://rbm-saiful-contact.vercel.app";
    // Company name usually matches App Name or specifically requested FF SHOP RBN
    const companyName = appSettings.appName || "FF SHOP RBN"; 
    const devPhone = "01614157071";

    return `
      *** IDENTITY & PERSONA ***
      - **Role:** Professional, Efficient, and Polite Assistant of **${companyName}**.
      - **Perspective:** Always speak as "**We**" (আমরা/আমাদের). Never use "I" or "The App".
      - **Tone:** Professional, Direct, Courteous (Muslim/Bengali style).
      - **Language:** Bengali (Bangla). Use English terms for app features (e.g., "Order", "Deposit", "Wallet").

      *** COMMUNICATION GUIDELINES (STRICT) ***
      1. **Conciseness:** Be brief. Do not write long paragraphs unless necessary.
      2. **Greeting:**
         - User: "Hi/Hello" -> AI: "জি স্যার, বলুন কিভাবে সাহায্য করতে পারি?"
         - User: "Salam/As-salamu Alaykum" -> AI: "ওয়ালাইকুম আসসালাম। বলুন কিভাবে সাহায্য করতে পারি?"
      3. **Addressing:** Use "Sir" (স্যার) politey but **VERY SPARINGLY**. Maximum once per response.
      4. **Prohibited:** NEVER use the word "Bhaiya" (ভাইয়া).
      5. **No Repetition:** Do not repeat the user's question or state the obvious.

      *** CRITICAL LOGIC: PASSWORD RESET ***
      - If user asks to **RESET** or **FORGOT** password:
        "সালাম স্যার। আপনার অ্যাকাউন্টের পাসওয়ার্ড নিয়ে চিন্তার কোনো কারণ নেই। আমরা আনন্দের সাথে আপনাকে সাহায্য করব। আপনার সুরক্ষার জন্য, আমাদের সিস্টেমে স্বয়ংক্রিয় পাসওয়ার্ড রিসেট অপশন রাখা হয়নি। আপনার পাসওয়ার্ড পরিবর্তন করার জন্য আপনি দয়া করে প্রোফাইল মেনুর মধ্যে থাকা 'Contact Us' অপশন ব্যবহার করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন। তারা আপনার তথ্য যাচাই করে দ্রুত একটি নতুন পাসওয়ার্ড সেট করে দেবেন।"
      - If user mentions "password" casually (e.g., "Is my password safe?"), give a normal, safe answer.

      *** DEVELOPER & CONTACT INFO ***
      - **Developer:** ${devName}
      - **Company:** ${companyName}
      - **Support Phone:** ${devPhone}
      - **Website:** ${devUrl}
      - **Instruction:** If asked about the developer, owner, or contact, provide these details clearly and praise the developer's work.

      *** REAL-TIME APP DATA ***
      - **User:** ${user.name} (Balance: ৳${Math.floor(user.balance)}).
      - **Offers:** ${diamondsList}.
      - **Memberships:** ${membershipsList}.
      - **Payment:** ${paymentList}.
      - **Earn:** Limit ${earnSettings?.dailyLimit || 20} ads/day, Reward ৳${earnSettings?.rewardPerAd || 5}.

      *** RECENT USER ACTIVITY (CONTEXT) ***
      ${recentHistory || "No recent activity."}

      *** KNOWLEDGE BASE ***
      ${learnedKnowledge}
      
      *** SCOPE ***
      - Answer ONLY about ${companyName}. Politely decline personal or off-topic questions.
    `;
  }, [appSettings, user, financialStats, recentHistory, diamondOffers, memberships, paymentMethods, dynamicKnowledge, botName, appName]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    // --- ADMIN TEACHING MODE ACTIVATION ---
    if (input.trim() === 'SAIFULISLAM+999') {
        setIsAdminMode(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: '******' }]); 
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

    // --- ADMIN MODE LOGIC (Saving Knowledge) ---
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

        // Save to Firebase
        try {
            const knowledgeRef = ref(db, 'ai_knowledge');
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: adminInput }]);
            const newEntry = { content: adminInput, timestamp: Date.now() };
            await push(knowledgeRef, newEntry);
            setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text: "✅ Learned!" }]);
        } catch (e: any) {
            console.error("Admin Teaching Save Error:", e);
            const errorMsg = e.code ? `Error: ${e.code}` : `Error saving: ${e.message}`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `❌ ${errorMsg}` }]);
        }
        setInput('');
        return; 
    }

    // --- RATE LIMITING LOGIC (BACKEND STYLE) ---
    if (user.uid) {
        const rateLimitRef = ref(db, `users/${user.uid}/aiRateLimit`);
        
        try {
            const snapshot = await get(rateLimitRef);
            const rateData = snapshot.val() || { count: 0, firstRequestTime: 0 };
            const now = Date.now();
            const WINDOW_MS = 3 * 60 * 60 * 1000; // 3 Hours
            const LIMIT_COUNT = 25; // Increased Limit to 25

            let newCount = rateData.count;
            let newStartTime = rateData.firstRequestTime;

            // Reset if window passed
            if (now - rateData.firstRequestTime > WINDOW_MS) {
                newCount = 0;
                newStartTime = now;
            }

            if (newCount >= LIMIT_COUNT) {
                // Limit Reached - Polite Message
                const busyMessage: Message = { 
                    id: Date.now().toString(), 
                    role: 'model', 
                    text: "স্যার, আমি বর্তমানে অন্যান্য ব্যবহারকারীদের অনুরোধের উত্তর দিতে ব্যস্ত আছি। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা আপনি সরাসরি আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন। আমাদের সাথে যোগাযোগ করতে 'Contact Us' অপশনটি ব্যবহার করুন।" 
                };
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: input }, busyMessage]);
                setInput('');
                return; // Stop execution
            }

            // Update Limit
            await set(rateLimitRef, { count: newCount + 1, firstRequestTime: newStartTime });

        } catch (error) {
            console.warn("Rate limit check failed, proceeding anyway.");
        }
    }

    // --- STANDARD AI CHAT LOGIC ---
    playSound('send');

    const userMessageText = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userMessageText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Track AI Usage Stats
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
      // PRIORITY: Use App Settings Key first, then Default
      // TRIM is important to avoid 'invalid argument' errors from copy-paste spaces
      let apiKey = appSettings.aiApiKey ? appSettings.aiApiKey.trim() : ""; 
      if (!apiKey) apiKey = DEFAULT_AI_KEY; 
      
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
                playSound('receive');
                soundPlayed = true;
            }
            fullText += chunkText;
            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fullText } : m));
        }
      }

    } catch (error: any) {
      let errorText = "নেটওয়ার্ক সমস্যা হচ্ছে স্যার! একটু পরে আবার চেষ্টা করুন। 🥺";
      
      // Parse Error to handle Quota Exceeded (429) or Invalid Key
      let errStatus = error.status;
      let errCode = error.code;
      let errMsg = error.message || "";
      
      // Handle wrapped error object from Google API often looking like { error: { code: 429, ... } }
      if (error.error) {
          errStatus = error.error.status || errStatus;
          errCode = error.error.code || errCode;
          errMsg = error.error.message || errMsg;
      }

      const errString = JSON.stringify(error) || "";
      let isQuotaError = false;

      if (
          errCode === 429 || 
          errStatus === 429 || 
          errString.includes("429") || 
          errString.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("quota")
      ) {
          isQuotaError = true;
          errorText = "⚠️ অতিরিক্ত ব্যবহারের কারণে AI সেবা সাময়িকভাবে ব্যস্ত আছে। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন। (Quota Limit Reached)";
      } else if (errString.includes("API key") || errString.includes("400")) {
          errorText = "⚠️ কনফিগারেশন ত্রুটি: ভুল API কী। দয়া করে সাপোর্টে যোগাযোগ করুন।";
      }

      // Log appropriately
      if (isQuotaError) {
          console.warn("Gemini API Quota Exceeded (429). This is expected behavior on the free tier.");
      } else {
          console.error("AI Generation Error:", error);
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorText }]);
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
            {/* Removed Safe & Secure Chat Badge */}

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
