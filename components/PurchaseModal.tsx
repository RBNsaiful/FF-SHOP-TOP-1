
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
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
);

const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);


const PurchaseModal: FC<PurchaseModalProps> = ({ offer, onClose, onConfirm, onSuccess, texts, userBalance, defaultUid }) => {
  const isEmailType = offer.inputType === 'email';
  
  const [inputValue, setInputValue] = useState(isEmailType ? '' : (defaultUid || ''));
  const [inputError, setInputError] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setInputError(texts.emailInvalid);
            return false;
        }
    } else {
        if (!/^\d+$/.test(value)) {
            setInputError(texts.uidNumeric);
            return false;
        }
        if (value.length < 8 || value.length > 12) {
            setInputError(texts.uidLength);
            return false;
        }
    }

    setInputError('');
    return true;
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (!isEmailType) {
          if (/^\d*$/.test(newValue)) {
              setInputValue(newValue);
              validateInput(newValue);
          }
      } else {
          setInputValue(newValue);
          validateInput(newValue);
      }
  };

  const handleConfirm = async () => {
    if (!validateInput(inputValue) || insufficientBalance || status === 'processing') return;
    setStatus('processing');
    await onConfirm(inputValue);
    setStatus('success');
    setTimeout(() => {
      if (onSuccess) {
          onSuccess();
      } else {
          onClose();
      }
    }, 3000); 
  };

  const isConfirmDisabled = !inputValue || !!inputError || status === 'processing' || insufficientBalance;

  const OfferIcon = offer.icon || DiamondIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-light-card dark:bg-dark-card rounded-2xl p-6 w-full max-w-xs animate-slide-in-from-top shadow-xl flex flex-col mt-10">
        {status !== 'success' ? (
          <div className="w-full">
            <h3 className="text-xl font-bold text-center mb-4">{texts.confirmPurchase}</h3>
            
            <div className="flex flex-col items-center text-center mb-4 p-4 bg-light-bg dark:bg-dark-bg rounded-lg">
                <OfferIcon className="w-12 h-12 mb-2 text-primary"/>
                <h4 className="text-2xl font-extrabold">{offer.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Package</p>
                <p className="text-xl font-bold text-primary mt-2">{texts.currency}{offer.price.toLocaleString()}</p>
            </div>
            
            <div className="text-sm mb-4 p-3 bg-light-bg dark:bg-dark-bg rounded-lg space-y-1 text-light-text dark:text-dark-text">
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{texts.balance}</span>
                    <span>{texts.currency}{Math.floor(userBalance)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{texts.purchase}</span>
                    <span className="text-red-500">-{texts.currency}{offer.price.toLocaleString()}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700 my-1.5"/>
                <div className="flex justify-between font-bold text-base">
                    <span>{texts.newBalance}</span>
                    <span className={insufficientBalance ? 'text-red-500' : 'text-primary'}>
                        {texts.currency}{Math.floor(userBalance - offer.price)}
                    </span>
                </div>
            </div>

            <div className="mb-2">
              <label htmlFor="uidInput" className="text-sm font-medium">
                  {isEmailType ? texts.email : texts.uid}
              </label>
              <input
                type={isEmailType ? 'email' : 'text'}
                inputMode={isEmailType ? 'email' : 'numeric'}
                pattern={isEmailType ? undefined : "[0-9]*"}
                id="uidInput"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder={isEmailType ? texts.enterEmail : texts.enterUID}
                className={`w-full mt-1 p-3 bg-light-bg dark:bg-dark-bg border rounded-lg focus:outline-none focus:ring-2 ${inputError ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-300 dark:border-gray-600 focus:ring-primary'}`}
                disabled={status === 'processing'}
                maxLength={!isEmailType ? 12 : undefined}
              />
              {inputError && <p className="text-red-500 text-xs mt-1">{inputError}</p>}
            </div>
            
            {insufficientBalance && <p className="text-red-500 text-sm text-center mb-2">{texts.insufficientBalance}</p>}

            <div className="flex space-x-2 mt-2">
              <button
                onClick={onClose}
                className="w-full bg-gray-200 dark:bg-gray-600 text-light-text dark:text-dark-text font-bold py-3 rounded-lg hover:opacity-80 transition-opacity"
                disabled={status === 'processing'}
              >
                {texts.cancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'processing' ? <Spinner /> : texts.confirmPurchase}
              </button>
            </div>
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-2 bg-primary/30 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                    
                    <OfferIcon className="w-20 h-20 animate-burst relative z-10 text-primary" />
                </div>
                <h3 
                    className="text-2xl font-bold text-primary mb-2 opacity-0 animate-fade-in-up" 
                    style={{animationDelay: '0.4s'}}
                >
                    {texts.orderSuccessful}
                </h3>
                <p 
                    className="text-gray-600 dark:text-gray-300 opacity-0 animate-fade-in-up"
                    style={{animationDelay: '0.6s'}}
                >
                    {texts.orderPendingGeneric.replace('{packageName}', String(offer.name))}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;
