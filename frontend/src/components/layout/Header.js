import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  ShoppingCart, User, Menu, Search, LayoutDashboard, Phone, Mail, MapPin,
  ChevronDown, Droplets, Zap, Lightbulb, Shield, Wrench, Pipette,
  Paintbrush, Hammer, Package, ArrowRight, X, Home, Settings, Tag, ChevronRight,
  Building2, CircleDot, Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const iconMap = {
  Droplets: Droplets, Zap: Zap, Lightbulb: Lightbulb, Shield: Shield,
  Wrench: Wrench, Pipette: Pipette, Paintbrush: Paintbrush, Hammer: Hammer,
  Home: Home, Settings: Settings, Tag: Tag, Building2: Building2,
  CircleDot: CircleDot, Cog: Cog, Package: Package
};

// subcategoriesData removed - now using database children from category.children

// Category icon mapping
const categoryIcons = {
  'Sanitaryware': Droplets,
  'Electrical': Zap,
  'Lightings': Lightbulb,
  'Safety': Shield,
  'Tools': Wrench,
  'Hardware': Hammer,
  'Prefab Cabins': Building2,
  'Bollards': CircleDot,
  'Automation': Cog
};

// Category Dropdown Component
const CategoryDropdown = ({ category, onClose }) => {
  const subcategories = category.children || [];
  const IconComponent = categoryIcons[category.name] || Package;

  // Split subcategories into columns (max 3 columns)
  const itemsPerColumn = Math.ceil(subcategories.length / 3);
  const columns = [];
  for (let i = 0; i < subcategories.length; i += itemsPerColumn) {
    columns.push(subcategories.slice(i, i + itemsPerColumn));
  }

  return (
    <div
      className="absolute left-0 top-full bg-white shadow-xl rounded-b-lg z-50 min-w-[500px]"
      style={{ animation: 'megaMenuFadeIn 0.15s ease-out' }}
    >
      {/* Category Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100 bg-gray-50">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <IconComponent className="h-6 w-6 text-navy" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-navy">{category.name}</h3>
          <p className="text-sm text-gray-500">{subcategories.length} subcategories</p>
        </div>
      </div>

      {/* Subcategories Grid - 3 columns */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-2">
              {column.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/products?category=${sub.id}`}
                  onClick={onClose}
                  className="block text-gray-600 hover:text-gold transition-colors text-sm py-1"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* View All Link */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <Link
          to={`/products?category=${category.id}`}
          onClick={onClose}
          className="flex items-center gap-1 text-gold hover:text-gold-dark font-semibold text-sm transition-colors"
        >
          View All {category.name}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// All Categories Mega Menu Component
const MegaMenu = ({ categories, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || null);

  const activeCat = categories.find(c => c.id === activeCategory);
  const IconComponent = activeCat ? (categoryIcons[activeCat.name] || Package) : Package;
  const subcategories = activeCat ? (activeCat.children || []) : [];

  return (
    <div
      className="absolute right-0 left-0 top-full w-full bg-white shadow-2xl z-50 border-b border-gray-200"
      style={{ animation: 'megaMenuFadeIn 0.2s ease-out' }}
      data-testid="mega-menu"
    >
      <div className="flex pl-12">
        {/* Categories List - Left Side */}
        <div className="w-56 bg-white border-r border-gray-200 py-4 flex-shrink-0">
          {categories.map((cat) => {
            const CatIcon = categoryIcons[cat.name] || Package;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${activeCategory === cat.id
                  ? 'bg-navy text-white'
                  : 'text-navy hover:bg-gray-50'
                  }`}
              >
                <CatIcon className={`h-4 w-4 flex-shrink-0 ${activeCategory === cat.id ? 'text-gold' : 'text-gold'}`} />
                <span className="text-sm font-medium">{cat.name}</span>
                <ChevronRight className={`h-3 w-3 ml-auto ${activeCategory === cat.id ? 'text-gold' : 'text-gray-400'}`} />
              </div>
            );
          })}
        </div>

        {/* Category Details - Right Side */}
        {activeCat && (
          <div className="flex-1 p-6">
            {/* Category Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 mb-4">
              <div className="w-14 h-14 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-7 w-7 text-navy" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy">{activeCat.name}</h3>
                <p className="text-gray-500">{subcategories.length} subcategories</p>
              </div>
            </div>

            {/* Subcategories Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-x-6 gap-y-3 mb-6">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/products?category=${sub.id}`}
                  onClick={onClose}
                  className="text-gray-600 hover:text-gold transition-colors text-sm py-1"
                >
                  {sub.name}
                </Link>
              ))}
            </div>

            {/* View All Link */}
            <Link
              to={`/products?category=${activeCat.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-gold hover:text-gold-dark font-semibold transition-colors"
            >
              View All {activeCat.name}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Navigation Item with Dropdown
const NavItemWithDropdown = ({ category, isActive, onMouseEnter, onMouseLeave, showDropdown }) => {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        to={`/products?category=${category.id}`}
        className={`flex items-center gap-1 transition-colors px-3 py-4 text-sm font-medium ${isActive ? 'text-gold' : 'text-white hover:text-gold'
          }`}
      >
        {category.name}
        <ChevronDown className={`h-3 w-3 transition-transform ${isActive ? 'rotate-180 text-gold' : ''}`} />
      </Link>

      {showDropdown && (
        <CategoryDropdown category={category} onClose={onMouseLeave} />
      )}
    </div>
  );
};

const Header = () => {
  const { user, cart, logout, categories, settings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const cartItemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar - Navy with contact info */}
      <div className="bg-navy text-white py-1.5 sm:py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center gap-3 sm:gap-6">
            <a href={`tel:${settings.company_mobile || '+971545680916'}`} className="flex items-center gap-1 sm:gap-1.5 hover:text-gold transition-colors">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">{settings.company_mobile || '+971 54 568 0916'}</span><span className="sm:hidden">Mobile</span>
            </a>
            <a href={`tel:${settings.company_phone || '+97142727815'}`} className="hidden lg:flex items-center gap-1 sm:gap-1.5 hover:text-gold transition-colors">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span>{settings.company_phone || '+971 4 272 7815'}</span>
            </a>
            <a href={`mailto:${settings.company_email || 'sales@gpgt.ae'}`} className="hidden md:flex items-center gap-1.5 hover:text-gold transition-colors">
              <Mail className="h-3.5 w-3.5" /> {settings.company_email || 'sales@gpgt.ae'}
            </a>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            <span>{settings.company_address || 'Shop No:3 Al Sajaya Building, Al Qusais 2, Damascus St.  244, Sector, Dubai, United Arab Emirates'}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gold text-xs sm:text-sm whitespace-nowrap">Free Delivery 500+</span>
          </div>
        </div>
      </div>

      {/* Main Header - White background */}
      <div className="bg-white py-2 sm:py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <img
                src="/logo.png"
                alt="Grand Palace General Trading"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain py-1"
              />
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-6">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search products, categories, brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 rounded-lg pr-12 h-12 text-navy placeholder:text-gray-400 focus:border-gold"
                  data-testid="search-input"
                />
                <Button type="submit" className="absolute right-0 top-0 h-full bg-gold hover:bg-gold-dark text-navy-dark rounded-l-none rounded-r-lg px-4">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link to="/account">
                    <Button variant="ghost" className="text-navy hover:text-white hover:bg-gold transition-colors flex items-center gap-1.5" data-testid="account-btn">
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">Account</span>
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin">
                      <Button variant="ghost" className="text-navy hover:text-white hover:bg-gold transition-colors flex items-center gap-1.5" data-testid="admin-btn">
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="text-sm font-medium">Admin</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden md:block">
                  <Button variant="ghost" className="text-navy hover:text-white hover:bg-gold transition-colors flex items-center gap-1.5" data-testid="login-btn">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">Login</span>
                  </Button>
                </Link>
              )}

              <Link to="/cart" className="relative" data-testid="cart-link">
                <Button variant="ghost" className="text-navy hover:text-white hover:bg-gold transition-colors flex items-center gap-1.5">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium hidden md:inline">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gold text-navy-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Get Quote Button */}
              <Link to="/contact" className="hidden md:block">
                <Button className="bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:via-gold hover:to-gold-dark text-navy-dark font-bold px-6 h-11 rounded shadow-lg transition-all duration-300 border-0">
                  Get Quote
                </Button>
              </Link>

              <Button variant="ghost" className="md:hidden text-navy" onClick={() => setMobileMenuOpen(true)} data-testid="mobile-menu-btn">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Navy background */}
      <nav className="bg-navy relative border-y border-gold">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <ul className="hidden md:flex items-center">
              {/* All Categories with Mega Menu */}
              <li
                onMouseEnter={() => { setMegaMenuOpen(true); setActiveDropdown(null); }}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button
                  className={`flex items-center gap-2 text-white hover:text-gold transition-colors font-medium px-4 py-4 ${megaMenuOpen ? 'text-gold bg-navy-dark' : ''}`}
                  data-testid="nav-all-categories"
                >
                  <Menu className="h-4 w-4" />
                  All Categories
                  <ChevronDown className={`h-4 w-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {megaMenuOpen && categories.length > 0 && (
                  <MegaMenu categories={categories} onClose={() => setMegaMenuOpen(false)} />
                )}
              </li>

              {/* Individual Category Dropdowns - Show specific categories in order */}
              {(() => {
                // Define the order of categories to show (excluding Plumbing, including Hardware)
                const categoryOrder = ['Sanitaryware', 'Electrical', 'Lightings', 'Safety', 'Tools', 'Hardware'];
                const orderedCategories = categoryOrder
                  .map(name => categories.find(c => c.name === name))
                  .filter(Boolean);

                return orderedCategories.map((cat) => (
                  <NavItemWithDropdown
                    key={cat.id}
                    category={cat}
                    isActive={activeDropdown === cat.id}
                    onMouseEnter={() => { setActiveDropdown(cat.id); setMegaMenuOpen(false); }}
                    onMouseLeave={() => setActiveDropdown(null)}
                    showDropdown={activeDropdown === cat.id}
                  />
                ));
              })()}

              <li>
                <Link
                  to="/products"
                  className="text-gold hover:text-gold-light transition-colors font-medium px-3 py-4 inline-flex items-center gap-1 text-sm"
                  data-testid="nav-more"
                >
                  More <ChevronRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>

            {/* Special Offers Button */}
            <Link to="/products?offers=true" className="hidden md:block">
              <Button className="bg-gold hover:bg-gold-dark text-navy-dark font-bold px-6 my-2 rounded shadow-lg transform hover:scale-105 transition-transform">
                Special Offers
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="bg-navy border-gold w-[300px]">
          <SheetHeader>
            <SheetTitle className="text-gold text-left flex items-center justify-between">
              <span>Menu</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-navy-light border-navy-light text-white"
              />
            </form>
            <nav className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
              >
                All Products
              </Link>

              <div className="pt-2">
                <p className="text-gold text-xs font-semibold uppercase tracking-wide px-3 pb-2">Categories</p>
                {categories.map(cat => {
                  const CatIcon = iconMap[cat.icon] || Package;
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
                    >
                      <CatIcon className="h-4 w-4 text-gold" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>

              <Separator className="bg-navy-light my-4" />

              <Link
                to="/products?offers=true"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-3 text-gold hover:text-gold-light hover:bg-navy-light rounded-lg transition-colors font-semibold"
              >
                Special Offers
              </Link>

              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
              >
                Contact Us
              </Link>

              {user ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
                  >
                    My Account
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-3 text-gold hover:text-gold-light hover:bg-navy-light rounded-lg transition-colors font-semibold"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="block w-full text-left py-3 px-3 text-red-400 hover:text-red-300 hover:bg-navy-light rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-3 text-white hover:text-gold hover:bg-navy-light rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-3 text-gold hover:text-gold-light hover:bg-navy-light rounded-lg transition-colors font-semibold"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
