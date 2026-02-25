import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Heart, Eye, MessageSquare, Star, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const StarRating = ({ rating, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

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

const ProductCard = ({ product, index = 0, forceShowPrice = false }) => {
  const { addToCart, settings, user } = useApp();
  const navigate = useNavigate();
  const showPrices = forceShowPrice || settings?.show_prices !== false;
  const hasOffer = product.offer_price && product.offer_price < product.price;
  const displayPrice = hasOffer ? product.offer_price : product.price;
  const discount = hasOffer ? Math.round((1 - product.offer_price / product.price) * 100) : 0;

  return (
    <Card
      className="product-card group overflow-hidden animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/products/${product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        {showPrices && hasOffer && (
          <Badge className="absolute top-2 left-2 badge-sale text-white">{discount}% OFF</Badge>
        )}

        {/* Action Icons - Always visible on hover */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-white hover:bg-gold hover:text-navy-dark shadow-md"
            onClick={(e) => { e.stopPropagation(); }}
            data-testid={`wishlist-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-white hover:bg-gold hover:text-navy-dark shadow-md"
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
            data-testid={`quick-view-${product.id}`}
            title="Quick View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {user?.role === 'admin' && (
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 bg-navy text-white hover:bg-gold hover:text-navy-dark shadow-md"
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/products?edit=${product.id}`); }}
              data-testid={`admin-edit-${product.id}`}
              title="Edit Product (Admin)"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Add to Cart / Request Quote Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            size="sm"
            className="w-full bg-gold hover:bg-gold-dark text-navy-dark font-semibold"
            onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
            data-testid={`add-to-cart-${product.id}`}
          >
            {showPrices ? (
              <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>
            ) : (
              <><MessageSquare className="h-4 w-4 mr-2" /> Add to Inquiry</>
            )}
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.brand || 'General'}</p>
        <h3 className="font-semibold text-navy line-clamp-2 mb-2 group-hover:text-gold transition-colors">{product.name}</h3>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating rating={product.average_rating || 0} />
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>
        )}

        {/* Price Section - Conditional */}
        {showPrices ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gold" data-testid={`price-${product.id}`}>AED {displayPrice?.toFixed(2)}</span>
            {hasOffer && (
              <span className="text-sm text-muted-foreground line-through">AED {product.price?.toFixed(2)}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-600" data-testid={`request-quote-${product.id}`}>Request Quote</span>
          </div>
        )}

        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-orange-500 mt-1">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-1">Out of Stock</p>
        )}
      </CardContent>
    </Card>
  );
};

export { StarRating };
export default ProductCard;
