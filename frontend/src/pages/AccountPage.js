import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import {
  User, Package, FileText, Settings, LogOut, ChevronRight,
  Download, Eye, Clock, CheckCircle, Truck, XCircle, Loader2,
  Edit, Save, X, Mail, Phone, MapPin, Calendar, Shield, AlertCircle,
  Plus, Trash2, Home, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// Status badge colors and icons
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  processing: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Processing' },
  shipped: { color: 'bg-indigo-100 text-indigo-800', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
};

// Profile Section Component
const ProfileSection = ({ user, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>Manage your personal details</CardDescription>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading} className="bg-gold hover:bg-gold-dark text-navy-dark">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="h-10 w-10 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-navy">{user?.name}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            <Badge className="mt-1 bg-gold/10 text-gold border-0">
              {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Full Name
            </Label>
            {editing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-navy font-medium">{user?.name || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
            </Label>
            <div className="flex items-center gap-2">
              <p className="text-navy font-medium">{user?.email}</p>
              {user?.email_verified ? (
                <Badge className="bg-green-100 text-green-700 border-0">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Link to="/verify-account">
                  <Badge className="bg-orange-100 text-orange-700 border-0 cursor-pointer hover:bg-orange-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Verify Now
                  </Badge>
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
            </Label>
            {editing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 50 123 4567"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-navy font-medium">{user?.phone || 'Not provided'}</p>
                {user?.phone && (
                  user?.phone_verified ? (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Member Since
            </Label>
            <p className="text-navy font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-AE', {
                year: 'numeric', month: 'long', day: 'numeric'
              }) : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Address Section Component
const AddressSection = ({ user, onUpdate }) => {
  const { getAuthHeaders, settings } = useApp();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: user?.name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: 'Dubai',
    emirate: 'Dubai',
    is_default: false
  });

  const emirates = settings?.delivery_emirates || ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const resetForm = () => {
    setFormData({
      label: 'Home',
      full_name: user?.name || '',
      phone: user?.phone || '',
      address_line1: '',
      address_line2: '',
      city: 'Dubai',
      emirate: 'Dubai',
      is_default: addresses.length === 0
    });
    setEditingAddress(null);
  };

  const handleEdit = (address, index) => {
    setFormData({ ...address });
    setEditingAddress(index);
    setShowAddDialog(true);
  };

  const handleDelete = async (index) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    try {
      const newAddresses = addresses.filter((_, i) => i !== index);
      await axios.put(`${API}/users/addresses`, { addresses: newAddresses }, { headers: getAuthHeaders() });
      setAddresses(newAddresses);
      toast.success('Address deleted');
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Failed to delete address');
    }
    setLoading(false);
  };

  const handleSetDefault = async (index) => {
    setLoading(true);
    try {
      const newAddresses = addresses.map((addr, i) => ({
        ...addr,
        is_default: i === index
      }));
      await axios.put(`${API}/users/addresses`, { addresses: newAddresses }, { headers: getAuthHeaders() });
      setAddresses(newAddresses);
      toast.success('Default address updated');
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Failed to update default address');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.address_line1 || !formData.city || !formData.emirate || !formData.full_name || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let newAddresses;
      if (editingAddress !== null) {
        // Update existing address
        newAddresses = addresses.map((addr, i) => i === editingAddress ? formData : addr);
      } else {
        // Add new address
        const newAddress = { ...formData, id: Date.now().toString() };
        if (newAddress.is_default) {
          newAddresses = addresses.map(a => ({ ...a, is_default: false }));
          newAddresses.push(newAddress);
        } else {
          newAddresses = [...addresses, newAddress];
        }
      }

      await axios.put(`${API}/users/addresses`, { addresses: newAddresses }, { headers: getAuthHeaders() });
      setAddresses(newAddresses);
      toast.success(editingAddress !== null ? 'Address updated' : 'Address added');
      setShowAddDialog(false);
      resetForm();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Failed to save address');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Saved Addresses</CardTitle>
          <CardDescription>Manage your delivery addresses</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold-dark text-navy-dark">
              <Plus className="h-4 w-4 mr-2" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAddress !== null ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address Label</Label>
                  <Select value={formData.label} onValueChange={(v) => setFormData({ ...formData, label: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home"><div className="flex items-center gap-2"><Home className="h-4 w-4" /> Home</div></SelectItem>
                      <SelectItem value="Office"><div className="flex items-center gap-2"><Building className="h-4 w-4" /> Office</div></SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+971 50 123 4567" />
              </div>
              <div className="space-y-2">
                <Label>Address Line 1 *</Label>
                <Input value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} placeholder="Building name, street address" />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2 (Optional)</Label>
                <Input value={formData.address_line2 || ''} onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })} placeholder="Apartment, suite, floor, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Dubai" />
                </div>
                <div className="space-y-2">
                  <Label>Emirate *</Label>
                  <Select value={formData.emirate} onValueChange={(v) => setFormData({ ...formData, emirate: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emirates.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading} className="bg-gold hover:bg-gold-dark text-navy-dark">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Address</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No saved addresses yet</p>
            <Button variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${address.is_default ? 'border-gold bg-gold/5' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${address.is_default ? 'bg-gold/20' : 'bg-gray-100'}`}>
                      {address.label === 'Home' ? <Home className="h-5 w-5 text-gold" /> :
                        address.label === 'Office' ? <Building className="h-5 w-5 text-blue-500" /> :
                          <MapPin className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-navy">{address.label}</h4>
                        {address.is_default && (
                          <Badge className="bg-gold/20 text-gold border-0 text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="font-medium">{address.full_name}</p>
                      <p className="text-sm text-muted-foreground">{address.address_line1}</p>
                      {address.address_line2 && <p className="text-sm text-muted-foreground">{address.address_line2}</p>}
                      <p className="text-sm text-muted-foreground">{address.city}, {address.emirate}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {address.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!address.is_default && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(index)} title="Set as default">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(address, index)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Order Card Component
const OrderCard = ({ order, onDownloadInvoice }) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await onDownloadInvoice(order.id, order.invoice_number);
    setDownloading(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-navy">{order.order_number}</h3>
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString('en-AE')}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {order.items?.length || 0} items
              </span>
              <span className="font-semibold text-gold">
                AED {order.total?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to={`/order/${order.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" /> View
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Invoice</>
              )}
            </Button>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {order.items?.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={item.image || "https://via.placeholder.com/60"}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {order.items?.length > 4 && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                +{order.items.length - 4}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Orders Section Component
const OrdersSection = () => {
  const { getAuthHeaders } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders`, { headers: getAuthHeaders() });
      setOrders(res.data.orders || []);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    }
    setLoading(false);
  };

  const downloadInvoice = async (orderId, invoiceNumber) => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}/invoice`, { headers: getAuthHeaders() });

      // Convert base64 to blob and download
      const byteCharacters = atob(res.data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.data.filename || `invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (e) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-gold hover:bg-gold-dark text-navy-dark' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-1 text-xs">
                ({orders.filter(o => o.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No Orders Found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`}
            </p>
            <Link to="/products">
              <Button className="bg-gold hover:bg-gold-dark text-navy-dark">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onDownloadInvoice={downloadInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Order Detail Page Component (for viewing single order)
export const OrderDetailPage = () => {
  const { id } = useParams();
  const { getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API}/orders/${id}`, { headers: getAuthHeaders() });
      setOrder(res.data);
    } catch (e) {
      toast.error('Order not found');
      navigate('/account');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!order) return null;

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/account" className="hover:text-gold">My Account</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/account?tab=orders" className="hover:text-gold">Orders</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-navy">{order.order_number}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Order {order.order_number}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.created_at).toLocaleDateString('en-AE', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={`${status.color} text-sm`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Order Status Timeline */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-4">Order Progress</h4>
                  <div className="flex items-center justify-between">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((s, idx) => {
                      const isActive = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= idx;
                      const config = statusConfig[s];
                      const Icon = config.icon;
                      return (
                        <div key={s} className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`text-xs mt-2 ${isActive ? 'text-gold font-medium' : 'text-muted-foreground'}`}>
                            {config.label}
                          </span>
                          {idx < 4 && (
                            <div className={`absolute h-0.5 w-full ${isActive ? 'bg-gold' : 'bg-gray-200'}`}
                              style={{ left: '50%', top: '20px', width: 'calc(100% - 40px)', marginLeft: '20px' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Order Items */}
                <h4 className="font-semibold mb-4">Order Items</h4>
                <div className="space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.image || "https://via.placeholder.com/80"}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-navy">{item.product_name}</h5>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm">Qty: {item.quantity}</span>
                          <span className="font-semibold text-gold">AED {item.total_price?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gold" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.shipping_address?.full_name}</p>
                <p className="text-muted-foreground">{order.shipping_address?.address_line1}</p>
                <p className="text-muted-foreground">
                  {order.shipping_address?.city}, {order.shipping_address?.emirate}
                </p>
                <p className="text-muted-foreground">Phone: {order.shipping_address?.phone}</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>AED {order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({order.vat_percentage || 5}%)</span>
                  <span>AED {order.vat_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping_cost === 0 ? 'FREE' : `AED ${order.shipping_cost?.toFixed(2)}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-gold">AED {order.total?.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <Button className="w-full bg-gold hover:bg-gold-dark text-navy-dark mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Account Page Component
const AccountPage = () => {
  const { user, logout, refreshUser } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-gold">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-navy">My Account</span>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="mt-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === 'profile'
                      ? 'bg-gold/10 text-gold font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === 'addresses'
                      ? 'bg-gold/10 text-gold font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <MapPin className="h-5 w-5" />
                    Addresses
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === 'orders'
                      ? 'bg-gold/10 text-gold font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <Package className="h-5 w-5" />
                    My Orders
                  </button>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSection user={user} />
            )}

            {activeTab === 'addresses' && (
              <AddressSection user={user} onUpdate={refreshUser} />
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">My Orders</h2>
                    <p className="text-muted-foreground">Track and manage your orders</p>
                  </div>
                </div>
                <OrdersSection />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
