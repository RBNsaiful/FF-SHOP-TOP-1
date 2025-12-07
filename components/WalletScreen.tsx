


import React, { useState, FC } from 'react';
import type { User, PaymentMethod, Screen } from '../types';
import { db } from '../firebase';
import { ref, push } from 'firebase/database';
import AdRenderer from './AdRenderer';

// Icons
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const StatementIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.25H4.5C4.08579 5.25 3.75 5.58579 3.75 6V18C3.75 18.4142 4.08579 18.75 4.5 18.75H19.5C19.9142 18.75 20.25 18.4142 20.25 18V6C20.25 5.58579 19.9142 5.25 19.5 5.25Z" stroke="#FBBF24" strokeWidth="2"/>
    <path d="M7.5 10.5H16.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.5 13.5H13.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ArrowRightIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>);
const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);


const WavyPath = () => (
  <svg className="absolute w-full h-full top-0 left-0 opacity-30 animate-pulse" preserveAspectRatio="none" viewBox="0 0 350 210">
    <path d="M0 70 C50 30, 100 110, 150 70 S250 30, 300 70 S400 110, 450 70" stroke="rgba(255, 255, 255, 0.6)" fill="none" strokeWidth="2" />
    <path d="M0 140 C50 100, 100 180, 150 140 S250 100, 300 140 S400 180, 450 140" stroke="rgba(255, 255, 255, 0.4)" fill="none" strokeWidth="2" />
  </svg>
);


interface WalletScreenProps {
  user: User;
  texts: any;
  onNavigate: (screen: Screen) => void;
  paymentMethods: PaymentMethod[];
  adCode?: string;
  adActive?: boolean;
}

