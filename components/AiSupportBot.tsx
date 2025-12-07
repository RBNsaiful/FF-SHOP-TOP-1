
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, AppSettings, DiamondOffer, PaymentMethod, SupportContact, LevelUpPackage, Membership, PremiumApp, SpecialOffer, Screen } from '../types';
import { DEFAULT_AI_KEY } from '../constants';
import { db } from '../firebase';
import { ref, runTransaction } from 'firebase/database';

// Icons
const RobotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8" />
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
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
  const botName = appSettings.aiName || "AI Tuktuki"; 
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: `হাই ${user.name || 'বন্ধু'}! 👋 আমি ${botName}। ${appSettings.appName}-এ তোমাকে স্বাগতম। আমি তোমাকে কীভাবে সাহায্য করতে পারি?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- DRAGGABLE BUTTON STATE ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position to bottom-right on mount
  useEffect(() => {
      // Check if window is defined (client-side)
      if (typeof window !== 'undefined') {
          setPosition({
              x: window.innerWidth - 80, // Approx width of button + margin
              y: window.innerHeight - 150 // Approx height + nav bar
          });
      }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeScreen]);

  // Auto-resize Textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Set new height, max 120px
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

      // Determine if moved significantly to count as a drag vs click
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          hasMoved.current = true;
      }

      let newX = buttonStartPos.current.x + deltaX;
      let newY = buttonStartPos.current.y + deltaY;

      // Boundary Checks
      const maxX = window.innerWidth - 60; // Button width approx
      const maxY = window.innerHeight - 60; // Button height approx
      
      if (newX < 0) newX = 0;
      if (newX > maxX) newX = maxX;
      if (newY < 0) newY = 0;
      if (newY > maxY) newY = maxY;

      setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
      isDragging.current = false;
  };

  const handleButtonClick = () => {
      if (!hasMoved.current) {
          setActiveScreen('aiChat');
      }
  };

  // --- 1. DEEP KNOWLEDGE INJECTION (CONTEXT) ---
  const systemInstruction = useMemo(() => {
    const diamondsList = diamondOffers.map(o => `- ${o.diamonds} ডায়মন্ড: ৳${o.price}`).join('\n');
    const levelUpList = levelUpPackages.map(o => `- ${o.name}: ৳${o.price}`).join('\n');
    const memberList = memberships.map(o => `- ${o.name}: ৳${o.price}`).join('\n');
    const premiumList = premiumApps.map(o => `- ${o.name}: ৳${o.price} (${o.description})`).join('\n');
    const specialList = specialOffers.filter(o => o.isActive).map(o => `- ${o.title}: ৳${o.price}`).join('\n');
    const paymentList = paymentMethods.map(m => `- ${m.name} (নাম্বার: ${m.accountNumber})`).join('\n');
    
    return `
      আপনি হলেন "${botName}", মোবাইল অ্যাপ "${appSettings.appName}"-এর অফিসিয়াল এআই সাপোর্ট অ্যাসিস্ট্যান্ট।
      আপনার কাজ হলো ব্যবহারকারীদের পেমেন্ট, অফার, এবং অ্যাপ ব্যবহার সংক্রান্ত যেকোনো প্রশ্নের উত্তর দেওয়া।
      
      *** গুরত্বপূর্ণ নিয়মাবলী (MUST FOLLOW): ***
      ১. **ভাষা**: আপনি সর্বদা **বাংলা (Bengali)** ভাষায় উত্তর দেবেন।
      ২. **ব্যবহার**: আপনি খুব বন্ধুসুলভ এবং বিনয়ী হবেন। ইমোজি ব্যবহার করবেন (😊, 👍, 🔥)।
      ৩. **সীমা**: শুধুমাত্র এই অ্যাপ সম্পর্কিত প্রশ্নের উত্তর দিন।
      ৪. **মুদ্রা**: সকল মূল্য 'টাকা' বা '৳' প্রতীকে বলবেন।
      ৫. **জ্ঞান**: নিচে দেওয়া অ্যাপের বর্তমান তথ্য ব্যবহার করে সঠিক উত্তর দিন। নিজের থেকে কোনো ভুল তথ্য বানাবেন না।

      *** অ্যাপের বর্তমান তথ্য (Context): ***
      
      - অ্যাপের নাম: ${appSettings.appName}
      - মেইনটেইনেন্স মোড: ${appSettings.maintenanceMode ? 'চালু আছে (এখন অ্যাপ বন্ধ)' : 'বন্ধ আছে (অ্যাপ চলছে)'}
      - বর্তমান ইউজার: ${user.name} (ব্যালেন্স: ৳${Math.floor(user.balance)})
      
      **ডায়মন্ড অফারসমূহ:**
      ${diamondsList}
      
      **লেভেল আপ প্যাকেজ:**
      ${levelUpList}
      
      **মেম্বারশিপ:**
      ${memberList}
      
      **স্পেশাল অফার (হট ডিল):**
      ${specialList || '(বর্তমানে কোনো স্পেশাল অফার নেই)'}
      
      **প্রিমিয়াম অ্যাপস:**
      ${premiumList}
      
      **পেমেন্ট পদ্ধতি (টাকা এড করার নিয়ম):**
      ${paymentList}
      *নিয়ম:* প্রথমে অ্যাপের ওয়ালেট অপশনে গিয়ে নির্ধারিত নাম্বারে 'Send Money' করতে হবে। তারপর ট্রানজেকশন আইডি (TrxID) কপি করে অ্যাপে বসালে টাকা এড হবে।
      
      **সাপোর্ট যোগাযোগ:**
      ${supportContacts.map(c => `- ${c.type}: ${c.link}`).join('\n')}
    `;
  }, [appSettings, diamondOffers, paymentMethods, supportContacts, levelUpPackages, memberships, specialOffers, user, botName]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userMessageText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // --- TRACK AI USAGE ---
    if (user.uid) {
        const userRef = ref(db, `users/${user.uid}`);
        runTransaction(userRef, (userData) => {
            if (userData) {
                userData.aiRequestCount = (userData.aiRequestCount || 0) + 1;
            }
            return userData;
        }).catch(err => console.error("Error tracking AI usage:", err));
    }

    try {
      // API Key Priority: Admin Key -> Hardcoded Default -> Env Key
      let apiKey = appSettings.aiApiKey; 
      if (!apiKey || apiKey.trim() === "") {
          apiKey = DEFAULT_AI_KEY; 
      }
      
      if (!apiKey) {
          throw new Error("No API Key configured.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Ensure history alternates properly. 
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: systemInstruction,
        },
        history: history
      });

      const result = await chat.sendMessageStream({ message: userMessageText });
      
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
            fullText += chunkText;
            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fullText } : m));
        }
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "দুঃখিত, আমি এখন সংযোগ করতে পারছি না। দয়া করে একটু পরে আবার চেষ্টা করুন অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।" }]);
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
      {/* Draggable Floating Action Button */}
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
            style={{ 
                left: position.x, 
                top: position.y,
                position: 'fixed',
                zIndex: 50,
                touchAction: 'none' // Important to prevent scrolling while dragging
            }}
            className="cursor-move active:cursor-grabbing transition-shadow"
        >
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-3.5 rounded-full shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-transform duration-200 flex items-center justify-center group relative">
                <RobotIcon className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </div>
        </div>
      )}

      {/* FULL SCREEN Chat Interface (Native Page Feel) */}
      {activeScreen === 'aiChat' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-light-bg dark:bg-dark-bg animate-smart-slide-up w-full h-full">
          
          {/* THEMED HEADER (Match App.tsx Header) */}
          <div className="flex items-center justify-between py-3 px-4 bg-light-bg dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10 h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveScreen('home')} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-full text-white shadow-md">
                        <RobotIcon className="w-5 h-5" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-bg rounded-full"></span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-none">{botName}</h3>
              </div>
            </div>
            
            {/* Right side is empty as per request (removed close button) */}
            <div className="w-8"></div>
          </div>

          {/* Messages Area (Theme Compatible) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-light-bg dark:bg-dark-bg scroll-smooth pb-20">
            {/* Date Separator */}
            <div className="flex justify-center mb-6">
                <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold">Today</span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center self-end mb-1 text-white shadow-sm flex-shrink-0">
                        <RobotIcon className="w-4 h-4" />
                    </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none' // User: Primary Color
                      : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700' // Bot: Card Color
                  }`}
                >
                  {msg.text}
                  <span className={`text-[9px] block text-right mt-1 opacity-70 font-medium ${msg.role === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start w-full items-end">
                 <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                    <RobotIcon className="w-4 h-4" />
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

          {/* Input Area (Auto-expanding Textarea) */}
          <div className="p-3 bg-light-card dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 sticky bottom-0 w-full shadow-lg z-20">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="w-full bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed pt-1"
                  style={{ minHeight: '24px' }}
                />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center mb-0.5
                  ${!input.trim() || isTyping 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
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
