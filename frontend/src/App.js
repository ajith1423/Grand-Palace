import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  ShoppingCart, ChevronRight, ChevronLeft, Phone, ArrowRight,
  Truck, Shield, Headphones, RefreshCw, Award, CreditCard,
  Droplets, Zap, Lightbulb, Wrench, Pipette, Paintbrush, Hammer,
  Minus, Plus, Trash2, Package, Grid, List, Check, AlertCircle, Loader2, X,
  FileText, Settings, LayoutDashboard, MapPin, Mail, MessageSquare, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { AppProvider, useApp } from "@/context/AppContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ChatWidget from "@/components/ChatWidget";
import ProductCard from "@/components/ProductCard";
import CategorySidebar from "@/components/CategorySidebar";
import ProductDetailPage from "@/pages/ProductDetailPage";
import AccountPage, { OrderDetailPage } from "@/pages/AccountPage";
import VerifyAccountPage from "@/pages/VerifyAccountPage";
import { AdminProducts, AdminOrders, AdminCategories, AdminSettings, AdminCustomers, AdminFeaturedProducts } from "@/pages/Admin";
import ERPDashboard from "@/pages/ERPDashboard";
import InvoiceManagement from "@/pages/InvoiceManagement";
import ReportsModule from "@/pages/ReportsModule";
import ERPSettings from "@/pages/ERPSettings";
import CustomerERPView from "@/pages/CustomerERPView";
import EnquiriesPage from "@/pages/EnquiriesPage";
import AdminHelp from "@/pages/AdminHelp";
import AdminChat from "@/pages/AdminChat";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const iconMap = {
  Droplets: Droplets, Zap: Zap, Lightbulb: Lightbulb, Shield: Shield,
  Wrench: Wrench, Pipette: Pipette, Paintbrush: Paintbrush, Hammer: Hammer
};

