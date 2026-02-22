import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Ticket, Plus, Trash2, Percent, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const CouponsPage = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', discount_percent: 10, max_uses: 100, expires_at: '' });

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        try {
            const resp = await axios.get(`${API_URL}/api/admin/coupons`);
            setCoupons(resp.data);
        } catch { toast.error('Failed to load coupons'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.code.trim()) { toast.error('Coupon code required'); return; }
        setCreating(true);
        try {
            const payload = { ...form, code: form.code.trim().toUpperCase() };
            if (!payload.expires_at) delete payload.expires_at;
            await axios.post(`${API_URL}/api/admin/coupons`, payload);
            toast.success('Coupon created!');
            setForm({ code: '', discount_percent: 10, max_uses: 100, expires_at: '' });
            setShowForm(false);
            fetchCoupons();
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/coupons/${id}`);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Coupons</h2>
                    <p className="text-xs text-gray-500">Create and manage discount codes</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(!showForm)}
                    className="bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-bold text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />New Coupon
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="rounded-2xl border border-emerald-500/15 bg-[#0d0d0d] p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-400 text-xs mb-1.5 block">Coupon Code</Label>
                            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. LAUNCH50" className="bg-black/50 border-white/10 text-white font-mono" />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs mb-1.5 block">Discount %</Label>
                            <Input type="number" min={1} max={100} value={form.discount_percent}
                                onChange={e => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })}
                                className="bg-black/50 border-white/10 text-white" />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs mb-1.5 block">Max Uses</Label>
                            <Input type="number" min={1} value={form.max_uses}
                                onChange={e => setForm({ ...form, max_uses: parseInt(e.target.value) || 1 })}
                                className="bg-black/50 border-white/10 text-white" />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs mb-1.5 block">Expires At (optional)</Label>
                            <Input type="datetime-local" value={form.expires_at}
                                onChange={e => setForm({ ...form, expires_at: e.target.value })}
                                className="bg-black/50 border-white/10 text-white" />
                        </div>
                    </div>
                    <Button type="submit" disabled={creating} className="bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-bold text-sm w-full">
                        {creating ? 'Creating…' : 'Create Coupon'}
                    </Button>
                </form>
            )}

            {/* Coupons List */}
            <div className="space-y-2">
                {coupons.map(c => {
                    const expired = c.expires_at && new Date(c.expires_at) < new Date();
                    const maxed = c.current_uses >= c.max_uses;
                    return (
                        <div key={c.id} className={`rounded-xl border bg-[#0d0d0d] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${expired || maxed ? 'border-red-500/15 opacity-60' : 'border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <Ticket className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white font-mono">{c.code}</span>
                                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-[10px]">
                                            <Percent className="w-2.5 h-2.5 mr-0.5" />{c.discount_percent}% off
                                        </Badge>
                                        {expired && <Badge variant="outline" className="border-red-500/20 text-red-400 text-[10px]">Expired</Badge>}
                                        {maxed && <Badge variant="outline" className="border-amber-500/20 text-amber-400 text-[10px]">Maxed</Badge>}
                                    </div>
                                    <div className="text-[11px] text-gray-600 mt-0.5 flex gap-3">
                                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{c.current_uses}/{c.max_uses} used</span>
                                        {c.expires_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.expires_at).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-500/60 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    );
                })}

                {coupons.length === 0 && !loading && (
                    <div className="text-center py-16 text-gray-600 rounded-xl border border-white/5 bg-[#0d0d0d]">
                        <Ticket className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No coupons yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponsPage;
