import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import {
  ShoppingCart, ChevronRight, ChevronLeft, Check, AlertCircle, X,
  Minus, Plus, Package, Truck, Shield, Award, RefreshCw, Phone,
  Star, Heart, Share2, ZoomIn, Box, Clock, MapPin, CreditCard,
  Headphones, CheckCircle2, HelpCircle, FileText, Wrench, Info,
  Send, MessageSquare, User, Mail, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProductCard from '@/components/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// Default content if not set by admin
const defaultHighlights = [
  'Premium quality materials for long-lasting durability',
  'Easy installation with standard UAE plumbing fittings',
  'Modern design suitable for residential and commercial use',
  'Water-efficient design helps reduce utility bills',
  'Backed by manufacturer warranty and after-sales support',
  'Fast delivery across all UAE Emirates'
];

const defaultSpecifications = {
  'Brand': 'Grand Palace',
  'Material': 'Premium Grade',
  'Color': 'White / Chrome',
  'Installation Type': 'Floor / Wall Mounted',
  'Water Efficiency': 'Low Flow Technology',
  'Country of Origin': 'Imported'
};

const defaultBoxContents = [
  'Main Product Unit',
  'Mounting Hardware',
  'Installation Manual',
  'Warranty Card'
];

const defaultFaqs = [
  { q: 'Is installation included with the purchase?', a: 'Installation service is available at an additional cost. Contact our team for professional installation support across UAE.' },
  { q: 'What is the warranty period?', a: 'This product comes with a 1-year manufacturer warranty covering manufacturing defects.' },
  { q: 'Is this compatible with UAE plumbing standards?', a: 'Yes, this product is fully compatible with standard UAE plumbing connections.' },
  { q: 'What is the delivery time?', a: 'Standard delivery takes 2-5 business days within UAE.' },
  { q: 'Can I return the product?', a: 'Yes, we offer a 7-day return policy for unused products in original packaging.' }
];

// Enquiry Form Component
const EnquiryForm = ({ product, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    message: '',
    quantity: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/enquiry`, {
        ...formData,
        product_id: product.id
      });
      toast.success('Enquiry submitted successfully! We will contact you soon.');
      onSuccess?.();
    } catch (err) {
      toast.error('Failed to submit enquiry. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your Name *</Label>
        <Input required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Enter your full name" />
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input type="email" required value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} placeholder="your@email.com" />
      </div>
      <div className="space-y-2">
        <Label>Phone Number *</Label>
        <Input required value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} placeholder="+971 50 123 4567" />
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
      </div>
      <div className="space-y-2">
        <Label>Message (Optional)</Label>
        <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Any specific requirements or questions..." rows={3} />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold-dark text-navy-dark font-bold h-12">
        {loading ? 'Submitting...' : <><Send className="h-4 w-4 mr-2" /> Send Enquiry</>}
      </Button>
    </form>
  );
};

// Star Rating Component for Reviews
const StarRatingInput = ({ rating, setRating, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none transition-transform hover:scale-110"
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
        >
          <Star
            className={`${starSize} ${star <= (hoverRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
              }`}
          />
        </button>
      ))}
    </div>
  );
};

const StarRatingDisplay = ({ rating, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const starSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <Star className={`${starSize} fill-yellow-400/50 text-yellow-400`} />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      ))}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ productId, onSuccess, getAuthHeaders }) => {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/products/${productId}/reviews`, {
        rating,
        title: title || null,
        comment
      }, { headers: getAuthHeaders() });
      toast.success('Thank you for your review!');
      setRating(0);
      setTitle('');
      setComment('');
      onSuccess?.();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Please login to submit a review');
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error('Failed to submit review');
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-navy">Write a Review</h4>

      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <StarRatingInput rating={rating} setRating={setRating} />
      </div>

      <div className="space-y-2">
        <Label>Review Title (Optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review..."
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label>Your Review *</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={1000}
        />
      </div>

      <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-navy-dark font-semibold">
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};

// Single Review Component
const ReviewItem = ({ review }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-semibold">
            {review.user_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-navy">{review.user_name}</span>
              {review.verified_purchase && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified Purchase
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {review.title && <h5 className="font-semibold text-sm mb-1">{review.title}</h5>}
      <p className="text-sm text-gray-700">{review.comment}</p>

      {review.helpful_count > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
        </p>
      )}
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, settings: appSettings, user, getAuthHeaders } = useApp();
  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [imageZoom, setImageZoom] = useState(false);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(1);

  // Use show_prices from app settings
  const showPrices = appSettings?.show_prices !== false;

  // Fetch reviews for the product
  const fetchReviews = async (page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await axios.get(`${API}/products/${id}/reviews?page=${page}&limit=5`);
      setReviews(res.data.reviews || []);
      setRatingBreakdown(res.data.rating_breakdown || {});
      setTotalReviews(res.data.total || 0);
      setTotalReviewPages(res.data.pages || 1);
      setReviewPage(page);
    } catch (e) {
      console.error('Failed to fetch reviews');
    }
    setReviewsLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, settingsRes] = await Promise.all([
          axios.get(`${API}/products/${id}`),
          axios.get(`${API}/settings`)
        ]);
        setProduct(productRes.data);
        setSettings(settingsRes.data);

        if (productRes.data.category) {
          const relatedRes = await axios.get(`${API}/products?category=${productRes.data.category}&limit=4`);
          setRelatedProducts(relatedRes.data.products?.filter(p => p.id !== id) || []);
        }

        // Fetch reviews
        fetchReviews(1);
      } catch (e) {
        toast.error('Product not found');
      }
      setLoading(false);
    };
    fetchData();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-48 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/products">
          <Button className="mt-4 bg-gold text-navy-dark">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const hasOffer = product.offer_price && product.offer_price < product.price;
  const displayPrice = hasOffer ? product.offer_price : product.price;
  const discount = hasOffer ? Math.round((1 - product.offer_price / product.price) * 100) : 0;
  const productImages = product.images?.length > 0 ? product.images : ["https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600"];

  // Check if both payment methods are disabled
  const paymentDisabled = !settings.payment_enabled && !settings.cod_enabled;

  // Use admin-defined content or defaults
  const highlights = product.highlights?.length > 0 ? product.highlights : defaultHighlights;
  const specifications = product.specifications && Object.keys(product.specifications).length > 0
    ? { ...defaultSpecifications, ...product.specifications, 'Brand': product.brand || 'Grand Palace', 'Model / SKU': product.sku }
    : { ...defaultSpecifications, 'Brand': product.brand || 'Grand Palace', 'Model / SKU': product.sku };
  const boxContents = product.box_contents?.length > 0 ? product.box_contents : defaultBoxContents;
  const faqs = product.faqs?.length > 0 ? product.faqs : defaultFaqs;

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    toast.success('Added to cart successfully!');
  };

  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-gold">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-gold">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-navy font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Product Media */}
          <div className="space-y-4">
            <div
              className="relative aspect-square rounded-xl overflow-hidden bg-white border cursor-zoom-in group"
              onClick={() => setImageZoom(true)}
            >
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {showPrices && hasOffer && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white text-lg px-4 py-2 font-bold">
                  {discount}% OFF
                </Badge>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
                  className={`p-2 rounded-full bg-white shadow-md transition-colors ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-navy"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute bottom-4 right-4 p-2 rounded-full bg-white/80 text-gray-500">
                <ZoomIn className="h-5 w-5" />
              </div>
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-gold ring-2 ring-gold/30' : 'border-gray-200 hover:border-gold'
                      }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-navy font-medium">{product.brand || 'Grand Palace'}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">SKU: {product.sku}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-navy leading-tight">
                  {product.name}
                </h1>
                {product.name_ar && (
                  <p className="text-lg text-gold font-arabic mt-2" dir="rtl">{product.name_ar}</p>
                )}
              </div>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 gap-2 border-navy text-navy hover:bg-navy hover:text-white"
                  onClick={() => navigate(`/admin/products?edit=${product.id}`)}
                >
                  <Edit className="h-4 w-4" /> Edit Product
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={product.average_rating || 0} size="md" />
              <span className="text-sm text-muted-foreground">
                ({(product.average_rating || 0).toFixed(1)}) {product.review_count || 0} {(product.review_count || 0) === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              {showPrices ? (
                <>
                  <div className="flex items-end gap-4">
                    <span className="text-4xl font-bold text-navy" data-testid="product-price">AED {displayPrice?.toFixed(2)}</span>
                    {hasOffer && (
                      <>
                        <span className="text-xl text-muted-foreground line-through">AED {product.price?.toFixed(2)}</span>
                        <Badge className="bg-green-500 text-white">Save AED {(product.price - product.offer_price).toFixed(2)}</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Inclusive of VAT</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-amber-600" />
                    <span className="text-2xl font-bold text-amber-600" data-testid="request-quote-label">Request Quote for Pricing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Add to inquiry and we'll send you a quotation</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {product.stock > 10 ? (
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="h-5 w-5" /> In Stock - Ready to Ship
                  </span>
                ) : product.stock > 0 ? (
                  <span className="flex items-center gap-2 text-orange-500 font-medium">
                    <AlertCircle className="h-5 w-5" /> Only {product.stock} left!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-500 font-medium">
                    <X className="h-5 w-5" /> Out of Stock
                  </span>
                )}
              </div>

              {product.stock > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center border-2 border-gray-200 rounded-lg">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-100">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:bg-gray-100">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Show Add to Cart buttons always - enquiry happens at checkout */}
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      className="flex-1 bg-gold hover:bg-gold-dark text-navy-dark font-bold h-14 text-lg"
                      onClick={handleAddToCart}
                      data-testid="add-to-cart-btn"
                    >
                      {showPrices ? (
                        <><ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart</>
                      ) : (
                        <><MessageSquare className="h-5 w-5 mr-2" /> Add to Inquiry</>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 border-2 border-navy text-navy hover:bg-navy hover:text-white font-bold h-14 text-lg"
                      onClick={handleBuyNow}
                    >
                      {showPrices ? 'Buy Now' : 'Get Quote'}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-green-600 font-medium">
                    {!showPrices ? 'Add to inquiry and submit for a quotation' : paymentDisabled ? 'Add to cart and submit enquiry at checkout' : 'Order within 2 hours for same-day dispatch'}
                  </p>
                </div>
              )}
            </div>

            {/* Trust Elements - Infographic Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-navy">Free Delivery</p>
                  <p className="text-sm text-muted-foreground">Orders above AED 500</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-navy">Secure Payment</p>
                  <p className="text-sm text-muted-foreground">100% Protected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gold/10 to-gold/20 rounded-xl border border-gold/30">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                  <Award className="h-6 w-6 text-navy-dark" />
                </div>
                <div>
                  <p className="font-bold text-navy">Authentic Product</p>
                  <p className="text-sm text-muted-foreground">Brand Warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-navy">After-Sales Support</p>
                  <p className="text-sm text-muted-foreground">Expert Assistance</p>
                </div>
              </div>
            </div>

            {/* Product Highlights - Infographic Style */}
            <div className="bg-gradient-to-br from-navy/5 to-navy/10 rounded-xl p-6 border">
              <h3 className="font-bold text-navy mb-4 flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-6 w-6 text-gold" /> Product Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-6 py-4">
                Description
              </TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-6 py-4">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-6 py-4">
                Reviews ({product.review_count || 0})
              </TabsTrigger>
              <TabsTrigger value="delivery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-6 py-4">
                Delivery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-navy mb-4">Product Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || `Experience premium quality with the ${product.name}. Designed for the modern UAE home and commercial spaces, this product combines durability with elegant aesthetics.`}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-navy/5 to-transparent rounded-xl p-6">
                  <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                    <Box className="h-5 w-5 text-gold" /> What's Included
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {boxContents.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-navy mb-6">Technical Specifications</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(specifications).map(([key, value], idx) => (
                    <div key={key} className={`flex items-center justify-between p-4 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white border'}`}>
                      <span className="font-medium text-navy">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              <div className="max-w-4xl">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Rating Summary */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                      <h3 className="text-xl font-bold text-navy mb-4">Customer Reviews</h3>

                      <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-navy">{product.average_rating?.toFixed(1) || '0.0'}</div>
                        <div className="flex justify-center my-2">
                          <StarRatingDisplay rating={product.average_rating || 0} size="lg" />
                        </div>
                        <p className="text-sm text-muted-foreground">Based on {product.review_count || 0} reviews</p>
                      </div>

                      {/* Rating Breakdown */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingBreakdown[String(star)] || 0;
                          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="w-3">{star}</span>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="w-8 text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reviews List & Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Write Review Section */}
                    {user ? (
                      <ReviewForm
                        productId={id}
                        onSuccess={() => {
                          fetchReviews(1);
                          // Refresh product to get updated rating
                          axios.get(`${API}/products/${id}`).then(res => setProduct(res.data));
                        }}
                        getAuthHeaders={getAuthHeaders}
                      />
                    ) : (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <a href="/login" className="font-semibold text-blue-600 hover:underline">Login</a> to write a review for this product.
                        </p>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div>
                      <h4 className="font-semibold text-navy mb-4">
                        {totalReviews > 0 ? `${totalReviews} Reviews` : 'No Reviews Yet'}
                      </h4>

                      {reviewsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="space-y-2">
                                  <div className="h-4 w-24 bg-gray-200 rounded" />
                                  <div className="h-3 w-32 bg-gray-200 rounded" />
                                </div>
                              </div>
                              <div className="h-16 bg-gray-200 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : reviews.length > 0 ? (
                        <>
                          <div className="space-y-0">
                            {reviews.map((review) => (
                              <ReviewItem key={review.id} review={review} />
                            ))}
                          </div>

                          {/* Pagination */}
                          {totalReviewPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={reviewPage <= 1}
                                onClick={() => fetchReviews(reviewPage - 1)}
                              >
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {reviewPage} of {totalReviewPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={reviewPage >= totalReviewPages}
                                onClick={() => fetchReviews(reviewPage + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No reviews yet. Be the first to review this product!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="mt-6">
              <div className="max-w-2xl space-y-6">
                <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gold" /> Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center">
                    <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-bold text-navy">All UAE</p>
                    <p className="text-sm text-muted-foreground">Emirates covered</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center">
                    <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-navy">2-5 Days</p>
                    <p className="text-sm text-muted-foreground">Standard delivery</p>
                  </div>
                  <div className="bg-gradient-to-br from-gold/20 to-gold/30 rounded-xl p-5 text-center">
                    <RefreshCw className="h-8 w-8 text-gold mx-auto mb-2" />
                    <p className="font-bold text-navy">7-Day Returns</p>
                    <p className="text-sm text-muted-foreground">Easy returns</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gold" /> Frequently Asked Questions
          </h3>
          <div className="max-w-3xl space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="border rounded-xl group bg-white shadow-sm">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-navy font-medium hover:text-gold">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 transform group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-muted-foreground border-t pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-navy">Related Products</h3>
              <Link to={`/products?category=${product.category}`} className="text-gold hover:text-gold-dark font-medium flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {imageZoom && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImageZoom(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gold"
            onClick={() => setImageZoom(false)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={productImages[selectedImage]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
