
import React, { FC, useEffect, useState } from 'react';

interface AdRendererProps {
    code: string;
    active?: boolean;
}

const AdRenderer: FC<AdRendererProps> = ({ code, active = true }) => {
    const [iframeSrc, setIframeSrc] = useState<string>('');

    useEffect(() => {
        if (!code || !active) return;

        // --- ADSTERRA FIX: Protocol & Script Handling ---
        // 1. Ensure scripts starting with // use https:
        let processedCode = code.replace(/src="\/\//g, 'src="https://');
        processedCode = processedCode.replace(/src='\/\//g, "src='https://");

        // 2. Create a self-contained HTML document for the ad
        // We inject the script inside body.
        // Added CSS to center content properly and reset margins.
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
                            width: 100%;
                            height: 100%;
                        }
                        /* Ensure images/iframes inside fit but don't force restrictive width */
                        img, iframe { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    ${processedCode}
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
    }, [code, active]);

    if (!code || !active) return null;

    return (
        <div className="w-full flex justify-center items-center my-4 overflow-hidden">
            {/* Removed fixed max-width: 320px constraint to allow full banners (e.g. 468px) to show */}
            <div className="w-full min-h-[60px] bg-transparent flex justify-center items-center">
                <iframe
                    src={iframeSrc}
                    title="Ad Content"
                    style={{
                        width: '100%', 
                        maxWidth: '100%', // Allow it to take available space
                        minWidth: '250px', // Lower min-width to accommodate iPhone SE (320px)
                        height: '100px', // Give enough vertical space for banner + margins
                        border: 'none',
                        overflow: 'hidden'
                    }}
                    scrolling="no"
                    // Important: allow-scripts for JS execution, allow-popups for ad clicks
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                />
            </div>
        </div>
    );
};

export default AdRenderer;