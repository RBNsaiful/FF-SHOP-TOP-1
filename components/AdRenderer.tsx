import React, { FC, useEffect, useState } from 'react';

interface AdRendererProps {
    code: string;
    active?: boolean;
}

const AdRenderer: FC<AdRendererProps> = ({ code, active = true }) => {
    const [iframeSrc, setIframeSrc] = useState<string>('');

    useEffect(() => {
        if (!code || !active) return;

        // Create a self-contained HTML document for the ad
        // Inject script inside body to ensure execution
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
    }, [code, active]);

    if (!code || !active) return null;

    return (
        <div className="w-full flex justify-center items-center my-4 overflow-hidden">
            <div className="w-full max-w-[320px] min-h-[50px] bg-transparent flex justify-center items-center">
                <iframe
                    src={iframeSrc}
                    title="Ad Content"
                    style={{
                        width: '100%', 
                        maxWidth: '468px',
                        height: '70px', // Adjusted to fit banner + margins
                        border: 'none',
                        overflow: 'hidden'
                    }}
                    scrolling="no"
                    // Important: allow-scripts for JS execution
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                />
            </div>
        </div>
    );
};

export default AdRenderer;