import React, { FC } from 'react';
import type { SupportContact } from '../types';

const PhoneIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const WhatsAppIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
const TelegramIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const ArrowUpRightIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>);
const PlayCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" /></svg>);
const HeadphonesIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>);


interface ContactUsScreenProps {
  texts: any;
  contacts?: SupportContact[];
}

const ContactCard: FC<{ contact: SupportContact & { title?: string }, texts: any, index: number }> = ({ contact, texts, index }) => {
    const iconMap: { [key: string]: FC<{className?: string}> } = {
        video: PlayCircleIcon,
        phone: PhoneIcon,
        whatsapp: WhatsAppIcon,
        telegram: TelegramIcon,
        email: MailIcon,
    };

    const colorMap: { [key: string]: string } = {
        video: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 group-hover:bg-red-500 group-hover:text-white',
        phone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
        whatsapp: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white',
        telegram: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white',
        email: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white',
    };

    const IconComponent = iconMap[contact.type] || HeadphonesIcon;
    const colorClass = colorMap[contact.type] || 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    const isFullWidth = contact.type === 'video';

    // Use dynamic title if available, fallback to text key
    const displayName = contact.title || texts[contact.labelKey] || contact.labelKey;

    return (
        <a
            href={contact.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center p-4 bg-light-card dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 opacity-0 animate-smart-slide-up ${isFullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className={`p-4 rounded-xl transition-colors duration-300 mr-4 ${colorClass}`}>
                <IconComponent className="w-6 h-6" />
            </div>
            
            <div className="flex-grow">
                <h3 className="font-bold text-light-text dark:text-dark-text text-base group-hover:text-primary transition-colors">
                    {displayName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {contact.type === 'video' ? 'Watch tutorial' : contact.type === 'phone' ? 'Call us directly' : 'Chat with support'}
                </p>
            </div>

            <div className="text-gray-300 group-hover:text-primary transition-colors">
                <ArrowUpRightIcon className="w-5 h-5" />
            </div>
        </a>
    );
};

const ContactUsScreen: FC<ContactUsScreenProps> = ({ texts, contacts }) => {
    // Fallback if no dynamic contacts yet
    const displayContacts = contacts && contacts.length > 0 ? contacts : [];

    return (
        <div className="p-4 animate-smart-fade-in pb-20">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8 animate-smart-pop-in">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-4">
                        <HeadphonesIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-light-text dark:text-dark-text mb-2">
                        {texts.getInTouch}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                        Have a question or need help with your order? We are here to assist you 24/7.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayContacts.map((contact, index) => (
                        <ContactCard key={index} contact={contact} texts={texts} index={index} />
                    ))}
                </div>

                 <div className="mt-8 text-center opacity-0 animate-smart-slide-up" style={{ animationDelay: '600ms' }}>
                    <p className="text-xs text-gray-400">
                        Operating Hours: 10:00 AM - 10:00 PM
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContactUsScreen;