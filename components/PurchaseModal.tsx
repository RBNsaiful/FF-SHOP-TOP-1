
import React, { useState, FC, ChangeEvent } from 'react';
import type { GenericOffer } from '../types';

interface PurchaseModalProps {
  offer: GenericOffer;
  onClose: () => void;
  onConfirm: (uid: string) => Promise<void>;
  onSuccess?: () => void;
  texts: any;
  userBalance: number;
  defaultUid?: string;
}

const Spinner: FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/30 border-t-white"></div>
);

const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);

const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);


const PurchaseModal: FC<PurchaseModalProps> = ({ offer, onClose, onConfirm, onSuccess, texts, userBalance, defaultUid }) => {
  const isEmailType = offer.inputType === 'email';
  
  const [inputValue, setInputValue] = useState(isEmailType ? '' : (defaultUid || ''));
  const [phoneNumber, setPhoneNumber] = useState(''); 
  
  const [inputError, setInputError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'button-success' | 'success'>('idle');

  // Conditional Styling based on offer type (Premium App vs Standard)
  const styles = isEmailType ? {
      container: "p-5",
      title: "text-lg mb-3",
      offerBox: "p-2 mb-3",
      icon: "w-10 h-10",
      offerName: "text-xl",
      price: "text-lg",
      balanceBox: "p-2.5 mb-3 space-y-1",
      balanceText: "text-xs",
      inputLabel: "text-[10px] mb-1",
      input: "p-3 rounded-xl text-sm",
      inputGroup: "mb-2",
      footer: "mt-4 gap-2",
      btn: "py-3 rounded-xl",
      successContainer: "py-8",
      successIcon: "w-16 h-16",
      successTitle: "text-xl"
  } : {
      container: "p-6",
      title: "text-xl mb-5",
      offerBox: "p-4 mb-5",
      icon: "w-12 h-12",
      offerName: "text-2xl",
      price: "text-xl",
      balanceBox: "p-3 mb-5 space-y-2",
      balanceText: "text-sm",
      inputLabel: "text-[11px] mb-1.5",
      input: "p-3.5 rounded-2xl text-base",
      inputGroup: "mb-4",
      footer: "mt-6 gap-3",
      btn: "py-3.5 rounded-xl",
      successContainer: "py-10",
      successIcon: "w-20 h-20",
      successTitle: "text-2xl"
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const insufficientBalance = userBalance < offer.price;
  
  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
        setInputError(isEmailType ? texts.emailRequired : texts.uidRequired);
        return false;
    }

    if (isEmailType) {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(value)) {
            setInputError("Only @gmail.com allowed");
            return false;
        }
    } else {
        if (!/^\d+$/.test(value)) {
            setInputError("Digits only");
            return false;
        }
        if (value.length < 8 || value.length > 15) {
            setInputError("Invalid UID");
            return false;
        }
    }

    setInputError('');
    return true;
  };

  const validatePhone = (value: string): boolean => {
      if (!isEmailType) return true; 

      if (!value.trim()) {
          setPhoneError("Required");
          return false;
      }

      const bdPhoneRegex = /^01[3-9]\d{8}$/;
      if (!bdPhoneRegex.test(value)) {
          setPhoneError("Invalid Number");
          return false;
      }

      setPhoneError('');
      return true;
  };
  
  const handleBlur = () => { validateInput(inputValue); };
  const handlePhoneBlur = () => { validatePhone(phoneNumber); };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isEmailType) {
          if (/^\d*$/.test(newValue)) {
              setInputValue(newValue);
              if (inputError) setInputError('');
          }
      } else {
          setInputValue(newValue);
          if (inputError) setInputError('');
      }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (/^\d*$/.test(val) && val.length <= 11) {
          setPhoneNumber(val);
          if (phoneError) setPhoneError('');
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'uid' | 'phone') => {
      if ((type === 'uid' && !isEmailType) || type === 'phone') {
          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
              e.preventDefault();
          }
      }
  };

  const handleConfirm = async () => {
    const isMainValid = validateInput(inputValue);
    const isPhoneValid = validatePhone(phoneNumber);

    if (!isMainValid || (isEmailType && !isPhoneValid) || insufficientBalance || status === 'processing') return;
    
    setStatus('processing');
    const finalData = isEmailType ? `${inputValue} | ${phoneNumber}` : inputValue;
    await onConfirm(finalData);
    setStatus('button-success');
    
    setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          if (onSuccess) onSuccess(); else onClose();
        }, 3000); 
    }, 500);
  };

  const isConfirmDisabled = !inputValue || !!inputError || (isEmailType && (!phoneNumber || !!phoneError)) || status === 'processing' || status === 'button-success' || insufficientBalance;
  const OfferIcon = offer.icon || DiamondIcon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-smart-fade-in">
      <div 
        className={`bg-light-card dark:bg-dark-card rounded-3xl ${styles.container} w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800`}
        onClick={(e) => e.stopPropagation()} 
      >
        {status !== 'success' ? (
          <div className="w-full">
            <h3 className={`${styles.title} font-bold text-center text-gray-900 dark:text-white`}>{texts.confirmPurchase}</h3>
            
            <div className={`flex flex-col items-center text-center ${styles.offerBox} bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700`}>
                <OfferIcon className={`${styles.icon} mb-1 text-primary drop-shadow-md`}/>
                <h4 className={`${styles.offerName} font-extrabold text-gray-900 dark:text-white leading-tight`}>{offer.name}</h4>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">Package Price</p>
                <p className={`${styles.price} font-black text-primary mt-0.5`}>{texts.currency}{offer.price.toLocaleString()}</p>
            </div>
            
            <div className={`${styles.balanceText} ${styles.balanceBox} bg-white dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-gray-700 text-light-text dark:text-dark-text shadow-sm`}>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{texts.balance}</span>
                    <span className="font-bold">{texts.currency}{Math.floor(userBalance)}</span>
                </div>
                <div className={`flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 mt-0.5 pt-0.5`}>
                    <span>{texts.newBalance}</span>
                    <span className={insufficientBalance ? 'text-red-500' : 'text-green-500'}>
                        {texts.currency}{Math.floor(userBalance - offer.price)}
                    </span>
                </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="uidInput" className={`${styles.inputLabel} font-semibold text-gray-500 dark:text-gray-400 block ml-1`}>
                  {isEmailType ? "Email" : "Player UID"}
              </label>
              <input
                type={isEmailType ? 'email' : 'text'}
                inputMode={isEmailType ? 'email' : 'numeric'}
                id="uidInput"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e, 'uid')}
                onBlur={handleBlur}
                onFocus={handleInputFocus}
                placeholder={isEmailType ? "Email" : "Player UID"}
                className={`w-full ${styles.input} bg-gray-50 dark:bg-dark-bg border focus:outline-none focus:ring-2 font-medium transition-all ${inputError ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700 focus:ring-primary/50'}`}
                disabled={status === 'processing' || status === 'button-success'}
                maxLength={!isEmailType ? 15 : undefined}
              />
              {inputError && <p className="text-red-500 text-[9px] mt-1 font-bold ml-1 animate-fade-in">{inputError}</p>}
            </div>

            {isEmailType && (
                <div className="mb-2 animate-fade-in">
                    <label htmlFor="phoneInput" className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1 ml-1">
                        Number
                    </label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        id="phoneInput"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onKeyDown={(e) => handleKeyDown(e, 'phone')}
                        onBlur={handlePhoneBlur}
                        onFocus={handleInputFocus}
                        placeholder="WA or IMO"
                        className={`w-full p-3 bg-gray-50 dark:bg-dark-bg border rounded-xl focus:outline-none focus:ring-2 font-medium transition-all text-sm ${phoneError ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700 focus:ring-primary/50'}`}
                        disabled={status === 'processing' || status === 'button-success'}
                        maxLength={11}
                    />
                    {phoneError && <p className="text-red-500 text-[9px] mt-1 font-bold ml-1 animate-fade-in">{phoneError}</p>}
                </div>
            )}
            
            {insufficientBalance && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-xl mb-2 text-[9px] font-black uppercase text-center border border-red-100 dark:border-red-800 animate-pulse">
                    {texts.insufficientBalance}
                </div>
            )}

            <div className={`flex ${styles.footer}`}>
              <button
                onClick={onClose}
                className={`flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold ${styles.btn} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs active:scale-95`}
                disabled={status === 'processing' || status === 'button-success'}
              >
                {texts.cancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                className={`flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold ${styles.btn} flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/30 text-xs active:scale-95
                    ${status === 'button-success' ? 'bg-green-500' : ''}
                `}
              >
                {status === 'processing' ? (
                    <Spinner />
                ) : status === 'button-success' ? (
                    <CheckIcon className="w-5 h-5 animate-smart-pop-in" />
                ) : (
                    texts.purchase
                )}
              </button>
            </div>
          </div>
        ) : (
            <div className={`flex flex-col items-center justify-center text-center p-4 overflow-hidden ${styles.successContainer}`}>
                <div className={`relative ${styles.successIcon} mb-4 flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-2 bg-primary/30 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                    <OfferIcon className={`${isEmailType ? 'w-16 h-16' : 'w-20 h-20'} animate-burst relative z-10 text-primary`} />
                </div>
                <h3 className={`${styles.successTitle} font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1 opacity-0 animate-fade-in-up`} style={{animationDelay: '0.4s'}}>
                    {texts.orderSuccessful}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 opacity-0 animate-fade-in-up text-xs max-w-[200px]" style={{animationDelay: '0.6s'}}>
                    {texts.orderPendingGeneric.replace('{packageName}', String(offer.name))}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;
