import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Receipt, Plus, Download, Send, Eye, Edit, Search, Filter,
  Loader2, CheckCircle, XCircle, Clock, AlertTriangle,
  Calendar, DollarSign, User, FileText, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const InvoiceManagement = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createData, setCreateData] = useState({ order_id: '', due_date: '', discount: 0, notes: '' });
  const [paymentData, setPaymentData] = useState({ amount: 0, payment_method: 'bank_transfer', reference: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchInvoices();
    fetchOrdersWithoutInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await axios.get(`${API}/erp/invoices${params}`, { headers: getAuthHeaders() });
      setInvoices(res.data.invoices);
    } catch (e) {
      toast.error('Failed to load invoices');
    }
    setLoading(false);
  };

  const fetchOrdersWithoutInvoice = async () => {
    try {
      const res = await axios.get(`${API}/erp/orders?limit=100`, { headers: getAuthHeaders() });
      // Filter orders that don't have invoices yet
      const ordersWithoutInvoice = res.data.orders.filter(o => !o.invoice);
      setOrders(ordersWithoutInvoice);
    } catch (e) {
      console.error('Failed to load orders');
    }
  };

  const handleCreateInvoice = async () => {
    if (!createData.order_id) {
      toast.error('Please select an order');
      return;
    }
    setActionLoading('create');
    try {
      await axios.post(`${API}/erp/invoices`, createData, { headers: getAuthHeaders() });
      toast.success('Invoice created successfully');
      setShowCreateDialog(false);
      setCreateData({ order_id: '', due_date: '', discount: 0, notes: '' });
      fetchInvoices();
      fetchOrdersWithoutInvoice();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create invoice');
    }
    setActionLoading(null);
  };

  const handleDownloadPDF = async (invoiceId) => {
    setActionLoading(invoiceId);
    try {
      const res = await axios.get(`${API}/erp/invoices/${invoiceId}/pdf`, { headers: getAuthHeaders() });

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
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded');
    } catch (e) {
      toast.error('Failed to download invoice');
    }
    setActionLoading(null);
  };

  const handleSendEmail = async (invoiceId) => {
    setActionLoading(invoiceId);
    try {
      await axios.post(`${API}/erp/invoices/${invoiceId}/send-email`, {}, { headers: getAuthHeaders() });
      toast.success('Invoice sent to customer');
      fetchInvoices();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send email');
    }
    setActionLoading(null);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || paymentData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setActionLoading('payment');
    try {
      await axios.post(`${API}/erp/invoices/${selectedInvoice.id}/record-payment`, {
        ...paymentData,
        invoice_id: selectedInvoice.id
      }, { headers: getAuthHeaders() });
      toast.success('Payment recorded');
      setShowPaymentDialog(false);
      setPaymentData({ amount: 0, payment_method: 'bank_transfer', reference: '', notes: '' });
      fetchInvoices();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to record payment');
    }
    setActionLoading(null);
  };

  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
    sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
    unpaid: { color: 'bg-orange-100 text-orange-800', icon: Clock },
    partial: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    overdue: { color: 'bg-red-100 text-red-800', icon: XCircle },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  if (loading) {
    return (
      <AdminLayout title="Invoice Management">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Invoice Management" subtitle="Create, manage, and track invoices">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold-dark text-navy-dark">
                <Plus className="h-4 w-4 mr-2" /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invoice from Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Order *</Label>
                  <Select
                    value={createData.order_id}
                    onValueChange={(v) => setCreateData({ ...createData, order_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {order.shipping_address?.full_name} (AED {order.total?.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">All orders have invoices created</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={createData.due_date}
                    onChange={(e) => setCreateData({ ...createData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createData.discount}
                    onChange={(e) => setCreateData({ ...createData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={createData.notes}
                    onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                    placeholder="Invoice notes..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={actionLoading === 'create' || !createData.order_id}
                    className="bg-gold text-navy-dark"
                  >
                    {actionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Invoice'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Status:</span>
              </div>
              <div className="flex gap-2">
                {['all', 'unpaid', 'partial', 'paid', 'overdue'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? 'bg-gold text-navy-dark' : ''}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gold">
                AED {invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Amount</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                AED {invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                AED {invoices.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.payment_status] || statusConfig.unpaid;
                  const StatusIcon = status.icon;
                  const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{invoice.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.order_number}</TableCell>
                      <TableCell>{invoice.invoice_date?.slice(0, 10)}</TableCell>
                      <TableCell>{invoice.due_date?.slice(0, 10)}</TableCell>
                      <TableCell className="text-right font-semibold">AED {invoice.total_amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">AED {(invoice.paid_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPDF(invoice.id)}
                            disabled={actionLoading === invoice.id}
                            title="Download PDF"
                          >
                            {actionLoading === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendEmail(invoice.id)}
                            disabled={actionLoading === invoice.id}
                            title="Send Email"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {balance > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setPaymentData({ ...paymentData, amount: balance });
                                setShowPaymentDialog(true);
                              }}
                              title="Record Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {invoices.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customer_name}</p>
                  <div className="flex justify-between mt-2">
                    <span>Balance Due:</span>
                    <span className="font-bold text-gold">
                      AED {((selectedInvoice.total_amount || 0) - (selectedInvoice.paid_amount || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount (AED) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentData.payment_method}
                    onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Transaction ID / Cheque number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Payment notes..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={actionLoading === 'payment' || paymentData.amount <= 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading === 'payment' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default InvoiceManagement;
