
import React, { FC, useEffect, useState } from 'react';
import type { User, Transaction } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import AdRenderer from './AdRenderer';

interface MyTransactionScreenProps {
  user: User;
  texts: any;
  adCode?: string;
  adActive?: boolean;
}

const PlusCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>);
const WalletIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);

// New Solid Earn/Money Icon
const EarnIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.12h-2.17c-.09-.65-.61-1.58-2.38-1.58-1.39 0-2 .61-2 1.4 0 .78.41 1.41 2.25 1.89 2.71.7 4.53 1.84 4.53 3.91 0 2.18-1.55 3.26-3.46 3.6z"/>
    </svg>
);

const WavyPath = () => (
  <svg className="absolute w-full h-full top-0 left-0" preserveAspectRatio="none" viewBox="0 0 350 210">
    <path d="M0 70 C50 30, 100 110, 150 70 S250 30, 300 70 S400 110, 450 70" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
    <path d="M0 140 C50 100, 100 180, 150 140 S250 100, 300 140 S400 180, 450 140" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
  </svg>
);


const TransactionItem: FC<{ transaction: Transaction, texts: any, index: number }> = ({ transaction, texts, index }) => {
    
    // Find payment method details based on transaction method name
    const methodDetails = PAYMENT_METHODS.find(p => p.name === transaction.method);
    const hasLogo = !!methodDetails;

    const statusColors = {
        Completed: 'bg-green-500',
        Pending: 'bg-yellow-500',
        Failed: 'bg-red-500',
    };

    const statusTextColors = {
        Completed: 'text-green-600 dark:text-green-400',
        Pending: 'text-yellow-600 dark:text-yellow-400',
        Failed: 'text-red-600 dark:text-red-400',
    };

    return (
        <div 
            className="group relative bg-light-card dark:bg-dark-card rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800 opacity-0 animate-smart-slide-up overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
        >
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColors[transaction.status]}`}></div>

            <div className="flex items-center justify-between pl-3">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 overflow-hidden transition-colors ${hasLogo ? 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'}`}>
                             {hasLogo ? (
                                <img src={methodDetails.logo} alt={transaction.method} className="w-full h-full object-contain" />
                             ) : (
                                <EarnIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                             )}
                        </div>
                         <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-white dark:border-dark-card">
                            <PlusCircleIcon className="w-3 h-3" />
                         </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-xs text-light-text dark:text-dark-text">
                            {hasLogo ? texts.addFunds : (transaction.type === 'ad_reward' ? 'Ad Earnings' : 'Bonus/Deposit')}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="font-medium">{transaction.method}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span>{new Date(transaction.date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className={`font-bold text-sm ${transaction.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-light-text dark:text-dark-text'}`}>
                        +{texts.currency}{transaction.amount}
                    </p>
                    <p className={`text-[9px] uppercase font-bold tracking-wide mt-0.5 ${statusTextColors[transaction.status]}`}>
                        {transaction.status}
                    </p>
                </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 pl-3 flex justify-between items-center">
                 <span className="text-[9px] text-gray-400 uppercase tracking-wider">Transaction ID</span>
                 <span className="text-[9px] font-mono text-gray-600 dark:text-gray-400">{transaction.id}</span>
            </div>
        </div>
    );
}

const MyTransactionScreen: FC<MyTransactionScreenProps> = ({ user, texts, adCode, adActive }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Force Scroll Top on Mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!user.uid) return;
        const txnRef = ref(db, 'transactions/' + user.uid);
        const unsubscribe = onValue(txnRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const txnList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: data[key].id || key,
                    key: key
                })).reverse();
                setTransactions(txnList);
            } else {
                setTransactions([]);
            }
        });
        return () => unsubscribe();
    }, [user.uid]);

    const totalDeposit = transactions
        .filter(t => t.status === 'Completed')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="p-4 animate-smart-fade-in pb-20">
             <div className="max-w-lg mx-auto">
                <div className="relative bg-gradient-to-r from-primary to-secondary p-5 rounded-2xl text-white shadow-xl mb-5 overflow-hidden animate-smart-slide-down flex items-center justify-between">
                    <WavyPath />
                    <div className="relative z-10 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{texts.totalDeposit}</p>
                        <div className="flex items-center space-x-2">
                             <span className="text-2xl font-extrabold text-white tracking-tight">{texts.currency}{totalDeposit}</span>
                        </div>
                        <p className="text-[9px] text-white/70 mt-0.5 font-medium">Lifetime Deposit</p>
                    </div>
                     <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/10">
                         <WalletIcon className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    {transactions.length > 0 ? (
                        transactions.map((transaction, index) => (
                           <TransactionItem key={transaction.key || transaction.id} transaction={transaction} texts={texts} index={index} />
                        ))
                    ) : (
                        <div className="text-center py-10 animate-smart-fade-in">
                            <p className="text-gray-400">{texts.ordersEmpty}</p>
                        </div>
                    )}
                </div>
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

export default MyTransactionScreen;