const WalletScreen: FC<WalletScreenProps> = ({ user, texts, onNavigate, paymentMethods, adCode, adActive }) => {
  const [step, setStep] = useState(1); 
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const MIN_AMOUNT = 20;
  const MAX_AMOUNT = 10000;

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const presetAmounts = [100, 300, 500, 1000];

  const numericAmount = Number(amount);
  const isAmountInRange = amount !== '' && !isNaN(numericAmount) && numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;
  
  let amountError = '';
  if (amount && !isNaN(numericAmount)) {
      if (numericAmount < MIN_AMOUNT) {
          amountError = `Minimum deposit ${MIN_AMOUNT} ৳`;
      } else if (numericAmount > MAX_AMOUNT) {
          amountError = `Maximum deposit ${MAX_AMOUNT.toLocaleString()} ৳`;
      }
  }

  const isStep1Valid = isAmountInRange && !!selectedMethod;

  const handleNextStep = () => {
    if (step === 1) {
      if (!isAmountInRange) {
          setError(amountError);
          return;
      }
      if (!selectedMethod) {
          setError(texts.addFundsError);
          return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleTrxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // STRICT VALIDATION: Replace any character that is NOT A-Z or 0-9 with empty string immediately
      const cleanValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setTransactionId(cleanValue);
      if (error) setError('');
  };
  
  const validateTrxID = (id: string) => {
      const cleanId = id.trim();
      
      if (cleanId.length === 0) return { isValid: false, isError: false };

      // Since input is restricted, we just check length and pure number
      if (cleanId.length < 8) return { isValid: false, isError: false };
      // Optional: Prevent pure numbers if TrxID usually contains chars, but some gateways use numbers. 
      // Keeping generic alphanumeric check for now.
      
      return { isValid: true, isError: false };
  };

  const { isValid: isTrxValid, isError: isTrxError } = validateTrxID(transactionId);

  const handleSubmit = async () => {
    const cleanTrx = transactionId.trim();

    if (!isTrxValid) {
        setError("Invalid Transaction ID");
        return;
    }

    setError('');

    if (user.uid) {
        const finalTrxId = cleanTrx.toUpperCase();

        const txnData = {
            amount: Number(amount),
            method: selectedMethod?.name,
            transactionId: finalTrxId,
            date: new Date().toISOString(),
            status: 'Pending',
            id: finalTrxId, 
            userId: user.uid
        };

        const txnRef = ref(db, 'transactions/' + user.uid);
        await push(txnRef, txnData);
    }

    onNavigate('myTransaction');
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 animate-smart-fade-in pb-24">
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-5 rounded-2xl text-white shadow-2xl shadow-primary/30 mb-4 overflow-hidden animate-smart-pop-in">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <WavyPath />
             <div className="relative z-10 flex flex-col justify-center py-4">
                <p className="text-base font-bold text-white tracking-widest mb-1 opacity-90">BALANCE</p>
                <p className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
                    {texts.currency}{Math.floor(user.balance)}
                </p>
                <div className="self-start bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 shadow-sm">
                     <p className="text-[10px] font-bold text-white tracking-wide">{user.name}</p>
                </div>
            </div>
             <div className="absolute top-4 right-4 p-2 bg-white/10 rounded-full animate-pulse">
                <StatementIcon className="w-4 h-4 text-white/80" />
            </div>
        </div>

        <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden animate-smart-slide-up" style={{ animationDuration: '0.8s' }}>
            
            {step === 1 && (
                <div className="p-4">
                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{texts.amount}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">{texts.currency}</span>
                            <input 
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                onFocus={handleInputFocus}
                                className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-dark-bg border ${amount && !isAmountInRange ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-primary'} rounded-xl focus:outline-none focus:ring-2 text-lg font-bold transition-all`}
                            />
                        </div>
                        
                        {amountError && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">
                                {amountError}
                            </p>
                        )}
                        
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {presetAmounts.map((val, index) => (
                                <button
                                    key={val}
                                    onClick={() => { setAmount(String(val)); setError(''); }}
                                    className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        Number(amount) === val
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                    }`}
                                >
                                    {texts.currency}{val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{texts.selectPayment}</label>
                         <div className="grid grid-cols-3 gap-2">
                            {paymentMethods.map((method, index) => {
                                const isSelected = selectedMethod?.name === method.name;
                                return (
                                    <button 
                                        key={method.name} 
                                        onClick={() => { setSelectedMethod(method); setError(''); }}
                                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 ${
                                            isSelected 
                                            ? 'border-primary bg-primary/5 shadow-md scale-105' 
                                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="h-6 w-6 mb-1 flex items-center justify-center">
                                            <img src={method.logo} alt={method.name} className="h-full w-full object-contain" />
                                        </div>
                                        <span className={`text-[9px] font-bold ${isSelected ? 'text-primary' : 'text-gray-500'}`}>{method.name}</span>
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center">
                                                <CheckIcon className="w-1.5 h-1.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                         </div>
                    </div>

                    {error && !amountError && <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium text-center">{error}</div>}

                    <div className="w-full">
                        <button 
                            onClick={handleNextStep}
                            disabled={!isStep1Valid}
                            className={`w-full font-bold text-base py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30
                                ${isStep1Valid 
                                    ? 'hover:opacity-90 active:scale-95' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {texts.nextStep} <ArrowRightIcon className="ml-2 w-4 h-4"/>
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && selectedMethod && (
                <div 
                    className="p-4 animate-smart-slide-down"
                    style={{ animationDuration: '1.5s' }}
                >
                    <div className="flex items-center mb-4">
                        <button onClick={() => setStep(1)} className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        <h3 className="text-base font-bold ml-2 flex-grow">{texts.paymentInstructionsTitle}</h3>
                        <div className="bg-primary/10 px-2 py-0.5 rounded-full">
                            <span className="text-primary font-bold text-xs">{texts.currency}{amount}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-dark-bg p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">{texts.accountNumberLabel} ({selectedMethod.name})</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl font-mono font-bold text-gray-800 dark:text-gray-100 tracking-wider">
                                {selectedMethod.accountNumber}
                            </span>
                            <button 
                                onClick={() => handleCopyToClipboard(selectedMethod.accountNumber)}
                                className={`p-1.5 rounded-lg transition-colors ${isCopied ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-gray-700 shadow-sm text-primary hover:bg-gray-100'}`}
                            >
                                {isCopied ? <CheckIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 whitespace-pre-wrap">
                             {selectedMethod.instructions || '*Send money using "Send Money" option'}
                        </p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="trxID" className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">{texts.transactionIdLabel}</label>
                        <input 
                            type="text"
                            id="trxID"
                            value={transactionId}
                            onChange={handleTrxChange}
                            onFocus={handleInputFocus}
                            placeholder=""
                            className={`w-full p-3 bg-white dark:bg-dark-bg border rounded-xl focus:outline-none focus:ring-2 font-mono text-base uppercase placeholder-gray-300 transition-colors duration-300
                                ${isTrxError 
                                    ? 'border-red-500 focus:ring-red-500 text-red-600' 
                                    : 'border-gray-200 dark:border-gray-700 focus:ring-primary'
                                }
                            `}
                            autoCapitalize="characters"
                        />
                         {isTrxError && (
                            <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-pulse">
                                Invalid TrxID (Must be Alphanumeric)
                            </p>
                        )}
                    </div>

                    {error && <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium text-center">{error}</div>}

                    <div className="w-full">
                        <button 
                            onClick={handleSubmit}
                            disabled={!isTrxValid} 
                            className={`w-full font-bold text-base py-3 rounded-xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30 
                                ${isTrxValid 
                                    ? 'opacity-100 hover:opacity-95 active:scale-95'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {texts.submitTransaction}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* --- FOOTER ADVERTISEMENT (Scroll to View) --- */}
        {adCode && (
            <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
                <AdRenderer code={adCode} active={adActive} />
            </div>
        )}
    </div>
  );
};

export default WalletScreen;