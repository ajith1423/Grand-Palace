import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Package, FileText, Grid, Settings, Users, Plus, Edit, Trash2, Eye, Search,
  ChevronLeft, ChevronUp, ChevronDown, Loader2, Download, Check, X, Image as ImageIcon,
  CreditCard, AlertCircle, Save, Percent, Building, LogOut, MessageSquare,
  CheckCircle, XCircle, RefreshCw, Mail, Phone, Shield, Upload, GripVertical, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// Admin Customers Management with Verification Status
export const AdminCustomers = () => {
  const { user, getAuthHeaders, loading: userLoading } = useApp();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (userLoading) return; // Wait for user to load
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, navigate]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API}/admin/customers`, { headers: getAuthHeaders() });
      setCustomers(res.data.customers);
    } catch (e) { toast.error('Failed to load customers'); }
    setLoading(false);
  };

  const handleVerifyEmail = async (userId) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/verify-email`, {}, { headers: getAuthHeaders() });
      toast.success('Email verified manually');
      fetchCustomers();
    } catch (e) { toast.error('Failed to verify email'); }
    setActionLoading(null);
  };

  const handleResendOTP = async (userId) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/resend-otp`, {}, { headers: getAuthHeaders() });
      toast.success('OTP sent to customer');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to send OTP'); }
    setActionLoading(null);
  };

  const handleToggleStatus = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await axios.post(`${API}/admin/users/${userId}/toggle-status`, {}, { headers: getAuthHeaders() });
      toast.success(res.data.message);
      fetchCustomers();
    } catch (e) { toast.error('Failed to update status'); }
    setActionLoading(null);
  };

  if (loading) return <AdminLayout title="Customers" subtitle="Manage customer accounts"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Customers" subtitle="Manage customer accounts">
      <div className="flex items-center justify-between mb-6">
        <Badge variant="secondary">{customers.length} total</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Email Verified</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell className="text-center">
                    {customer.email_verified ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={customer.is_active !== false ? 'bg-green-500' : 'bg-gray-500'}>
                      {customer.is_active !== false ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {!customer.email_verified && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyEmail(customer.id)}
                            disabled={actionLoading === customer.id}
                            title="Manually verify email"
                          >
                            {actionLoading === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendOTP(customer.id)}
                            disabled={actionLoading === customer.id}
                            title="Resend OTP"
                          >
                            {actionLoading === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant={customer.is_active !== false ? "destructive" : "default"}
                        onClick={() => handleToggleStatus(customer.id)}
                        disabled={actionLoading === customer.id}
                        title={customer.is_active !== false ? 'Disable user' : 'Enable user'}
                      >
                        {actionLoading === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> :
                          customer.is_active !== false ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {customers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No customers found</div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};
export const AdminProducts = () => {
  const { user, getAuthHeaders, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', offer_price: '', category_id: '', sku: '', stock: '', brand: '', images: '', is_active: true, is_featured: false, is_test: false,
    highlights: '', specifications: '', box_contents: '', faqs: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchProducts = async () => {
    try { const res = await axios.get(`${API}/products/all`, { headers: getAuthHeaders() }); setProducts(res.data.products); } catch (e) { toast.error('Failed to load products'); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try { const res = await axios.get(`${API}/categories/all`, { headers: getAuthHeaders() }); setCategories(res.data); } catch (e) { console.error('Failed to load categories'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Parse highlights (one per line)
    const highlights = formData.highlights ? formData.highlights.split('\n').map(s => s.trim()).filter(Boolean) : [];

    // Parse specifications (key: value per line)
    const specifications = {};
    if (formData.specifications) {
      formData.specifications.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          specifications[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    // Parse box contents (one per line)
    const box_contents = formData.box_contents ? formData.box_contents.split('\n').map(s => s.trim()).filter(Boolean) : [];

    // Parse FAQs (Q: and A: format)
    const faqs = [];
    if (formData.faqs) {
      const faqBlocks = formData.faqs.split(/\n\n+/);
      faqBlocks.forEach(block => {
        const qMatch = block.match(/Q:\s*(.+)/);
        const aMatch = block.match(/A:\s*(.+)/s);
        if (qMatch && aMatch) {
          faqs.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
        }
      });
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
      stock: parseInt(formData.stock) || 0,
      images: formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      highlights,
      specifications,
      box_contents,
      faqs
    };

    // Remove string versions
    delete data.highlights;
    delete data.specifications;
    delete data.box_contents;
    delete data.faqs;
    data.highlights = highlights;
    data.specifications = specifications;
    data.box_contents = box_contents;
    data.faqs = faqs;

    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, data, { headers: getAuthHeaders() });
        toast.success('Product updated');
      } else {
        await axios.post(`${API}/products`, data, { headers: getAuthHeaders() });
        toast.success('Product created');
      }
      setShowForm(false); setEditingProduct(null); fetchProducts();
      setFormData({ name: '', description: '', price: '', offer_price: '', category_id: '', sku: '', stock: '', brand: '', images: '', is_active: true, is_featured: false, is_test: false, highlights: '', specifications: '', box_contents: '', faqs: '' });
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save product'); }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, description: product.description, price: product.price?.toString(),
      offer_price: product.offer_price?.toString() || '', category_id: product.category_id,
      sku: product.sku, stock: product.stock?.toString(), brand: product.brand || '',
      images: product.images?.join(',') || '', is_active: product.is_active, is_featured: product.is_featured, is_test: product.is_test || false,
      highlights: product.highlights?.join('\n') || '',
      specifications: product.specifications ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
      box_contents: product.box_contents?.join('\n') || '',
      faqs: product.faqs ? product.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n') : ''
    });
    setShowForm(true);
  };

  useEffect(() => {
    if (products.length > 0 && location.search) {
      const params = new URLSearchParams(location.search);
      const editId = params.get('edit');
      if (editId) {
        const productToEdit = products.find(p => p.id === editId);
        if (productToEdit && !editingProduct) {
          handleEdit(productToEdit);
          navigate('/admin/products', { replace: true });
        }
      }
    }
  }, [products, location.search, navigate, editingProduct]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await axios.delete(`${API}/products/${id}`, { headers: getAuthHeaders() }); toast.success('Product deleted'); fetchProducts(); } catch (e) { toast.error('Failed to delete'); }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = !searchQuery ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Apply sorting
    return [...result].sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return (a.name || '').localeCompare(b.name || '');
        case 'za':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, categoryFilter, sortOption]);

  if (loading) return <AdminLayout title="Products" subtitle="Manage your product catalog"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div></AdminLayout>;

  return (
    <AdminLayout title="Products" subtitle="Manage your product catalog">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, SKU, or brand..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">New to Old</SelectItem>
            <SelectItem value="oldest">Old to New</SelectItem>
            <SelectItem value="az">A to Z</SelectItem>
            <SelectItem value="za">Z to A</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="flex items-center gap-1 h-10 px-4 text-sm">
          <Package className="h-4 w-4" />{filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
        </Badge>
        <Button onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', price: '', offer_price: '', category_id: '', sku: '', stock: '', brand: '', images: '', is_active: true, is_featured: false, is_test: false, highlights: '', specifications: '', box_contents: '', faqs: '' }); setShowForm(true); }} className="bg-gold text-navy-dark"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      {showForm ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="media">Images</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO & More</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Name *</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>SKU *</Label><Input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Description *</Label><Textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Price (AED) *</Label><Input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Offer Price (AED)</Label><Input type="number" step="0.01" value={formData.offer_price} onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Category *</Label>
                      <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label>Stock *</Label><Input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Brand</Label><Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} /></div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} /><Label>Active</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} /><Label>Featured</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={formData.is_test} onCheckedChange={(v) => setFormData({ ...formData, is_test: v })} /><Label>Test</Label></div>
                    </div>
                  </div>
                </TabsContent>

                {/* Images Tab - Enhanced Multiple Image Upload */}
                <TabsContent value="media" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <strong>Multiple Images Support:</strong> Upload multiple images at once. The first image will be used as the main product image. Drag to reorder images.
                    </p>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    className="border-2 border-dashed rounded-lg p-8 space-y-4 transition-colors hover:border-gold hover:bg-gold/5"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-gold', 'bg-gold/10'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-gold', 'bg-gold/10'); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-gold', 'bg-gold/10');
                      const files = e.dataTransfer.files;
                      if (!files || files.length === 0) return;
                      const uploadFormData = new FormData();
                      for (let i = 0; i < files.length; i++) {
                        if (files[i].type.startsWith('image/')) {
                          uploadFormData.append('files', files[i]);
                        }
                      }
                      try {
                        const res = await axios.post(`${API}/upload/images`, uploadFormData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
                        const existingImages = formData.images ? formData.images.split(',').filter(Boolean) : [];
                        setFormData({ ...formData, images: [...existingImages, ...res.data.urls].join(',') });
                        toast.success(`${res.data.count} image(s) uploaded`);
                      } catch (err) { toast.error('Failed to upload images'); }
                    }}
                  >
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-navy mb-2">Drop images here or click to upload</p>
                      <p className="text-sm text-muted-foreground mb-4">Supports JPEG, PNG, WebP, GIF (Max 5MB each, up to 10 images)</p>

                      <input type="file" id="image-upload" accept="image/*" multiple className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const uploadFormData = new FormData();
                          for (let i = 0; i < files.length; i++) { uploadFormData.append('files', files[i]); }
                          try {
                            const res = await axios.post(`${API}/upload/images`, uploadFormData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
                            const existingImages = formData.images ? formData.images.split(',').filter(Boolean) : [];
                            setFormData({ ...formData, images: [...existingImages, ...res.data.urls].join(',') });
                            toast.success(`${res.data.count} image(s) uploaded`);
                          } catch (err) { toast.error('Failed to upload images'); }
                          e.target.value = '';
                        }}
                      />
                      <Button type="button" onClick={() => document.getElementById('image-upload').click()} className="bg-gold text-navy-dark">
                        <ImageIcon className="h-4 w-4 mr-2" /> Select Multiple Images
                      </Button>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Or add by URL:</span>
                    <Input placeholder="Paste image URL and press Enter" className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const url = e.target.value.trim();
                          if (url) {
                            const existingImages = formData.images ? formData.images.split(',').filter(Boolean) : [];
                            setFormData({ ...formData, images: [...existingImages, url].join(',') });
                            e.target.value = '';
                            toast.success('Image URL added');
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Image Gallery with Reorder */}
                  {formData.images && formData.images.split(',').filter(Boolean).length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">Product Images ({formData.images.split(',').filter(Boolean).length})</Label>
                        <span className="text-xs text-muted-foreground">First image = Main image</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {formData.images.split(',').filter(Boolean).map((img, idx) => (
                          <div key={idx} className="relative group">
                            <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 ${idx === 0 ? 'border-gold ring-2 ring-gold/30' : 'border-gray-200'}`}>
                              <img
                                src={img.startsWith('/api') ? `${window.location.origin}${img}` : img}
                                alt={`Product ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-gold text-navy-dark text-xs px-2 py-0.5 rounded font-medium">
                                Main
                              </span>
                            )}
                            {/* Action buttons */}
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Move Left */}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const images = formData.images.split(',').filter(Boolean);
                                    [images[idx], images[idx - 1]] = [images[idx - 1], images[idx]];
                                    setFormData({ ...formData, images: images.join(',') });
                                  }}
                                  className="bg-navy text-white rounded-full p-1 hover:bg-navy/80"
                                  title="Move left"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </button>
                              )}
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  const images = formData.images.split(',').filter(Boolean);
                                  images.splice(idx, 1);
                                  setFormData({ ...formData, images: images.join(',') });
                                  toast.success('Image removed');
                                }}
                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                title="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            {/* Set as main button */}
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const images = formData.images.split(',').filter(Boolean);
                                  const [removed] = images.splice(idx, 1);
                                  images.unshift(removed);
                                  setFormData({ ...formData, images: images.join(',') });
                                  toast.success('Set as main image');
                                }}
                                className="absolute bottom-1 left-1 right-1 bg-navy/80 text-white text-xs py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy"
                              >
                                Set as Main
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Content Tab - Editable Product Page Content */}
                <TabsContent value="content" className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Product Highlights</Label>
                    <p className="text-sm text-muted-foreground">One highlight per line. These appear as bullet points on the product page.</p>
                    <Textarea rows={6} placeholder={"Premium quality materials\nEasy installation\nWater-efficient design\n1-year warranty included"} value={formData.highlights} onChange={(e) => setFormData({ ...formData, highlights: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Technical Specifications</Label>
                    <p className="text-sm text-muted-foreground">Format: Key: Value (one per line)</p>
                    <Textarea rows={6} placeholder={"Material: Premium Grade Ceramic\nColor: White\nDimensions: 60 x 40 x 85 cm\nWeight: 25 kg"} value={formData.specifications} onChange={(e) => setFormData({ ...formData, specifications: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What's in the Box</Label>
                    <p className="text-sm text-muted-foreground">One item per line</p>
                    <Textarea rows={4} placeholder={"Main product unit\nMounting hardware\nInstallation manual\nWarranty card"} value={formData.box_contents} onChange={(e) => setFormData({ ...formData, box_contents: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">FAQs</Label>
                    <p className="text-sm text-muted-foreground">Format: Q: Question (newline) A: Answer (separate each FAQ with blank line)</p>
                    <Textarea rows={8} placeholder={"Q: Is installation included?\nA: Installation service is available at additional cost.\n\nQ: What is the warranty period?\nA: This product comes with 1-year manufacturer warranty."} value={formData.faqs} onChange={(e) => setFormData({ ...formData, faqs: e.target.value })} />
                  </div>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">SEO meta tags are automatically generated from product name and description. Additional SEO fields coming soon.</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button type="submit" className="bg-gold text-navy-dark"><Save className="h-4 w-4 mr-2" />Save Product</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {filteredAndSortedProducts.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {products.length === 0 ? 'No products yet' : 'No matching products'}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {products.length === 0 ? 'Click "Add Product" to add your first product.' : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredAndSortedProducts.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50/50">
                  <TableCell><div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">{p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2 text-muted-foreground" />}</div></TableCell>
                  <TableCell><div className="font-medium text-navy">{p.name}</div><div className="text-xs text-muted-foreground">{p.brand}</div></TableCell>
                  <TableCell><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.sku}</code></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{getCategoryName(p.category_id)}</Badge></TableCell>
                  <TableCell><div className="font-bold text-gold">AED {p.offer_price || p.price}</div>{p.offer_price && <div className="text-xs line-through text-muted-foreground">AED {p.price}</div>}</TableCell>
                  <TableCell><Badge className={p.stock > 10 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{p.stock}</Badge></TableCell>
                  <TableCell><Badge className={p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
};
export const AdminOrders = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchOrders();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try { const res = await axios.get(`${API}/orders/all`, { headers: getAuthHeaders() }); setOrders(res.data.orders || []); } catch (e) { toast.error('Failed to load orders'); }
    setLoading(false);
    if (isManual) setRefreshing(false);
  };

  const updateStatus = async (orderId, status) => {
    try { await axios.put(`${API}/orders/${orderId}/status?status=${status}`, {}, { headers: getAuthHeaders() }); toast.success('Status updated'); fetchOrders(); } catch (e) { toast.error('Failed to update'); }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}/invoice`, { headers: getAuthHeaders() });
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${res.data.content}`;
      link.download = res.data.filename;
      link.click();
    } catch (e) { toast.error('Failed to download invoice'); }
  };

  const statusColors = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };
  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const getStatusCount = (s) => s === 'all' ? orders.length : orders.filter(o => o.status === s).length;

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = !searchQuery ||
      (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.shipping_address?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.shipping_address?.phone || '').includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  if (loading) return <AdminLayout title="Orders" subtitle="Track and manage customer orders"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div></AdminLayout>;

  return (
    <AdminLayout title="Orders" subtitle="Track and manage customer orders">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${statusFilter === s ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
            {s === 'all' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-white/20' : 'bg-gray-100'}`}>{getStatusCount(s)}</span>
          </button>
        ))}
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by order number, customer name, or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="h-10 gap-1.5 px-3 whitespace-nowrap" onClick={() => fetchOrders(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {orders.length === 0 ? 'When customers place orders, they\'ll appear here for you to manage.' : 'Try adjusting your search or filter to find what you\'re looking for.'}
          </p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead>
                <TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="font-medium text-navy">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{o.shipping_address?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{o.shipping_address?.phone}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{o.items?.length} items</Badge></TableCell>
                  <TableCell className="font-bold text-gold">AED {o.total?.toFixed(2)}</TableCell>
                  <TableCell><Badge className={o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{o.payment_method === 'cod' ? 'COD' : o.payment_status}</Badge></TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedOrder(o)}><Eye className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle className="flex items-center gap-3">Order {o.order_number} <Badge className={statusColors[o.status] || 'bg-gray-100'}>{o.status}</Badge></DialogTitle></DialogHeader>
                          <div className="space-y-5 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="bg-gray-50 border-0"><CardContent className="p-4">
                                <h4 className="font-semibold text-sm text-navy mb-2">Shipping Address</h4>
                                <p className="text-sm">{o.shipping_address?.full_name}<br />{o.shipping_address?.address_line1}<br />{o.shipping_address?.city}, {o.shipping_address?.emirate}<br />{o.shipping_address?.phone}</p>
                              </CardContent></Card>
                              <Card className="bg-gray-50 border-0"><CardContent className="p-4">
                                <h4 className="font-semibold text-sm text-navy mb-2">Order Info</h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{o.payment_method?.toUpperCase()}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span><Badge className={o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{o.payment_status}</Badge></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(o.created_at).toLocaleDateString()}</span></div>
                                </div>
                              </CardContent></Card>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-navy mb-2">Items</h4>
                              <div className="border rounded-lg overflow-hidden">
                                {o.items?.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center px-4 py-3 border-b last:border-0 bg-white">
                                    <div>
                                      <span className="font-medium">{item.product_name}</span>
                                      <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                                    </div>
                                    <span className="font-medium">AED {item.total_price?.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Card className="bg-navy text-white border-0"><CardContent className="p-4">
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-gray-300"><span>Subtotal</span><span>AED {o.subtotal?.toFixed(2)}</span></div>
                                <div className="flex justify-between text-gray-300"><span>VAT</span><span>AED {o.vat_amount?.toFixed(2)}</span></div>
                                <div className="flex justify-between text-gray-300"><span>Shipping</span><span>AED {o.shipping_cost?.toFixed(2)}</span></div>
                                <Separator className="bg-white/20 my-2" />
                                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-gold">AED {o.total?.toFixed(2)}</span></div>
                              </div>
                            </CardContent></Card>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => downloadInvoice(o.id)} title="Download Invoice"><Download className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
};
export const AdminCategories = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', name_ar: '', description: '', image: '', icon: '', is_active: true });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchCategories = async () => {
    try { const res = await axios.get(`${API}/categories/all`, { headers: getAuthHeaders() }); setCategories(res.data); } catch (e) { toast.error('Failed to load categories'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, formData, { headers: getAuthHeaders() });
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/categories`, formData, { headers: getAuthHeaders() });
        toast.success('Category created');
      }
      setShowForm(false); setEditingCategory(null); fetchCategories();
      setFormData({ name: '', name_ar: '', description: '', image: '', icon: '', is_active: true });
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save category'); }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, name_ar: cat.name_ar || '', description: cat.description || '', image: cat.image || '', icon: cat.icon || '', is_active: cat.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await axios.delete(`${API}/categories/${id}`, { headers: getAuthHeaders() }); toast.success('Category deleted'); fetchCategories(); } catch (e) { toast.error('Failed to delete'); }
  };

  if (loading) return <AdminLayout title="Categories" subtitle="Organize your product catalog"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Categories" subtitle="Organize your product catalog">
      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', name_ar: '', description: '', image: '', icon: '', is_active: true }); setShowForm(true); }} className="bg-gold text-navy-dark"><Plus className="h-4 w-4 mr-2" />Add Category</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name (English) *</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Name (Arabic)</Label><Input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} /></div>
              <div className="space-y-2"><Label>Icon (Lucide icon name)</Label><Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="e.g. Droplets, Zap" /></div>
              <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} /><Label>Active</Label></div>
              <div className="md:col-span-2 flex gap-2"><Button type="submit" className="bg-gold text-navy-dark">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden">
            <div className="h-32 bg-muted">{cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-12 w-12" /></div>}</div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div><h3 className="font-semibold">{cat.name}</h3>{cat.name_ar && <p className="text-sm text-gold" dir="rtl">{cat.name_ar}</p>}</div>
                <Badge className={cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{cat.product_count || 0} products</p>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(cat)}><Edit className="h-4 w-4 mr-1" />Edit</Button><Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

// Admin Settings
export const AdminSettings = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings/admin`, { headers: getAuthHeaders() });
      setSettings(res.data);
      setHeroSlides(res.data.hero_slides || []);
    } catch (e) { toast.error('Failed to load settings'); }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await axios.put(`${API}/settings`, settings, { headers: getAuthHeaders() }); toast.success('Settings saved successfully'); } catch (e) { toast.error('Failed to save settings'); }
    setSaving(false);
  };

  if (loading) return <AdminLayout title="Store Settings" subtitle="Configure your store preferences"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Store Settings" subtitle="Configure your store preferences">

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Gateway Toggle - Prominent Card */}
        <Card className={`lg:col-span-2 border-2 ${settings.payment_enabled ? 'border-green-500 bg-green-50/30' : 'border-orange-500 bg-orange-50/30'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" />
              Payment Gateway
              <Badge className={settings.payment_enabled ? 'bg-green-500' : 'bg-orange-500'}>
                {settings.payment_enabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div>
                <Label className="text-lg font-semibold">Online Payment (Stripe)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings.payment_enabled
                    ? 'Customers can pay with credit/debit cards at checkout'
                    : 'Online payment is OFF. Orders will be sent to admin email for manual processing'}
                </p>
              </div>
              <Switch
                checked={settings.payment_enabled}
                onCheckedChange={(v) => setSettings({ ...settings, payment_enabled: v })}
                className="scale-125"
              />
            </div>

            {!settings.payment_enabled && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Payment Gateway Disabled Mode
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  When customers complete checkout, their order details will be emailed to: <strong>{settings.admin_notification_email || 'ajith@lenokinfotech'}</strong>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Admin Notification Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={settings.admin_notification_email || ''}
                onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Order notifications will be sent to this email when payment is disabled</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div>
                <Label className="text-base font-medium">Cash on Delivery (COD)</Label>
                <p className="text-sm text-muted-foreground">Allow customers to pay cash upon delivery</p>
              </div>
              <Switch checked={settings.cod_enabled} onCheckedChange={(v) => setSettings({ ...settings, cod_enabled: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-gold" />Tax & Shipping</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>VAT Percentage (%)</Label><Input type="number" step="0.1" value={settings.vat_percentage || ''} onChange={(e) => setSettings({ ...settings, vat_percentage: parseFloat(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Flat Shipping Rate (AED)</Label><Input type="number" step="0.01" value={settings.flat_shipping_rate || ''} onChange={(e) => setSettings({ ...settings, flat_shipping_rate: parseFloat(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Free Shipping Threshold (AED)</Label><Input type="number" step="0.01" value={settings.free_shipping_threshold || ''} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-gold" />Company Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>TRN (Tax Registration Number)</Label><Input value={settings.company_trn || ''} onChange={(e) => setSettings({ ...settings, company_trn: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={settings.company_phone || ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={settings.company_email || ''} onChange={(e) => setSettings({ ...settings, company_email: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={settings.company_address || ''} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} /></div>
          </CardContent>
        </Card>

        {/* Firebase Email Configuration */}
        <Card className={`lg:col-span-2 ${settings.firebase_enabled ? 'border-2 border-blue-500' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M3.89 15.672L6.255.461A.542.542 0 017.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 00-.96 0L3.53 17.984z" /></svg>
              Firebase Email Configuration
              <Badge className={settings.firebase_enabled ? 'bg-blue-500' : 'bg-gray-400'}>
                {settings.firebase_enabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Use Firebase for Email OTP</Label>
                <p className="text-sm text-muted-foreground">When enabled, OTP verification emails will be sent via Firebase instead of SendGrid</p>
              </div>
              <Switch
                checked={settings.firebase_enabled}
                onCheckedChange={(v) => setSettings({ ...settings, firebase_enabled: v })}
              />
            </div>

            {settings.firebase_enabled && (
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Firebase API Key</Label>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={settings.firebase_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, firebase_api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Firebase Project ID</Label>
                  <Input
                    placeholder="your-project-id"
                    value={settings.firebase_project_id || ''}
                    onChange={(e) => setSettings({ ...settings, firebase_project_id: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Firebase Auth Domain</Label>
                  <Input
                    placeholder="your-project.firebaseapp.com"
                    value={settings.firebase_auth_domain || ''}
                    onChange={(e) => setSettings({ ...settings, firebase_auth_domain: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Get these values from your Firebase Console → Project Settings → General
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hero Banners Management */}
      <Card className="mt-6 border-2 border-navy/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gold" />
            Hero Banners
            <Badge variant="outline" className="ml-2">{heroSlides.length} slides</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Manage the homepage hero carousel images. Each slide has an image, title, Arabic title, and subtitle.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroSlides.map((slide, idx) => (
            <Card key={idx} className="bg-gray-50 border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Image preview */}
                  <div className="w-40 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative group">
                    {slide.image ? (
                      <img src={slide.image.startsWith('/api') ? `${window.location.origin}${slide.image}` : slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                    )}
                    {/* Upload overlay */}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload className="h-6 w-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uploadData = new FormData();
                        uploadData.append('file', file);
                        try {
                          const res = await axios.post(`${API}/upload/image`, uploadData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
                          const updated = [...heroSlides];
                          updated[idx] = { ...updated[idx], image: res.data.url };
                          setHeroSlides(updated);
                          toast.success('Image uploaded');
                        } catch (err) { toast.error('Failed to upload image'); }
                        e.target.value = '';
                      }} />
                    </label>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Image URL</Label>
                      <Input placeholder="https://... or upload" value={slide.image || ''} onChange={(e) => { const updated = [...heroSlides]; updated[idx] = { ...updated[idx], image: e.target.value }; setHeroSlides(updated); }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title *</Label>
                      <Input placeholder="Slide title" value={slide.title || ''} onChange={(e) => { const updated = [...heroSlides]; updated[idx] = { ...updated[idx], title: e.target.value }; setHeroSlides(updated); }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Arabic Title</Label>
                      <Input placeholder="عنوان" dir="rtl" value={slide.title_ar || ''} onChange={(e) => { const updated = [...heroSlides]; updated[idx] = { ...updated[idx], title_ar: e.target.value }; setHeroSlides(updated); }} />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs">Subtitle</Label>
                      <Input placeholder="Subtitle text" value={slide.subtitle || ''} onChange={(e) => { const updated = [...heroSlides]; updated[idx] = { ...updated[idx], subtitle: e.target.value }; setHeroSlides(updated); }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {idx > 0 && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { const updated = [...heroSlides];[updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]]; setHeroSlides(updated); }} title="Move up"><ChevronUp className="h-4 w-4" /></Button>}
                    {idx < heroSlides.length - 1 && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { const updated = [...heroSlides];[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]; setHeroSlides(updated); }} title="Move down"><ChevronDown className="h-4 w-4" /></Button>}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { const updated = heroSlides.filter((_, i) => i !== idx); setHeroSlides(updated); }} title="Remove slide"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setHeroSlides([...heroSlides, { image: '', title: '', title_ar: '', subtitle: '' }])} className="border-dashed">
              <Plus className="h-4 w-4 mr-2" />Add Slide
            </Button>
            <Button type="button" onClick={async () => {
              setSavingHero(true);
              try {
                await axios.put(`${API}/hero-slides`, { slides: heroSlides }, { headers: getAuthHeaders() });
                toast.success('Hero banners saved!');
              } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save hero banners'); }
              setSavingHero(false);
            }} disabled={savingHero} className="bg-gold text-navy-dark">
              {savingHero ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Hero Banners
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end"><Button onClick={handleSave} disabled={saving} className="bg-gold text-navy-dark font-bold px-8">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Settings</Button></div>
    </AdminLayout>
  );
};

// ==================== FEATURED PRODUCTS MANAGEMENT ====================
export const AdminFeaturedProducts = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products?limit=500`, { headers: getAuthHeaders() });
      setProducts(res.data.products || []);
    } catch (e) { toast.error('Failed to load products'); }
    setLoading(false);
  };

  const toggleFeatured = async (product, isAdding) => {
    setTogglingId(product.id);
    try {
      await axios.put(`${API}/products/${product.id}`, { is_featured: isAdding }, { headers: getAuthHeaders() });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: isAdding } : p));
      toast.success(isAdding ? `"${product.name}" added to featured` : `"${product.name}" removed from featured`);
      if (isAdding) setShowAddModal(false);
    } catch (e) { toast.error('Failed to update'); }
    setTogglingId(null);
  };

  const uploadFeaturedImage = async (productId, file) => {
    setUploadingId(productId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await axios.post(`${API}/upload/image`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      const imageUrl = uploadRes.data.url;
      const product = products.find(p => p.id === productId);
      const updatedImages = [imageUrl, ...(product.images || []).filter(img => img !== imageUrl)];
      await axios.put(`${API}/products/${productId}`, { images: updatedImages }, { headers: getAuthHeaders() });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, images: updatedImages } : p));
      toast.success('Featured image uploaded');
    } catch (e) { toast.error('Failed to upload image'); }
    setUploadingId(null);
  };

  // Only show featured products in the main table
  const featuredProducts = products.filter(p => p.is_featured);
  const filteredFeatured = featuredProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  // Unfeatured products for the Add modal
  const unfeaturedProducts = products.filter(p => !p.is_featured);
  const modalFiltered = unfeaturedProducts.filter(p =>
    !modalSearch || p.name.toLowerCase().includes(modalSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(modalSearch.toLowerCase())
  );

  if (loading) return <AdminLayout title="Featured Products"><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div></AdminLayout>;

  return (
    <AdminLayout title="Featured Products" subtitle="Manage highlighted products on the homepage">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search featured products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-navy-dark"><Plus className="h-4 w-4 mr-2" /> Add Featured Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add to Featured Products</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search catalog by name or SKU..." className="pl-9" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} />
              </div>
              <div className="border rounded-lg overflow-hidden h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalFiltered.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No matching products found in catalog</TableCell></TableRow>
                    ) : (
                      modalFiltered.slice(0, 50).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-medium text-sm leading-tight">{p.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{p.sku || 'No SKU'} • AED {p.price?.toFixed(2)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => toggleFeatured(p, true)} disabled={togglingId === p.id} className="bg-navy hover:bg-navy-light text-white h-8">
                              {togglingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Featured Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Image</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead className="w-28 text-center">Featured Image</TableHead>
                <TableHead className="w-20 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatured.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                      <Star className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="font-semibold text-lg text-navy mb-1">No Featured Products</p>
                    <p className="text-muted-foreground text-sm mb-4">Click "Add Featured Product" to highlight items on your homepage.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatured.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 mx-auto border shadow-sm">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/56'} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-navy leading-tight mb-1">{p.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-gold">AED {p.price?.toFixed(2)}</span>
                          <span>•</span>
                          <span>SKU: {p.sku || 'N/A'}</span>
                          <span>•</span>
                          <span>Stock: {p.stock}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer group">
                        <div className="flex flex-col items-center justify-center w-24 h-14 border border-dashed rounded bg-gray-50 hover:bg-gold/5 hover:border-gold transition-colors">
                          {uploadingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 text-muted-foreground group-hover:text-gold mb-1" />
                              <span className="text-[10px] text-muted-foreground group-hover:text-gold font-medium">Upload Hero</span>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadFeaturedImage(p.id, file);
                          e.target.value = '';
                        }} />
                      </label>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleFeatured(p, false)}
                        disabled={togglingId === p.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove from featured"
                      >
                        {togglingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};