// HomePage
const HomePage = () => {
  const { categories } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  const defaultHeroSlides = [
    { image: "https://images.unsplash.com/photo-1707064892275-a3088e8240be?w=1200", title: "Quality Building Materials", subtitle: "Your Trusted Partner in Construction & Trading" },
    { image: "https://images.unsplash.com/photo-1745449563046-f75d0bd28f46?w=1200", title: "Industrial Tools & Equipment", subtitle: "Professional Grade Tools for Every Project" },
    { image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200", title: "Safety & Security Solutions", subtitle: "Protect What Matters Most" }
  ];

  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides);

  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const res = await axios.get(`${API}/hero-slides`);
        if (res.data.slides && res.data.slides.length > 0) {
          setHeroSlides(res.data.slides);
        }
      } catch (e) { console.error('Failed to fetch hero slides'); }
    };
    fetchHeroSlides();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const features = [
    { icon: Truck, title: "Free Delivery", desc: "Free shipping on orders above AED 500" },
    { icon: Shield, title: "Secure Payment", desc: "Multiple secure payment options" },
    { icon: Headphones, title: "24/7 Support", desc: "Dedicated customer support team" },
    { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free return policy" },
    { icon: Award, title: "Quality Assured", desc: "All products are quality checked" },
    { icon: CreditCard, title: "Flexible Payment", desc: "Pay in installments with 0% interest" }
  ];

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await axios.get(`${API}/products?featured=true&sort_by=name&sort_order=asc&limit=20`);
        setFeaturedProducts(res.data.products);
      } catch (e) { console.error('Failed to fetch featured products'); }
    };
    fetchFeatured();
  }, [API]);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden" data-testid="hero-section">
        {heroSlides.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'}`}>
            <img src={slide.image.startsWith('/api') ? `${window.location.origin}${slide.image}` : slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/90 sm:from-navy-dark/95 via-navy-dark/60 sm:via-navy-dark/70 to-navy-dark/30 sm:to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className={`max-w-2xl transition-all duration-700 delay-200 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4">{slide.title}</h1>
                  <p className="text-sm sm:text-base md:text-xl text-white/90 mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-none">{slide.subtitle}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Button onClick={() => navigate('/products')} className="bg-gradient-to-r from-gold via-gold-light to-gold text-navy-dark font-bold h-10 sm:h-14 px-6 sm:px-10 text-sm sm:text-lg hover:scale-105 transition-transform shadow-lg" data-testid="shop-now-btn">
                      Shop Now <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/contact')} className="border-2 border-white text-white h-10 sm:h-14 px-6 sm:px-10 text-sm sm:text-lg hover:bg-white hover:text-navy-dark shadow-lg">Contact Us</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-navy-dark/50 backdrop-blur-sm text-white hover:bg-gold hover:text-navy-dark transition-colors flex items-center justify-center z-20"><ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        <button onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-navy-dark/50 backdrop-blur-sm text-white hover:bg-gold hover:text-navy-dark transition-colors flex items-center justify-center z-20"><ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
          {heroSlides.map((_, i) => (<button key={i} onClick={() => setCurrentSlide(i)} className={`rounded-full ${i === currentSlide ? 'w-6 sm:w-8 h-2 sm:h-3 bg-gold' : 'w-2 sm:w-3 h-2 sm:h-3 bg-white/50'}`} />))}
        </div>
      </section>


      {/* Featured Products - Above Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <Badge className="mb-3 bg-gold/10 text-gold border-0">Featured</Badge>
              <h2 className="text-3xl font-bold text-navy">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Hand-picked products with the best prices</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-gold font-semibold">View All <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {featuredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} forceShowPrice={true} />)}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">More featured products coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories - Shop by Category */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <Badge className="mb-3 bg-gold/10 text-gold border-0">Browse Categories</Badge>
              <h2 className="text-3xl font-bold text-navy">Shop by Category</h2>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-gold font-semibold">View All <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((cat, i) => {
              const IconComponent = iconMap[cat.icon] || Package;
              return (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="group relative overflow-hidden rounded-xl bg-card border category-card" data-testid={`category-${cat.name.toLowerCase()}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={cat.image || "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400"} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/40 to-transparent" />
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-gold/20 backdrop-blur-sm flex items-center justify-center"><IconComponent className="h-5 w-5 text-gold" /></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
                    <p className="text-gold text-sm">{cat.total_product_count || cat.product_count || 0} Products</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location Map */}
      <section className="bg-white">
        <div className="w-full h-80 md:h-96 relative border-y border-gray-200">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.411651588147!2d55.378902!3d25.290389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5db8111e695d%3A0xd71c8eff4b8ea811!2sGrand%20Palace%20General%20Trading%20LLC!5e0!3m2!1sen!2sae!4v1709477382949!5m2!1sen!2sae"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location"
            className="w-full h-full grayscale-[50%] hover:grayscale-0 transition-all duration-700 opacity-90 hover:opacity-100"
          ></iframe>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-navy" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Project?</h2>
          <p className="text-lg text-white/80 mb-10">Get in touch for personalized quotes and expert advice.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/products')} className="bg-gradient-to-r from-gold to-gold-light text-navy-dark font-bold h-14 px-10 text-lg">Browse Products <ArrowRight className="ml-2 h-5 w-5" /></Button>
            <Button onClick={() => navigate('/contact')} variant="outline" className="border-white/30 text-white h-14 px-10 text-lg hover:bg-white hover:text-navy-dark"><Mail className="mr-2 h-5 w-5" /> Get Quote</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((f, i) => (
              <Card key={i} className="bg-navy-light border-navy-light/50 text-center hover:bg-gold/10 transition-colors">
                <CardContent className="p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center"><f.icon className="h-6 w-6 text-gold" /></div>
                  <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
                  <p className="text-xs text-white/70">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

// Products Page
const ProductsPage = () => {
  const { categories, allCategoriesFlat } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const categoryId = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'name';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (search) params.append('search', search);

        // Default to name A-Z if not specified or set to name
        const effectiveSortBy = sortBy === 'price_asc' || sortBy === 'price_desc' ? 'price' : 'name';
        const effectiveSortOrder = sortBy === 'price_asc' ? 'asc' : (sortBy === 'price_desc' ? 'desc' : 'asc');

        params.append('sort_by', effectiveSortBy);
        params.append('sort_order', effectiveSortOrder);
        params.append('limit', 20);
        const res = await axios.get(`${API}/products?${params.toString()}`);
        setProducts(res.data.products);
        setTotal(res.data.total);
      } catch (e) { toast.error('Failed to load products'); }
      setLoading(false);
    };
    fetchProducts();
  }, [categoryId, search, sortBy, API]);

  const selectedCategory = allCategoriesFlat.find(c => c.id === categoryId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-gold">Home</Link><ChevronRight className="h-4 w-4" /><span className="text-navy">Products</span>
          {selectedCategory && <><ChevronRight className="h-4 w-4" /><span className="text-gold">{selectedCategory.name}</span></>}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64">
            <CategorySidebar
              categories={categories}
              allCategoriesFlat={allCategoriesFlat}
              categoryId={categoryId}
              onCategoryChange={(catId) => catId ? setSearchParams({ category: catId }) : setSearchParams({})}
            />
          </aside>
          <div className="flex-1">
            <div className="flex justify-between items-center gap-4 mb-6">
              <div><h1 className="text-2xl font-bold text-navy">{search ? `Search: "${search}"` : selectedCategory?.name || 'All Products'}</h1><p className="text-muted-foreground">{total} products found</p></div>
              <div className="flex items-center gap-3">
                <div className="flex border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gold text-navy-dark' : ''}`}><Grid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gold text-navy-dark' : ''}`}><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Card key={i}><div className="aspect-square skeleton" /><CardContent className="p-4"><div className="h-4 w-20 skeleton rounded mb-2" /><div className="h-5 w-full skeleton rounded" /></CardContent></Card>)}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12"><Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No products found</h3></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Detail Page
// ProductDetailPage is now imported from @/pages/ProductDetailPage.js

// Cart Page
const CartPage = () => {
  const { cart, updateCartItem, removeFromCart, settings } = useApp();
  const navigate = useNavigate();
  const showPrices = settings?.show_prices !== false;
  if (cart.items?.length === 0) return <div className="container mx-auto px-4 py-16 text-center"><ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h2 className="text-2xl font-bold text-navy mb-2">{showPrices ? 'Your Cart is Empty' : 'Your Inquiry List is Empty'}</h2><Link to="/products"><Button className="bg-gold text-navy-dark">Browse Products</Button></Link></div>;
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8" data-testid="cart-title">{showPrices ? 'Shopping Cart' : 'Inquiry List'}</h1>
        {!showPrices && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Prices are available upon request. Submit your inquiry and we'll send you a quotation.</span>
            </p>
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items?.map((item) => (
              <Card key={item.product_id}>
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0"><img src={item.product?.images?.[0] || "https://via.placeholder.com/100"} alt={item.product?.name} className="w-full h-full object-cover" /></div>
                  <div className="flex-1"><Link to={`/products/${item.product_id}`} className="font-semibold text-navy hover:text-gold">{item.product?.name}</Link><p className="text-sm text-muted-foreground">{item.product?.brand}</p>{showPrices && <p className="text-gold font-bold">AED {item.unit_price?.toFixed(2)}</p>}</div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
                    <div className="flex items-center border rounded-lg"><button onClick={() => updateCartItem(item.product_id, item.quantity - 1)} className="p-2 hover:bg-muted"><Minus className="h-3 w-3" /></button><span className="w-8 text-center text-sm">{item.quantity}</span><button onClick={() => updateCartItem(item.product_id, item.quantity + 1)} className="p-2 hover:bg-muted"><Plus className="h-3 w-3" /></button></div>
                    {showPrices && <p className="font-semibold">AED {item.total_price?.toFixed(2)}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle>{showPrices ? 'Order Summary' : 'Inquiry Summary'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {showPrices ? (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>AED {cart.subtotal?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">VAT ({settings.vat_percentage || 5}%)</span><span>AED {cart.vat?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{cart.shipping === 0 ? 'FREE' : `AED ${cart.shipping?.toFixed(2)}`}</span></div>
                    {cart.subtotal < (settings.free_shipping_threshold || 500) && <p className="text-sm text-gold">Add AED {((settings.free_shipping_threshold || 500) - cart.subtotal).toFixed(2)} more for free shipping!</p>}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-gold">AED {cart.total?.toFixed(2)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Items in Inquiry</span><span>{cart.items?.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">Pricing will be provided in the quotation</p>
                  </>
                )}
                <Button className="w-full bg-gold hover:bg-gold-dark text-navy-dark font-bold h-12" onClick={() => navigate('/checkout')} data-testid="checkout-btn">{showPrices ? 'Proceed to Checkout' : 'Request Quotation'}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Page
const CheckoutPage = () => {
  const { cart, user, settings, API, getAuthHeaders, sessionId } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Check if user email is verified (required for checkout)
  const emailVerified = user?.email_verified || user?.role === 'admin';

  // Check if prices are hidden (quotation mode) or both payment methods are disabled
  const showPrices = settings?.show_prices !== false;
  const paymentDisabled = !settings.payment_enabled && !settings.cod_enabled;
  const isQuotationMode = !showPrices || paymentDisabled;
  const [paymentMethod, setPaymentMethod] = useState(settings.payment_enabled ? 'card' : (settings.cod_enabled ? 'cod' : 'enquiry'));
  const [formData, setFormData] = useState({ full_name: user?.name || '', email: user?.email || '', phone: '+971', address_line1: '', city: 'Dubai', emirate: 'Dubai', notes: '' });
  const emirates = settings.delivery_emirates || ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check email verification before proceeding
    if (!emailVerified) {
      setShowVerificationModal(true);
      return;
    }

    setLoading(true);
    try {
      if (isQuotationMode) {
        // Submit as enquiry - send cart details to admin
        const enquiryData = {
          items: cart.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product?.name,
            product_sku: item.product?.sku,
            quantity: item.quantity,
            unit_price: showPrices ? (item.product?.offer_price || item.product?.price) : null,
            total_price: showPrices ? item.total_price : null
          })),
          customer: {
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone
          },
          shipping_address: {
            address_line1: formData.address_line1,
            city: formData.city,
            emirate: formData.emirate
          },
          subtotal: showPrices ? cart.subtotal : null,
          vat: showPrices ? cart.vat : null,
          shipping: showPrices ? cart.shipping : null,
          total: showPrices ? cart.total : null,
          notes: formData.notes,
          is_quotation_request: !showPrices
        };

        const res = await axios.post(`${API}/cart-enquiry`, enquiryData, { headers: getAuthHeaders() });
        toast.success(showPrices ? 'Enquiry submitted successfully! We will contact you soon.' : 'Quotation request submitted! We will send you pricing shortly.');
        navigate(`/enquiry-confirmation/${res.data.enquiry_id}`);
      } else {
        // Normal order flow
        const orderData = { items: cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })), shipping_address: { full_name: formData.full_name, email: formData.email, phone: formData.phone, address_line1: formData.address_line1, city: formData.city, emirate: formData.emirate }, payment_method: paymentMethod, notes: formData.notes };
        const params = sessionId ? { session_id: sessionId } : {};
        const res = await axios.post(`${API}/orders`, orderData, { headers: getAuthHeaders(), params });
        if (res.data.requires_payment && paymentMethod === 'card') {
          const checkoutRes = await axios.post(`${API}/checkout/create-session`, { order_id: res.data.order_id, origin_url: window.location.origin }, { headers: getAuthHeaders() });
          window.location.href = checkoutRes.data.checkout_url;
        } else { toast.success('Order placed successfully!'); navigate(`/order-confirmation/${res.data.order_id}`); }
      }
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to submit'); }
    setLoading(false);
  };

  if (cart.items?.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-2" data-testid="checkout-title">{isQuotationMode ? (!showPrices ? 'Request Quotation' : 'Submit Enquiry') : 'Checkout'}</h1>
        {isQuotationMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>{!showPrices ? 'Fill in your details below and we\'ll send you a quotation with pricing.' : 'Fill in your details below. Our team will contact you to confirm your order and arrange payment.'}</span>
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card><CardHeader><CardTitle>Contact Information</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} data-testid="checkout-name" /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} data-testid="checkout-email" /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Mobile Number *</Label><Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+971" data-testid="checkout-phone" /></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="space-y-2"><Label>Address *</Label><Input required value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} placeholder="Building, Street" data-testid="checkout-address" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>City *</Label><Input required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Emirate *</Label><Select value={formData.emirate} onValueChange={(v) => setFormData({ ...formData, emirate: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{emirates.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Order Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions or requirements..." /></div>
              </CardContent></Card>

              {/* Only show payment options if payment is enabled and prices are shown */}
              {!isQuotationMode && (
                <Card><CardHeader><CardTitle>Payment Method</CardTitle></CardHeader><CardContent className="space-y-4">
                  {settings.payment_enabled && <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'card' ? 'border-gold bg-gold/5' : ''}`}><input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-gold" /><CreditCard className="h-5 w-5 text-gold" /><div><p className="font-medium">Credit/Debit Card</p><p className="text-sm text-muted-foreground">Secure payment via Stripe</p></div></label>}
                  {settings.cod_enabled && <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-gold bg-gold/5' : ''}`}><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-gold" /><Truck className="h-5 w-5 text-gold" /><div><p className="font-medium">Cash on Delivery</p><p className="text-sm text-muted-foreground">Pay when you receive</p></div></label>}
                </CardContent></Card>
              )}
            </div>
            <div><Card className="sticky top-24"><CardHeader><CardTitle>{isQuotationMode && !showPrices ? 'Inquiry Summary' : 'Order Summary'}</CardTitle></CardHeader><CardContent className="space-y-4">
              {cart.items?.map((item) => (<div key={item.product_id} className="flex gap-3"><div className="w-16 h-16 rounded overflow-hidden flex-shrink-0"><img src={item.product?.images?.[0] || "https://via.placeholder.com/60"} alt="" className="w-full h-full object-cover" /></div><div className="flex-1"><p className="text-sm font-medium line-clamp-1">{item.product?.name}</p><p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>{showPrices && <p className="text-sm font-semibold">AED {item.total_price?.toFixed(2)}</p>}</div></div>))}
              <Separator />
              {showPrices ? (
                <>
                  <div className="space-y-2"><div className="flex justify-between text-sm"><span>Subtotal</span><span>AED {cart.subtotal?.toFixed(2)}</span></div><div className="flex justify-between text-sm"><span>VAT</span><span>AED {cart.vat?.toFixed(2)}</span></div><div className="flex justify-between text-sm"><span>Shipping</span><span>{cart.shipping === 0 ? 'FREE' : `AED ${cart.shipping?.toFixed(2)}`}</span></div></div>
                  <Separator /><div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-gold">AED {cart.total?.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">Pricing will be included in your quotation</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-gold hover:bg-gold-dark text-navy-dark font-bold h-12" disabled={loading} data-testid="place-order-btn">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isQuotationMode ? <><Send className="h-5 w-5 mr-2" /> {!showPrices ? 'Request Quotation' : 'Submit Enquiry'}</> : 'Place Order')}
              </Button>
              {isQuotationMode && <p className="text-center text-sm text-muted-foreground">{!showPrices ? 'We\'ll send you pricing within 24 hours' : 'Our team will contact you to confirm the order'}</p>}
            </CardContent></Card></div>
          </div>
        </form>
      </div>

      {/* Email Verification Required Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Email Verification Required</h3>
              <p className="text-muted-foreground mb-6">Please verify your email address before placing an order. This helps us confirm your identity and send order updates.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowVerificationModal(false)}>Cancel</Button>
                <Button className="bg-gold hover:bg-gold-dark text-navy-dark" onClick={() => navigate('/verify-account')}>Verify Email</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Order Confirmation
const OrderConfirmationPage = () => {
  const { id } = useParams();
  const { getAuthHeaders, API } = useApp();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => { try { const res = await axios.get(`${API}/orders/${id}`, { headers: getAuthHeaders() }); setOrder(res.data); } catch (e) { console.error('Failed to fetch order'); } setLoading(false); };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, API]);

  if (loading) return <div className="container mx-auto px-4 py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  if (!order) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold">Order not found</h2><Link to="/"><Button className="mt-4 bg-gold text-navy-dark">Go Home</Button></Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"><Check className="h-10 w-10 text-green-600" /></div>
          <h1 className="text-3xl font-bold text-navy mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">Your order has been placed successfully</p>
          <Card className="text-left"><CardContent className="p-6 space-y-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Order Number</span><span className="font-bold text-gold">{order.order_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-gold/10 text-gold">{order.status?.toUpperCase()}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_status}</span></div>
            <Separator /><div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-gold">AED {order.total?.toFixed(2)}</span></div>
          </CardContent></Card>
          <div className="mt-6 flex gap-4 justify-center"><Link to="/products"><Button variant="outline">Continue Shopping</Button></Link></div>
        </div>
      </div>
    </div>
  );
};

// Checkout Success
const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { API } = useApp();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkStatus = async () => {
      if (!sessionId) { navigate('/'); return; }
      try { const res = await axios.get(`${API}/checkout/status/${sessionId}`); setStatus(res.data.payment_status === 'paid' ? 'success' : 'pending'); } catch (e) { setStatus('error'); }
    };
    checkStatus(); const interval = setInterval(checkStatus, 2000); setTimeout(() => clearInterval(interval), 10000); return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, API, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === 'checking' && <><Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gold" /><h2 className="text-xl font-semibold">Verifying payment...</h2></>}
        {status === 'success' && <><div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"><Check className="h-10 w-10 text-green-600" /></div><h2 className="text-2xl font-bold text-navy mb-2">Payment Successful!</h2><Link to="/"><Button className="bg-gold text-navy-dark">Go Home</Button></Link></>}
        {status === 'pending' && <><AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" /><h2 className="text-xl font-semibold">Payment Pending</h2></>}
        {status === 'error' && <><X className="h-12 w-12 mx-auto mb-4 text-red-500" /><h2 className="text-xl font-semibold">Payment Failed</h2><Link to="/cart"><Button className="mt-4">Return to Cart</Button></Link></>}
      </div>
    </div>
  );
};

// Enquiry Confirmation Page
const EnquiryConfirmationPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-4">Enquiry Submitted!</h1>
          <p className="text-muted-foreground mb-6">Thank you for your enquiry. Our team will contact you shortly to confirm your order and arrange payment.</p>

          <Card className="text-left mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Enquiry Reference</span>
                <span className="font-bold text-gold">{id}</span>
              </div>
              <Separator />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  What Happens Next?
                </h3>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li>• Our team will review your enquiry within 24 hours</li>
                  <li>• We'll contact you via phone or email to confirm details</li>
                  <li>• Payment can be arranged via bank transfer or other methods</li>
                  <li>• Your order will be processed once payment is confirmed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Link to="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold-dark text-navy-dark">Contact Us</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import { auth } from "@/firebase-config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Login Page
const LoginPage = () => {
  const { login, loginWithPhone, user, setUser, API } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone Auth State
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phone, setPhone] = useState('+971 ');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    // Check for error from Google OAuth
    const error = searchParams.get('error');
    if (error) {
      toast.error('Google login failed. Please try again.');
    }

    if (user) {
      if (!user.email_verified && user.role !== 'admin' && user.auth_provider !== 'google' && !user.phone_verified) {
        navigate('/verify-account');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/account');
      }
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    if (searchParams.get('phone') === 'true') {
      setShowPhoneLogin(true);
    }
  }, [searchParams]);

  // Phone login effect handled by URL params
  useEffect(() => {
    if (searchParams.get('phone') === 'true') {
      setShowPhoneLogin(true);
    }
  }, [searchParams]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      // Robust E.164 sanitization
      const sanitizedPhone = phone.startsWith('+') ? phone.replace(/[^0-9+]/g, '') : `+${phone.replace(/[^0-9]/g, '')}`;
      console.log("Sending OTP to:", sanitizedPhone);
      const response = await axios.post(`${API}/auth/send-otp`, { phone: sanitizedPhone });
      setVerificationId('twilio-backend');
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    }
    setPhoneLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      const sanitizedPhone = phone.startsWith('+') ? phone.replace(/[^0-9+]/g, '') : `+${phone.replace(/[^0-9]/g, '')}`;
      console.log("Verifying OTP for:", sanitizedPhone);
      const response = await axios.post(`${API}/auth/verify-otp`, { phone: sanitizedPhone, otp });
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        toast.success('Welcome back!');
        navigate(response.data.user.role === 'admin' ? '/admin' : '/account');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Invalid OTP. Please try again.');
    }
    setPhoneLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await login(email, password);
      toast.success('Welcome back!');
      if (!res.user.email_verified && res.user.role !== 'admin' && res.user.auth_provider !== 'google') {
        navigate('/verify-account');
      } else {
        navigate(res.user.role === 'admin' ? '/admin' : '/account');
      }
    } catch (e) { toast.error(e.response?.data?.detail || 'Login failed'); }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = window.location.origin + '/auth/callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } catch (e) {
      toast.error('Failed to initiate Google login');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-navy">Welcome Back</CardTitle>
          <p className="text-muted-foreground">Login to your account</p>
        </CardHeader>
        <CardContent className="pt-6">
          {!showPhoneLogin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-11" data-testid="login-email" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" data-testid="login-password" />
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-white h-11 font-semibold" disabled={loading} data-testid="login-submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
              <div className="text-center">
                <Button type="button" variant="link" className="text-gold hover:text-gold-dark p-0 h-auto font-medium" onClick={() => setShowPhoneLogin(true)}>
                  Sign in with Phone Number
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {!verificationId ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971" className="h-11 text-lg font-medium tracking-tight" />
                  </div>
                  <Button type="submit" className="w-full bg-gold hover:bg-gold-dark text-navy-dark h-11 font-bold shadow-sm" disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP Code'}
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-navy hover:text-navy-light p-0 h-auto font-medium" onClick={() => setShowPhoneLogin(false)}>
                      Back to Email Login
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-center mb-4">
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-semibold text-navy">{phone}</span></p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" className="h-12 text-center text-2xl font-bold tracking-[0.5em]" maxLength={6} />
                  </div>
                  <Button type="submit" className="w-full bg-gold hover:bg-gold-dark text-navy-dark h-11 font-bold shadow-sm" disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Continue'}
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-navy hover:text-navy-light p-0 h-auto font-medium" onClick={() => setVerificationId(null)}>
                      Edit Phone Number
                    </Button>
                  </div>
                </form>
              )}
              <div id="recaptcha-container" className="flex justify-center my-4"></div>
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-2"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            data-testid="google-login-btn"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="mt-4 text-center text-sm"><span className="text-muted-foreground">Don't have an account? </span><Link to="/register" className="text-gold hover:underline">Register</Link></div>
        </CardContent>
      </Card>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const { register, user, API } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // If user is logged in but not verified, go to verification
    if (user && !user.email_verified && user.auth_provider !== 'google') {
      navigate('/verify-account');
    } else if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const response = await register(formData);
      toast.success('Account created! Please verify your email.');
      // Redirect to verification page
      navigate('/verify-account');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = window.location.origin + '/auth/callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } catch (e) {
      toast.error('Failed to initiate Google login');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center"><CardTitle className="text-2xl text-navy">Create Account</CardTitle></CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-2 mb-4"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            data-testid="google-register-btn"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </>
            )}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or register with email</span></div>
          </div>

          <div className="mb-4">
            <Button variant="ghost" className="w-full text-gold" onClick={() => navigate('/login?phone=true')}>Signup with Phone Number</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="register-name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} data-testid="register-email" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} data-testid="register-password" /></div>
            <Button type="submit" className="w-full bg-gold hover:bg-gold-dark text-navy-dark" disabled={loading} data-testid="register-submit">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}</Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-3">By registering, you'll receive a verification code via email.</p>
          <div className="mt-4 text-center text-sm"><span className="text-muted-foreground">Already have an account? </span><Link to="/login" className="text-gold hover:underline">Login</Link></div>
        </CardContent>
      </Card>
    </div>
  );
};

// Contact Page
const ContactPage = () => {
  const { settings, API } = useApp();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/enquiry/contact`, formData);
      toast.success('Message sent! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Get in touch with our team for any inquiries or support.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column: Contact Info & Map */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="text-center hover:border-gold transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4"><Phone className="h-5 w-5 text-gold" /></div>
                  <h3 className="font-semibold text-navy mb-1">Phone</h3>
                  <a href={`tel:${settings.company_phone}`} className="text-gold hover:underline text-sm">{settings.company_phone || '+971 4 456 7890'}</a>
                </CardContent>
              </Card>
              <Card className="text-center hover:border-gold transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4"><Mail className="h-5 w-5 text-gold" /></div>
                  <h3 className="font-semibold text-navy mb-1">Email</h3>
                  <a href={`mailto:${settings.company_email}`} className="text-gold hover:underline text-sm">{settings.company_email || 'info@gpgt.ae'}</a>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-80 w-full bg-gray-100 flex items-center justify-center relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.411651588147!2d55.378902!3d25.290389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5db8111e695d%3A0x82dbb277d079313!2sAl%20Sajaya%20Building!5e0!3m2!1sen!2sae!4v1709477382949!5m2!1sen!2sae"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                  className="absolute inset-0 grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>
              <CardContent className="p-4 bg-navy text-white text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-gold" />
                  <span className="font-semibold">Our Location</span>
                </div>
                <p className="text-sm text-gray-300">{settings.company_address || 'Shop No:3 Al Sajaya Building, Al Qusais 2, Damascus St.  244, Sector, Dubai, United Arab Emirates'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Contact Form */}
          <Card className="shadow-lg border-gold/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold to-gold-light" />
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-navy mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" required placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="focus-visible:ring-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" required placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="focus-visible:ring-gold" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="+971 50 123 4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="focus-visible:ring-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" required placeholder="How can we help?" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="focus-visible:ring-gold" />
                  </div>
                </div>
                <div className="space-y-2 pb-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required placeholder="Write your message here..." className="min-h-[120px] resize-none focus-visible:ring-gold" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold-dark text-navy-dark font-bold h-12 text-lg transition-all duration-300">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Auth Callback Page (handles Google OAuth redirect)
const AuthCallbackPage = () => {
  const { setUser, API } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    // Prevent double processing in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Check for error
      const error = searchParams.get('error');
      if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      // Check for Emergent OAuth session_id in URL fragment
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1]?.split('&')[0];

        if (sessionId) {
          try {
            // Exchange session_id for token via backend
            const res = await axios.post(`${API}/auth/emergent/session`, {
              session_id: sessionId
            });

            if (res.data.token && res.data.user) {
              localStorage.setItem('token', res.data.token);
              setUser(res.data.user);
              toast.success('Welcome! You are now logged in with Google.');

              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);

              navigate(res.data.user.role === 'admin' ? '/admin' : '/account');
              return;
            }
          } catch (e) {
            console.error('Emergent auth failed', e);
            toast.error(e.response?.data?.detail || 'Google login failed');
            navigate('/login');
            return;
          }
        }
      }

      // Check for legacy token in query params (backward compatibility)
      const token = searchParams.get('token');
      if (token) {
        localStorage.setItem('token', token);

        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          toast.success('Welcome! You are now logged in.');
          navigate(res.data.role === 'admin' ? '/admin' : '/account');
        } catch (e) {
          console.error('Failed to fetch user', e);
          toast.error('Failed to complete login');
          navigate('/login');
        }
        return;
      }

      // No auth data found
      navigate('/login');
    };

    processAuth();
  }, [searchParams, navigate, setUser, API]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gold" />
        <h2 className="text-xl font-semibold text-navy">Completing login...</h2>
        <p className="text-muted-foreground">Please wait while we verify your account.</p>
      </div>
    </div>
  );
};

