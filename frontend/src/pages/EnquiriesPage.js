import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
    MessageSquare, ShoppingCart, Eye, Clock, CheckCircle, XCircle,
    Loader2, Search, Filter, ChevronRight, Package, User, Mail,
    Phone, ExternalLink, ArrowRight, Inbox, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const statusConfig = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    responded: { label: 'Responded', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const EnquiriesPage = () => {
    const { user, getAuthHeaders } = useApp();
    const navigate = useNavigate();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        fetchEnquiries();
    }, [user, navigate]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const [prodRes, cartRes] = await Promise.all([
                axios.get(`${API}/enquiries`, { headers: getAuthHeaders() }).catch(() => ({ data: [] })),
                axios.get(`${API}/cart-enquiries`, { headers: getAuthHeaders() }).catch(() => ({ data: [] }))
            ]);

            const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.enquiries || [];
            const cartData = Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.enquiries || [];

            // Combine and sort by date descending
            const combined = [...prodData, ...cartData].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            setEnquiries(combined);
        } catch (e) {
            toast.error('Failed to load enquiries');
        }
        setLoading(false);
    };

    const updateStatus = async (id, status, type = 'product') => {
        try {
            const endpoint = type === 'product' || type === 'contact' ? 'enquiries' : 'cart-enquiries';
            await axios.put(`${API}/${endpoint}/${id}?status=${status}`, {}, { headers: getAuthHeaders() });
            toast.success(`Enquiry marked as ${status}`);
            fetchEnquiries();
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const filteredEnquiries = enquiries.filter(e => {
        const matchesSearch = !search ||
            (e.name || e.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.email || e.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.message || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.subject || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <AdminLayout title="Enquiries" subtitle="Manage customer enquiries and quotes">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-10 w-10 animate-spin text-gold" />
                </div>
            </AdminLayout>
        );
    }

    const renderEnquiryCard = (enquiry) => {
        const config = statusConfig[enquiry.status] || statusConfig.new;
        const StatusIcon = config.icon;
        const type = (enquiry.items || enquiry.cart_items) ? 'cart' : (enquiry.type === 'contact' ? 'contact' : 'product');

        return (
            <Card key={enquiry.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn('text-xs', config.color)}>
                                    <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {enquiry.created_at ? new Date(enquiry.created_at).toLocaleDateString('en-AE', {
                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : ''}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div className="flex items-center gap-4 mb-2">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-navy">
                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                    {enquiry.name || enquiry.customer_name || 'Unknown'}
                                </div>
                                {(enquiry.email || enquiry.customer_email) && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />{enquiry.email || enquiry.customer_email}
                                    </div>
                                )}
                                {(enquiry.phone || enquiry.customer_phone) && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />{enquiry.phone || enquiry.customer_phone}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            {type === 'contact' || enquiry.type === 'contact' ? (
                                <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                        <Mail className="h-4 w-4 text-gold" />
                                        Subject: {enquiry.subject || 'General Inquiry'}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">"{enquiry.message}"</p>
                                </div>
                            ) : type === 'product' && enquiry.product_name ? (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                                    <Package className="h-4 w-4 text-gold" />
                                    <span className="text-sm font-medium">{enquiry.product_name}</span>
                                    {enquiry.quantity && <Badge variant="outline" className="text-xs">Qty: {enquiry.quantity}</Badge>}
                                    {enquiry.message && <p className="text-xs text-gray-500 mt-1 block">"{enquiry.message}"</p>}
                                </div>
                            ) : type === 'cart' && (enquiry.items || enquiry.cart_items) && (
                                <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                        <ShoppingCart className="h-4 w-4 text-gold" />
                                        {(enquiry.items || enquiry.cart_items).length} item(s) in request
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {(enquiry.items || enquiry.cart_items).slice(0, 3).map((item, i) => (
                                            <span key={i}>{item.product_name || item.name} ×{item.quantity}{i < Math.min((enquiry.items || enquiry.cart_items).length, 3) - 1 ? ', ' : ''}</span>
                                        ))}
                                        {(enquiry.items || enquiry.cart_items).length > 3 && <span> +{(enquiry.items || enquiry.cart_items).length - 3} more</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions - Simplified Status Toggle */}
                        <div className="flex flex-col gap-1">
                            <Select
                                value={enquiry.status}
                                onValueChange={(val) => updateStatus(enquiry.id, val, type)}
                            >
                                <SelectTrigger className="h-7 text-[10px] w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="responded">Responded</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <AdminLayout title="Enquiries" subtitle="Manage customer enquiries and requests">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total Enquiries</p>
                        <p className="text-2xl font-bold text-blue-600">{enquiries.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Awaiting Response</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {enquiries.filter(e => e.status === 'new' || e.status === 'pending').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Responded</p>
                        <p className="text-2xl font-bold text-green-600">
                            {enquiries.filter(e => e.status === 'responded').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Closed</p>
                        <p className="text-2xl font-bold text-gray-600">
                            {enquiries.filter(e => e.status === 'closed').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, message..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="responded">Responded</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchEnquiries} className="h-10">
                    <RefreshCw className="h-4 w-4 mr-2" />Refresh
                </Button>
            </div>

            <div className="space-y-3">
                {filteredEnquiries.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No enquiries found</h3>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            Customer enquiries and requests will appear here once submitted.
                        </p>
                    </div>
                ) : (
                    filteredEnquiries.map(enquiry => renderEnquiryCard(enquiry))
                )}
            </div>
        </AdminLayout>
    );
};

export default EnquiriesPage;
