import React from 'react';
import { Ticket, Bell } from 'lucide-react';

export const CouponsPage = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500">
        <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 border border-gray-800">
            <Ticket className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Coupons Management</h2>
        <p>Create and manage discount codes for subscriptions.</p>
    </div>
);

export const NotificationsPage = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500">
        <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 border border-gray-800">
            <Bell className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Push Notifications</h2>
        <p>Send updates and announcements to all users.</p>
    </div>
);
