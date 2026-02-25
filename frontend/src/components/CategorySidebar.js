import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CategorySidebar = ({ categories, allCategoriesFlat, categoryId, onCategoryChange }) => {
    const [expandedCategories, setExpandedCategories] = useState({});

    // Auto-expand the parent category when a subcategory is selected
    useEffect(() => {
        if (categoryId && allCategoriesFlat) {
            const cat = allCategoriesFlat.find(c => c.id === categoryId);
            if (cat && cat.parent_id) {
                setExpandedCategories(prev => ({ ...prev, [cat.parent_id]: true }));
            } else if (cat && !cat.parent_id) {
                setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
            }
        }
    }, [categoryId, allCategoriesFlat]);

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-lg">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-1">
                <button
                    onClick={() => onCategoryChange(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!categoryId ? 'bg-gold/10 text-gold font-medium' : 'hover:bg-muted'}`}
                >
                    All Products
                </button>
                {categories.map(cat => (
                    <CategoryItem
                        key={cat.id}
                        category={cat}
                        categoryId={categoryId}
                        expanded={expandedCategories[cat.id]}
                        onToggle={() => toggleCategory(cat.id)}
                        onSelect={onCategoryChange}
                    />
                ))}
            </CardContent>
        </Card>
    );
};

const CategoryItem = ({ category, categoryId, expanded, onToggle, onSelect }) => {
    return (
        <div>
            <div className="flex items-center">
                <button
                    onClick={() => onSelect(category.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg font-semibold text-sm ${categoryId === category.id ? 'bg-gold/10 text-gold' : 'text-navy hover:bg-muted'
                        }`}
                >
                    {category.name}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({category.total_product_count || category.product_count || 0})
                    </span>
                </button>
                {category.children && category.children.length > 0 && (
                    <button onClick={onToggle} className="p-1 hover:bg-muted rounded">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            {expanded && category.children && category.children.length > 0 && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                    {category.children.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => onSelect(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${categoryId === sub.id ? 'bg-gold/10 text-gold font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {sub.name}
                            {sub.product_count > 0 && <span className="ml-1">({sub.product_count})</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategorySidebar;
