import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ClipboardList, Download, Loader2, TrendingUp,
  Users, Package, DollarSign, AlertTriangle, FileText, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const ReportsModule = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reportType, setReportType] = useState(searchParams.get('type') || 'sales');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/erp/reports/generate`, {
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        format: 'json'
      }, { headers: getAuthHeaders() });
      setReportData(res.data.data || []);
    } catch (e) {
      toast.error('Failed to generate report');
      setReportData([]);
    }
    setLoading(false);
  };

  const handleExport = async (format) => {
    try {
      const res = await axios.post(`${API}/erp/reports/generate`, {
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        format
      }, { headers: getAuthHeaders() });

      if (format === 'csv' && res.data.content) {
        const byteCharacters = atob(res.data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'text/csv' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = res.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Report downloaded');
      }
    } catch (e) {
      toast.error('Failed to export report');
    }
  };

  const reportTypes = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp, description: 'Daily/Monthly sales analysis' },
    { id: 'invoice', label: 'Invoice Report', icon: FileText, description: 'All invoices with status' },
    { id: 'payments', label: 'Pending Payments', icon: DollarSign, description: 'Outstanding payments by customer' },
    { id: 'products', label: 'Top Products', icon: Package, description: 'Best selling products' },
    { id: 'customers', label: 'Top Customers', icon: Users, description: 'Customers by purchase value' },
    { id: 'stock', label: 'Low Stock', icon: AlertTriangle, description: 'Products needing restock' }
  ];

  const renderReportTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for this report</p>
        </div>
      );
    }

    switch (reportType) {
      case 'sales':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Unpaid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell className="text-center">{row.order_count}</TableCell>
                  <TableCell className="text-right font-semibold text-gold">AED {row.total_revenue?.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">AED {row.total_paid?.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">AED {row.total_unpaid?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{reportData.reduce((s, r) => s + r.order_count, 0)}</TableCell>
                <TableCell className="text-right text-gold">AED {reportData.reduce((s, r) => s + r.total_revenue, 0).toLocaleString()}</TableCell>
                <TableCell className="text-right text-green-600">AED {reportData.reduce((s, r) => s + r.total_paid, 0).toLocaleString()}</TableCell>
                <TableCell className="text-right text-red-600">AED {reportData.reduce((s, r) => s + r.total_unpaid, 0).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );

      case 'invoice':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.invoice_number}</TableCell>
                  <TableCell>{row.customer_name}</TableCell>
                  <TableCell>{row.invoice_date?.slice(0, 10)}</TableCell>
                  <TableCell>{row.due_date?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right font-semibold">AED {row.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={
                      row.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        row.payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                    }>
                      {row.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'payments':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.customer_name}</TableCell>
                  <TableCell>{row.customer_email}</TableCell>
                  <TableCell className="text-center">{row.invoice_count}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">AED {row.total_outstanding?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell colSpan={2}>Total Outstanding</TableCell>
                <TableCell className="text-center">{reportData.reduce((s, r) => s + r.invoice_count, 0)}</TableCell>
                <TableCell className="text-right text-red-600">AED {reportData.reduce((s, r) => s + r.total_outstanding, 0).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );

      case 'products':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{row.product_name}</TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell className="text-center">{row.quantity_sold}</TableCell>
                  <TableCell className="text-right font-semibold text-gold">AED {row.revenue?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'customers':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{row.customer_name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="text-center">{row.total_orders}</TableCell>
                  <TableCell className="text-right font-semibold text-gold">AED {row.total_spent?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'stock':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Current Stock</TableHead>
                <TableHead className="text-center">Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.product_name}</TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell className="text-center font-semibold">{row.current_stock}</TableCell>
                  <TableCell className="text-center">{row.reorder_level}</TableCell>
                  <TableCell>
                    <Badge className={row.status === 'Out of Stock' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Reports" subtitle="Generate and export business reports">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Report Type Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Report Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportTypes.map(report => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setReportType(report.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${reportType === report.id
                    ? 'bg-gold/10 border-2 border-gold'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${reportType === report.id ? 'text-gold' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{report.label}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gold" />
                {reportTypes.find(r => r.id === reportType)?.label}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">From:</Label>
                  <Input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">To:</Label>
                  <Input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                    className="w-36"
                  />
                </div>
                <Button size="sm" onClick={fetchReport} className="bg-gold text-navy-dark">
                  Generate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderReportTable()}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReportsModule;
