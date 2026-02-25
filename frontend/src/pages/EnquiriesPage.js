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
    const [activeTab, setActiveTab] = useState('product');
    const [productEnquiries, setProductEnquiries] = useState([]);
    const [cartEnquiries, setCartEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        fetchEnquiries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, navigate]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const [prodRes, cartRes] = await Promise.all([
                axios.get(`${API}/enquiries`, { headers: getAuthHeaders() }).catch(() => ({ data: [] })),
                axios.get(`${API}/cart-enquiries`, { headers: getAuthHeaders() }).catch(() => ({ data: [] }))
            ]);
            setProductEnquiries(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.enquiries || []);
            setCartEnquiries(Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.enquiries || []);
        } catch (e) {
            toast.error('Failed to load enquiries');
        }
        setLoading(false);
    };

    const updateStatus = async (id, status, type = 'product') => {
        try {
            const endpoint = type === 'product' ? 'enquiries' : 'cart-enquiries';
            await axios.put(`${API}/${endpoint}/${id}/status?status=${status}`, {}, { headers: getAuthHeaders() });
            toast.success(`Enquiry marked as ${status}`);
            fetchEnquiries();
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const filterEnquiries = (enquiries) => {
        return enquiries.filter(e => {
            const matchesSearch = !search ||
                (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
                (e.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (e.message || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    };

    const filteredProductEnquiries = filterEnquiries(productEnquiries);
    const filteredCartEnquiries = filterEnquiries(cartEnquiries);

    const newProductCount = productEnquiries.filter(e => e.status === 'new' || e.status === 'pending').length;
    const newCartCount = cartEnquiries.filter(e => e.status === 'new' || e.status === 'pending').length;

    if (loading) {
        return (
            <AdminLayout title="Enquiries" subtitle="Manage customer enquiries and quotes">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-10 w-10 animate-spin text-gold" />
                </div>
            </AdminLayout>
        );
    }

    const renderEnquiryCard = (enquiry, type) => {
        const config = statusConfig[enquiry.status] || statusConfig.new;
        const StatusIcon = config.icon;

        return (
            <Card key={enquiry.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn('text-xs', config.color)}>
                                    <StatusIcon className="h-3 w-3 mr-1" />{config.label}
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
                                    {enquiry.name || 'Unknown'}
                                </div>
                                {enquiry.email && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />{enquiry.email}
                                    </div>
                                )}
                                {enquiry.phone && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />{enquiry.phone}
                                    </div>
                                )}
                            </div>

                            {/* Product/Cart Info */}
                            {enquiry.type === 'contact' ? (
                                <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                        <Mail className="h-4 w-4 text-gold" />
                                        Subject: {enquiry.subject}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">"{enquiry.message}"</p>
                                </div>
                            ) : type === 'product' && enquiry.product_name ? (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                                    <Package className="h-4 w-4 text-gold" />
                                    <span className="text-sm font-medium">{enquiry.product_name}</span>
                                    {enquiry.quantity && <Badge variant="outline" className="text-xs">Qty: {enquiry.quantity}</Badge>}
                                </div>
                            ) : type === 'cart' && enquiry.items && (
                                <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                        <ShoppingCart className="h-4 w-4 text-gold" />
                                        {enquiry.items.length} item(s) in cart
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {enquiry.items.slice(0, 3).map((item, i) => (
                                            <span key={i}>{item.product_name || item.name} ×{item.quantity}{i < Math.min(enquiry.items.length, 3) - 1 ? ', ' : ''}</span>
                                        ))}
                                        {enquiry.items.length > 3 && <span> +{enquiry.items.length - 3} more</span>}
                                    </div>
                                </div>
                            )}

                            {/* Old Message block (kept for old product enquiries without type) */}
                            {enquiry.message && enquiry.type !== 'contact' && (
                                <p className="text-sm text-gray-600 line-clamp-2 italic">"{enquiry.message}"</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                            {(enquiry.status === 'new' || enquiry.status === 'pending') && (
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs h-7"
                                    onClick={() => updateStatus(enquiry.id, 'responded', type)}>
                                    <CheckCircle className="h-3 w-3 mr-1" />Respond
                                </Button>
                            )}
                            {enquiry.status === 'responded' && (
                                <Button size="sm" variant="outline" className="text-xs h-7"
                                    onClick={() => updateStatus(enquiry.id, 'closed', type)}>
                                    <XCircle className="h-3 w-3 mr-1" />Close
                                </Button>
                            )}
                            {enquiry.status === 'closed' && (
                                <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground"
                                    onClick={() => updateStatus(enquiry.id, 'new', type)}>
                                    Reopen
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderEmptyState = (type) => (
        <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
                No {type === 'product' ? 'product' : 'cart'} enquiries
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
                {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : `When customers submit ${type} enquiries, they'll appear here.`}
            </p>
        </div>
    );

    return (
        <AdminLayout title="Enquiries" subtitle="Manage customer enquiries and quote requests">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Product Enquiries</p>
                        <p className="text-2xl font-bold text-blue-600">{productEnquiries.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Cart Enquiries</p>
                        <p className="text-2xl font-bold text-amber-600">{cartEnquiries.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Awaiting Response</p>
                        <p className="text-2xl font-bold text-orange-600">{newProductCount + newCartCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Responded</p>
                        <p className="text-2xl font-bold text-green-600">
                            {[...productEnquiries, ...cartEnquiries].filter(e => e.status === 'responded').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, product..."
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
                <Button variant="outline" onClick={fetchEnquiries}>
                    <RefreshCw className="h-4 w-4 mr-2" />Refresh
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="product" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Product Enquiries
                        {newProductCount > 0 && <Badge className="bg-red-500 text-white text-[10px] h-5 ml-1">{newProductCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="cart" className="gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Cart Enquiries
                        {newCartCount > 0 && <Badge className="bg-red-500 text-white text-[10px] h-5 ml-1">{newCartCount}</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="product">
                    <div className="space-y-3">
                        {filteredProductEnquiries.length === 0 ? renderEmptyState('product') :
                            filteredProductEnquiries.map(e => renderEnquiryCard(e, 'product'))}
                    </div>
                </TabsContent>

                <TabsContent value="cart">
                    <div className="space-y-3">
                        {filteredCartEnquiries.length === 0 ? renderEmptyState('cart') :
                            filteredCartEnquiries.map(e => renderEnquiryCard(e, 'cart'))}
                    </div>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
};

export default EnquiriesPage;