// Admin Page
const AdminPage = () => {
  const { user, API, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);
  const fetchStats = async () => { try { const res = await axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders() }); setStats(res.data); } catch (e) { console.error('Failed to fetch stats'); } };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8"><h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1><Badge className="bg-gold text-navy-dark">Admin</Badge></div>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gold">{stats.total_products}</p><p className="text-sm text-muted-foreground">Products</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gold">{stats.total_orders}</p><p className="text-sm text-muted-foreground">Orders</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-500">{stats.pending_orders}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gold">{stats.total_customers}</p><p className="text-sm text-muted-foreground">Customers</p></CardContent></Card>
            <Card className="col-span-2"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">AED {stats.total_revenue?.toFixed(2)}</p><p className="text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/admin/products"><Card className="hover:border-gold transition-colors cursor-pointer" data-testid="admin-products"><CardContent className="p-6 flex items-center gap-4"><Package className="h-10 w-10 text-gold" /><div><h3 className="font-semibold">Products</h3><p className="text-sm text-muted-foreground">Manage products</p></div></CardContent></Card></Link>
          <Link to="/admin/orders"><Card className="hover:border-gold transition-colors cursor-pointer" data-testid="admin-orders"><CardContent className="p-6 flex items-center gap-4"><FileText className="h-10 w-10 text-gold" /><div><h3 className="font-semibold">Orders</h3><p className="text-sm text-muted-foreground">Manage orders</p></div></CardContent></Card></Link>
          <Link to="/admin/categories"><Card className="hover:border-gold transition-colors cursor-pointer" data-testid="admin-categories"><CardContent className="p-6 flex items-center gap-4"><Grid className="h-10 w-10 text-gold" /><div><h3 className="font-semibold">Categories</h3><p className="text-sm text-muted-foreground">Manage categories</p></div></CardContent></Card></Link>
          <Link to="/admin/customers"><Card className="hover:border-gold transition-colors cursor-pointer" data-testid="admin-customers"><CardContent className="p-6 flex items-center gap-4"><LayoutDashboard className="h-10 w-10 text-gold" /><div><h3 className="font-semibold">Customers</h3><p className="text-sm text-muted-foreground">User verification</p></div></CardContent></Card></Link>
          <Link to="/admin/settings"><Card className="hover:border-gold transition-colors cursor-pointer" data-testid="admin-settings"><CardContent className="p-6 flex items-center gap-4"><Settings className="h-10 w-10 text-gold" /><div><h3 className="font-semibold">Settings</h3><p className="text-sm text-muted-foreground">Store settings</p></div></CardContent></Card></Link>
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CartPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/enquiry-confirmation/:id" element={<EnquiryConfirmationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-account" element={<VerifyAccountPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/order/:id" element={<OrderDetailPage />} />
            <Route path="/admin" element={<ERPDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/featured" element={<AdminFeaturedProducts />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/help" element={<AdminHelp />} />
            <Route path="/admin/chat" element={<AdminChat />} />
            <Route path="/admin/erp/invoices" element={<InvoiceManagement />} />
            <Route path="/admin/erp/reports" element={<ReportsModule />} />
            <Route path="/admin/erp/settings" element={<ERPSettings />} />
            <Route path="/admin/erp/customers" element={<CustomerERPView />} />
            <Route path="/admin/enquiries" element={<EnquiriesPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
          <Footer />
          <WhatsAppButton />
          <Toaster position="top-right" richColors />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
