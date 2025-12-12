import React, { useEffect } from 'react';

const AdBanner = ({ slotId, format = 'auto', className = '' }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <div className={`ad-container my-8 text-center bg-gray-900/50 p-4 rounded-lg border border-gray-800 ${className}`}>
            <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Advertisement</div>
            <ins className="adsbygoogle block"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXX" // Replace with your AdSense Publisher ID
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"></ins>
        </div>
    );
};

export default AdBanner;
