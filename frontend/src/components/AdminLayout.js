import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, FolderTree, Settings, Receipt,
  ClipboardList, UserCog, ChevronLeft, ChevronRight, LogOut, Menu, X, Bell,
  Search, Box, Building, User, FileText, Check, Clock, ExternalLink,
  MessageSquare, ChevronDown, Eye, ArrowRight, Inbox, Star, HelpCircle, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';

function AdminLayout(props) {
  const { children, title, subtitle } = props;
  const { user, logout, API, getAuthHeaders } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API}/notifications`, { headers: getAuthHeaders() });
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      } catch (e) { /* silently fail */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [API, getAuthHeaders]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, { headers: getAuthHeaders() });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Failed to mark notification as read'); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`, {}, { headers: getAuthHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) { console.error('Failed to mark all notifications as read'); }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_user': return <User className="h-4 w-4 text-blue-500" />;
      case 'new_order': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'new_enquiry': return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'low_stock': return <Package className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationAction = (type) => {
    switch (type) {
      case 'new_order': return { label: 'View Orders', path: '/admin/orders' };
      case 'new_user': return { label: 'View Customers', path: '/admin/erp/customers' };
      case 'new_enquiry': return { label: 'View Enquiries', path: '/admin/enquiries' };
      case 'low_stock': return { label: 'View Products', path: '/admin/products' };
      default: return { label: 'View', path: '/admin' };
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleLogout = function () { logout(); navigate('/'); };
  const closeMobile = function () { setMobileOpen(false); };

  const userName = user ? (user.name || 'Admin') : 'Admin';
  const userEmail = user ? (user.email || '') : '';
  const userInitial = userName.charAt(0);

  // Build breadcrumbs from pathname
  const buildBreadcrumbs = () => {
    const pathMap = {
      '/admin': 'Dashboard',
      '/admin/orders': 'Orders',
      '/admin/products': 'Products',
      '/admin/featured': 'Featured Products',
      '/admin/categories': 'Categories',
      '/admin/enquiries': 'Enquiries',
      '/admin/settings': 'Settings',
      '/admin/erp/invoices': 'Invoices',
      '/admin/erp/reports': 'Reports',
      '/admin/erp/customers': 'Customers',
      '/admin/erp/settings': 'ERP Settings',
      '/admin/help': 'Help & Guide',
    };
    const current = pathMap[location.pathname];
    if (!current || location.pathname === '/admin') return null;
    return current;
  };

  const breadcrumb = buildBreadcrumbs();

  const menuItems = [
    {
      section: 'SHOP MANAGEMENT', items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', exact: true },
        { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
        { icon: Package, label: 'Products', path: '/admin/products' },
        { icon: Star, label: 'Featured Products', path: '/admin/featured' },
        { icon: FolderTree, label: 'Categories', path: '/admin/categories' },
        { icon: MessageSquare, label: 'Enquiries', path: '/admin/enquiries' },
        { icon: MessageCircle, label: 'Live Chat', path: '/admin/chat' },
      ]
    },
    {
      section: 'ERP / FINANCE', items: [
        { icon: Receipt, label: 'Invoices', path: '/admin/erp/invoices' },
        { icon: ClipboardList, label: 'Reports', path: '/admin/erp/reports' },
        { icon: UserCog, label: 'Customers', path: '/admin/erp/customers' },
      ]
    },
    {
      section: 'SETTINGS', items: [
        { icon: Settings, label: 'General', path: '/admin/settings' },
        { icon: Building, label: 'ERP Settings', path: '/admin/erp/settings' },
        { icon: HelpCircle, label: 'Help & Guide', path: '/admin/help' },
      ]
    }
  ];

  const isActive = function (path, exact) {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const renderMenuItem = function (item) {
    const active = isActive(item.path, item.exact);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobile}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
          active
            ? 'bg-gold/20 text-gold border-l-4 border-gold -ml-[2px] pl-[14px]'
            : 'text-gray-300 hover:bg-white/10 hover:text-white',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-gold')} />
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && item.badge && (
          <Badge className="ml-auto bg-red-500 text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center">{item.badge}</Badge>
        )}
      </Link>
    );
  };

  const renderSection = function (section, idx) {
    return (
      <div key={idx} className="mb-5">
        {!collapsed && <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-500 tracking-wider">{section.section}</h3>}
        <div className="space-y-0.5">{section.items.map(renderMenuItem)}</div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map(renderSection)}
      </nav>
      <div className={cn('border-t border-navy-light/20', collapsed ? 'p-2' : 'p-3')}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium">
            <ExternalLink className="h-4 w-4" />
            <span>Visit Store</span>
          </Link>
        )}
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold text-sm">{userInitial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{userName}</p>
              <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8" onClick={handleLogout} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link to="/" className="text-gold hover:text-gold-light"><ExternalLink className="h-4 w-4" /></Link>
            <Button variant="ghost" size="icon" className="w-full text-gray-400 h-8" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className={cn('hidden lg:block fixed left-0 top-0 bottom-0 bg-navy z-40 shadow-xl transition-all duration-200', collapsed ? 'w-[72px]' : 'w-64')}>
        <div className="flex flex-col h-full">
          <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-navy-light/20', collapsed && 'justify-center px-2')}>
            {collapsed ? (
              <img src="/logo.png" alt="GPGT" className="h-9 w-9 object-contain" />
            ) : (
              <img src="/logo.png" alt="Grand Palace General Trading" className="h-11 w-auto object-contain" />
            )}
          </div>
          {sidebarContent}
          <button
            onClick={function () { setCollapsed(!collapsed); }}
            className="absolute -right-3 top-20 w-6 h-6 bg-navy border border-navy-light/30 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-navy-light transition-colors"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMobile} />}

      {/* Mobile Sidebar */}
      <aside className={cn('lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-navy z-50 transform transition-transform shadow-xl', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-16 border-b border-navy-light/20">
            <img src="/logo.png" alt="Grand Palace" className="h-10 w-auto object-contain" />
            <button onClick={closeMobile} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn('flex-1 transition-all duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-64')}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between gap-4 px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4 min-w-0">
              <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0" onClick={function () { setMobileOpen(true); }}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                {breadcrumb && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Link to="/admin" className="hover:text-gold transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-navy font-medium">{breadcrumb}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {title && <h1 className="text-lg font-bold text-navy truncate">{title}</h1>}
                </div>
                {subtitle && <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Dashboard Link */}
              <Link to="/admin" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="h-9 gap-2 text-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Button>
              </Link>

              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 w-56 bg-gray-50 h-9 text-sm" />
              </div>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 gap-1.5 px-2" data-testid="notifications-bell">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-navy" />
                      <span className="font-semibold text-sm text-navy">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px] h-5">{unreadCount} new</Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-gold hover:text-gold-dark" onClick={markAllAsRead}>
                        <Check className="h-3 w-3 mr-1" /> Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Inbox className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">All caught up!</p>
                        <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n) => {
                        const action = getNotificationAction(n.type);
                        return (
                          <div
                            key={n.id}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                              !n.read && 'bg-blue-50/50'
                            )}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                              navigate(action.path);
                            }}
                          >
                            <div className={cn(
                              'mt-0.5 p-2 rounded-full flex-shrink-0',
                              !n.read ? 'bg-blue-100' : 'bg-gray-100'
                            )}>
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm leading-tight', !n.read ? 'font-semibold text-navy' : 'text-gray-700')}>{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {formatTimeAgo(n.created_at)}
                                </p>
                                <span className="text-[11px] text-gold font-medium flex items-center gap-0.5">
                                  {action.label} <ArrowRight className="h-3 w-3" />
                                </span>
                              </div>
                            </div>
                            {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
                  <ExternalLink className="h-3.5 w-3.5" /> Store
                </Button>
              </Link>
              {/* User Avatar with Name */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l ml-1">
                <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold text-xs">{userInitial}</div>
                <span className="text-sm font-medium text-navy">{userName}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;

