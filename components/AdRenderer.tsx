
import React, { FC, useEffect, useState } from 'react';

interface AdRendererProps {
    code: string;
}

const AdRenderer: FC<AdRendererProps> = ({ code }) => {
    const [iframeSrc, setIframeSrc] = useState<string>('');

    useEffect(() => {
        if (!code) return;

        // Create a self-contained HTML document for the ad
        const adHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            margin: 0; 
                            padding: 0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            overflow: hidden; 
                            background-color: transparent; 
                        }
                        /* Ensure images/iframes inside fit */
                        img, iframe { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    ${code}
                </body>
            </html>
        `;

        // Create a Blob URL
        const blob = new Blob([adHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setIframeSrc(url);

        // Cleanup
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [code]);

    if (!code) return null;

    return (
        <div className="w-full flex justify-center items-center my-4 overflow-hidden">
            <div className="w-full max-w-[320px] min-h-[50px] bg-transparent flex justify-center items-center">
                <iframe
                    src={iframeSrc}
                    title="Ad Content"
                    style={{
                        width: '300px', // Standard Mobile Ad Width
                        height: '250px', // Standard Rectangle Height
                        border: 'none',
                        overflow: 'hidden'
                    }}
                    scrolling="no"
                    // Removed 'allow-same-origin' to prevent ad from accessing parent, added it back if ad needs cookies
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
            </div>
        </div>
    );
};

export default AdRenderer;
