import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Package, FileText, Users, ShoppingCart, DollarSign, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Eye,
  PieChart, RefreshCw, ChevronRight, Loader2, CheckCircle, XCircle,
  Clock, CreditCard, Receipt, Box, Calendar, ClipboardList, MessageSquare, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// KPI Card Component
const KPICard = ({ title, value, subtitle, icon: Icon, color = "gold", trend, trendValue, onClick }) => {
  const colorStyles = {
    gold: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', icon: 'bg-gold text-navy-dark', text: 'text-gold-dark' },
    green: { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', icon: 'bg-emerald-500 text-white', text: 'text-emerald-600' },
    red: { bg: 'bg-gradient-to-br from-red-50 to-red-100', icon: 'bg-red-500 text-white', text: 'text-red-600' },
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', icon: 'bg-blue-500 text-white', text: 'text-blue-600' },
    orange: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', icon: 'bg-orange-500 text-white', text: 'text-orange-600' },
    purple: { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', icon: 'bg-purple-500 text-white', text: 'text-purple-600' },
  };

  const style = colorStyles[color] || colorStyles.gold;

  return (
    <Card
      className={`${style.bg} border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${style.text}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${style.icon} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Bar Chart
const SimpleBarChart = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.revenue || 0));

  return (
    <div className="flex items-end justify-between gap-3 px-2" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? ((item.revenue || 0) / maxValue) * (height - 50) : 0;
        return (
          <div key={index} className="flex flex-col items-center flex-1 group">
            <div className="text-xs font-medium text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              AED {(item.revenue || 0).toLocaleString()}
            </div>
            <div
              className="w-full bg-gradient-to-t from-gold to-amber-300 rounded-t-lg transition-all hover:from-gold-dark hover:to-amber-400"
              style={{ height: Math.max(barHeight, 8) }}
            />
            <span className="text-xs text-gray-500 mt-2 font-medium">
              {item.month?.split(' ')[0] || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Donut Chart
const DonutChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground">No data</div>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = {
    new: '#3b82f6', confirmed: '#22c55e', processing: '#a855f7',
    ready_to_ship: '#f59e0b', shipped: '#6366f1', delivered: '#10b981',
    invoiced: '#14b8a6', closed: '#64748b', cancelled: '#ef4444', pending: '#f59e0b'
  };

  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {data.map((item, index) => {
            const percent = (item.count / total) * 100;
            const strokeDasharray = `${percent * 2.51} 251`;
            const strokeDashoffset = -cumulativePercent * 2.51;
            cumulativePercent += percent;
            return (
              <circle
                key={index}
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke={colors[item.status] || '#94a3b8'}
                strokeWidth="16"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-navy">{total}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[item.status] || '#94a3b8' }} />
            <span className="capitalize text-gray-600">{item.status}</span>
            <span className="font-medium text-gray-800">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, to, color = "blue" }) => {
  const colorStyles = {
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    green: 'hover:border-emerald-300 hover:bg-emerald-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
    orange: 'hover:border-orange-300 hover:bg-orange-50',
  };

  return (
    <Link to={to}>
      <Card className={`border-2 border-transparent ${colorStyles[color]} transition-all cursor-pointer group`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-white transition-colors">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
};

// Main Dashboard Component
const ERPDashboard = () => {
  const { user, getAuthHeaders, settings } = useApp();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  // Check if quotation mode is active (prices hidden)
  const isQuotationMode = settings?.show_prices === false;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisRes, ordersRes] = await Promise.all([
        axios.get(`${API}/erp/dashboard/kpis`, { headers: getAuthHeaders() }),
        axios.get(`${API}/dashboard/recent-orders?limit=5`, { headers: getAuthHeaders() })
      ]);
      setKpis(kpisRes.data);
      setRecentOrders(ordersRes.data);
    } catch (e) {
      toast.error('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    new: 'bg-sky-100 text-sky-700'
  };

  if (loading || !kpis) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      <div className="space-y-6">
        {/* Quotation Mode Banner */}
        {isQuotationMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between" data-testid="quotation-mode-banner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Quotation Mode Active</p>
                <p className="text-sm text-amber-600">Prices are hidden on the storefront. Customers will request quotes instead of seeing prices.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => navigate('/admin/erp/settings')}
            >
              <Settings className="h-4 w-4 mr-2" /> Manage
            </Button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI Grid - Row 1: Orders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Orders"
            value={kpis.total_orders}
            icon={ShoppingCart}
            color="blue"
            onClick={() => navigate('/admin/orders')}
          />
          <KPICard
            title="Pending"
            value={kpis.pending_orders}
            icon={Clock}
            color="orange"
            onClick={() => navigate('/admin/orders?status=pending')}
          />
          <KPICard
            title="Completed"
            value={kpis.completed_orders}
            icon={CheckCircle}
            color="green"
          />
          <KPICard
            title="Cancelled"
            value={kpis.cancelled_orders}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* KPI Grid - Row 2: Financial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Revenue"
            value={`AED ${kpis.total_revenue?.toLocaleString()}`}
            subtitle="From completed orders"
            icon={DollarSign}
            color="gold"
          />
          <KPICard
            title="Paid Amount"
            value={`AED ${kpis.paid_amount?.toLocaleString()}`}
            icon={CreditCard}
            color="green"
          />
          <KPICard
            title="Outstanding"
            value={`AED ${kpis.unpaid_amount?.toLocaleString()}`}
            subtitle="Unpaid / Pending"
            icon={AlertTriangle}
            color={kpis.unpaid_amount > 0 ? "red" : "green"}
          />
        </div>

        {/* KPI Grid - Row 3: Products & Customers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Products"
            value={kpis.total_products}
            icon={Package}
            color="purple"
            onClick={() => navigate('/admin/products')}
          />
          <KPICard
            title="Low Stock"
            value={kpis.low_stock_products}
            icon={AlertTriangle}
            color={kpis.low_stock_products > 0 ? "orange" : "green"}
            onClick={() => navigate('/admin/erp/reports?type=stock')}
          />
          <KPICard
            title="Customers"
            value={kpis.total_customers}
            icon={Users}
            color="blue"
            onClick={() => navigate('/admin/erp/customers')}
          />
          <KPICard
            title="New (30 days)"
            value={kpis.new_customers_30_days}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gold" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={kpis.monthly_revenue} height={200} />
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gold" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={kpis.order_status_distribution} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-navy">Quick Actions</h2>
            <QuickActionCard
              icon={Receipt}
              title="Manage Invoices"
              description="Create and track invoices"
              to="/admin/erp/invoices"
              color="blue"
            />
            <QuickActionCard
              icon={ClipboardList}
              title="View Reports"
              description="Sales, customers & more"
              to="/admin/erp/reports"
              color="purple"
            />
            <QuickActionCard
              icon={Users}
              title="Customer Analytics"
              description="Financial insights"
              to="/admin/erp/customers"
              color="green"
            />
            <QuickActionCard
              icon={Box}
              title="Stock Report"
              description="Low stock alerts"
              to="/admin/erp/reports?type=stock"
              color="orange"
            />
          </div>

          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <ShoppingCart className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{order.order_number}</p>
                        <p className="text-xs text-gray-500">
                          {order.shipping_address?.full_name} • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-700'}>
                        {order.status}
                      </Badge>
                      <span className="font-bold text-gold">AED {order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice & Stock Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Invoice Summary */}
          <Card className="bg-gradient-to-br from-navy to-navy-light text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Receipt className="h-5 w-5 text-gold" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold text-gold">{kpis.total_invoices}</p>
                  <p className="text-xs text-gray-300">Total</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold text-amber-400">{kpis.unpaid_invoices}</p>
                  <p className="text-xs text-gray-300">Unpaid</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold text-red-400">{kpis.overdue_invoices}</p>
                  <p className="text-xs text-gray-300">Overdue</p>
                </div>
              </div>
              <Link to="/admin/erp/invoices">
                <Button className="w-full bg-gold hover:bg-gold-dark text-navy-dark">
                  Manage Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-gold" />
                Inventory Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Total Stock Value</p>
                  <p className="text-xl font-bold text-emerald-600">AED {kpis.total_stock_value?.toLocaleString()}</p>
                </div>
                <DollarSign className="h-10 w-10 text-emerald-300" />
              </div>

              {(kpis.low_stock_products > 0 || kpis.out_of_stock_products > 0) ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Stock Alerts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Low Stock: <strong>{kpis.low_stock_products}</strong></span>
                    <span>Out of Stock: <strong>{kpis.out_of_stock_products}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">All products well stocked</span>
                  </div>
                </div>
              )}

              <Link to="/admin/erp/reports?type=stock">
                <Button variant="outline" className="w-full">
                  View Stock Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ERPDashboard;
