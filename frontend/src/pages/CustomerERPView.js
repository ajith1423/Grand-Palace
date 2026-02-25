import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users, Search, Filter, Loader2, Eye, User,
  DollarSign, Calendar, CheckCircle, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString();
};

const formatCurrency = (num) => {
  return `AED ${Number(num || 0).toLocaleString()}`;
};

const formatFixed = (num) => {
  return Number(num || 0).toFixed(2);
};

function CustomerERPView() {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, filterType]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? `?filter_type=${filterType}` : '';
      const res = await axios.get(`${API}/erp/customers${params}`, { headers: getAuthHeaders() });
      setCustomers(res.data.customers || []);
    } catch (e) {
      toast.error('Failed to load customers');
    }
    setLoading(false);
  };

  const fetchCustomerDetail = async (customerId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}/erp/customers/${customerId}`, { headers: getAuthHeaders() });
      setCustomerDetail(res.data);
    } catch (e) {
      toast.error('Failed to load customer details');
    }
    setDetailLoading(false);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetail(customer.id);
  };

  const filteredCustomers = customers.filter(c => {
    const nameMatch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

  const totalCustomers = customers.length;
  const totalPurchaseValue = customers.reduce((sum, c) => sum + (c.total_purchase_value || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const highValueCustomers = customers.filter(c => (c.total_purchase_value || 0) >= 5000).length;

  if (loading) {
    return (
      <AdminLayout title="Customer Analytics">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Customer Analytics" subtitle="Customer financial overview and insights">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gold">{formatCurrency(totalPurchaseValue)}</p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{highValueCustomers}</p>
              <p className="text-sm text-muted-foreground">High Value (5K+)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className={filterType === 'all' ? 'bg-gold text-navy-dark' : ''}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'high_value' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('high_value')}
                  className={filterType === 'high_value' ? 'bg-gold text-navy-dark' : ''}
                >
                  High Value
                </Button>
                <Button
                  variant={filterType === 'pending_payments' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('pending_payments')}
                  className={filterType === 'pending_payments' ? 'bg-gold text-navy-dark' : ''}
                >
                  Pending Payments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{customer.total_orders}</TableCell>
                    <TableCell className="text-right font-semibold text-gold">
                      {formatCurrency(customer.total_purchase_value)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(customer.total_paid_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.outstanding_balance > 0 ? (
                        <span className="text-red-600 font-semibold">{formatCurrency(customer.outstanding_balance)}</span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.email_verified ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Mail className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500">
                          <Mail className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleViewCustomer(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gold" />
                Customer Details
              </DialogTitle>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : customerDetail && (
              <div className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{customerDetail.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {customerDetail.email}
                      {customerDetail.email_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    {customerDetail.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {customerDetail.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(customerDetail.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-blue-50">
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-blue-600">{customerDetail.total_orders}</p>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gold/10">
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-gold">{formatCurrency(customerDetail.total_purchase_value)}</p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50">
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(customerDetail.total_paid_amount)}</p>
                        <p className="text-xs text-muted-foreground">Total Paid</p>
                      </CardContent>
                    </Card>
                    <Card className={customerDetail.outstanding_balance > 0 ? "bg-red-50" : "bg-green-50"}>
                      <CardContent className="p-3 text-center">
                        <p className={`text-xl font-bold ${customerDetail.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(customerDetail.outstanding_balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <Tabs defaultValue="orders">
                  <TabsList>
                    <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="mt-4">
                    <CustomerOrders orders={customerDetail.orders} />
                  </TabsContent>

                  <TabsContent value="invoices" className="mt-4">
                    <CustomerInvoices invoices={customerDetail.invoices} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function CustomerOrders({ orders }) {
  if (!orders || orders.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No orders yet</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.order_number}</TableCell>
            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right font-semibold">AED {formatFixed(order.total)}</TableCell>
            <TableCell>
              <Badge variant="outline">{order.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                {order.payment_status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CustomerInvoices({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No invoices yet</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
            <TableCell>{invoice.invoice_date ? invoice.invoice_date.slice(0, 10) : ''}</TableCell>
            <TableCell>{invoice.due_date ? invoice.due_date.slice(0, 10) : ''}</TableCell>
            <TableCell className="text-right font-semibold">AED {formatFixed(invoice.total_amount)}</TableCell>
            <TableCell>
              <Badge className={
                invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
              }>
                {invoice.payment_status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default CustomerERPView;
