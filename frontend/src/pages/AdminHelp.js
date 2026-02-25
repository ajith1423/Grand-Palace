import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, FileText, ImageIcon, Star, PlusCircle, Trash2, Edit, ChevronDown, ChevronRight, CheckCircle2, ArrowRight, LayoutDashboard, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const HelpTopic = ({ item, isExpanded, onToggle }) => {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-4 shadow-sm transition-all hover:border-gold/50">
            <button
                onClick={onToggle}
                className="w-full text-left px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                        {item.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.shortDesc}</p>
                    </div>
                </div>
                <div className="text-gray-400">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
            </button>

            {isExpanded && (
                <div className="px-6 py-6 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-6">
                        {item.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-shrink-0 flex flex-col items-center">
                                    <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold shadow-md">
                                        {idx + 1}
                                    </div>
                                    {idx !== item.steps.length - 1 && (
                                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                    )}
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-1 relative top-[-4px]">
                                    <h4 className="font-semibold text-navy mb-1">{step.title}</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{step.content}</p>

                                    {step.actionLink && (
                                        <div className="mt-4">
                                            <Link to={step.actionLink} className="inline-flex items-center gap-2 text-sm font-bold text-navy bg-gold hover:bg-gold-dark px-4 py-2 rounded-md transition-colors shadow-sm">
                                                <span>{step.actionLabel || 'Go there now'}</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    )}

                                    {step.note && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 flex gap-2">
                                            <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>{step.note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        <p>You're all done!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const guideData = [
    {
        id: 'understand-dashboard',
        icon: <LayoutDashboard />,
        title: 'How to Understand the Main Dashboard',
        shortDesc: 'A quick tour of your main dashboard and what the big numbers mean.',
        keywords: ['dashboard', 'home', 'stats', 'metrics', 'overview', 'numbers', 'revenue'],
        steps: [
            {
                title: 'Open the Dashboard',
                content: 'From the left sidebar, click on "Dashboard" under the Shop Management section at the very top.',
                actionLink: '/admin',
                actionLabel: 'Go to Dashboard'
            },
            {
                title: 'Look at the Big Numbers (Summary Cards)',
                content: 'At the very top of your dashboard, you will see a row of 5 big white cards with numbers on them:\n\n1. Total Products: How many items you have actively listed in your store.\n2. Orders: The total number of purchases customers have made.\n3. Pending: Orders that have been placed but not shipped yet.\n4. Customers: How many people have created accounts on your site.\n5. Total Revenue: The total amount of money your store has earned (in AED)!'
            },
            {
                title: 'Check the Quick Links',
                content: 'Below the numbers, you will find 5 large square buttons with icons (Products, Orders, Categories, Customers, Settings). These are "Quick Links." You can click any of them to instantly jump straight to those sections of the store!'
            }
        ]
    },
    {
        id: 'use-reports',
        icon: <ClipboardList />,
        title: 'How to Generate and Use Reports',
        shortDesc: 'Learn how to see your sales trends and find your best-selling items.',
        keywords: ['reports', 'analytics', 'data', 'charts', 'sales', 'trends', 'money', 'business'],
        steps: [
            {
                title: 'Open the Reports Module',
                content: 'From the left sidebar, scroll down to the "ERP / FINANCE" section and click on "Reports".',
                actionLink: '/admin/erp/reports',
                actionLabel: 'Go to Reports Page'
            },
            {
                title: 'Choose a Date Range',
                content: 'At the top of the reports page, there are buttons for quickly checking your data over the "Last 7 Days", "Last 30 Days", "This Year", or "All Time". Click one of these buttons to filter the information!'
            },
            {
                title: 'Read the Performance Summary',
                content: 'Directly below the date buttons, you will see summary boxes. These tell you exactly how many orders came in and how much money you made *during the dates you just selected*.'
            },
            {
                title: 'Looking at the Sales Charts',
                content: 'The screen will show two large graphs:\n\n• Order Volume Chart (Left): A bar chart showing you which specific days or months you got the most orders.\n• Revenue Trends (Right): A line graph that tracks how much money you made over time. Watch for the peaks!'
            },
            {
                title: 'Finding Your Best Sellers',
                content: 'At the bottom of the page, there is a table called "Top Products & Revenue Distribution". This helps you instantly see which items are your best sellers and exactly how much revenue each item is bringing in!',
            }
        ]
    },
    {
        id: 'add-product',
        icon: <PlusCircle />,
        title: 'How to Add a New Product',
        shortDesc: 'Step-by-step instructions for adding a single item to your store.',
        keywords: ['create', 'new', 'add', 'item', 'product'],
        steps: [
            {
                title: 'Open the Products Page',
                content: 'From the left sidebar, click on "Products" under the Shop Management section.',
                actionLink: '/admin/products',
                actionLabel: 'Go to Products Page'
            },
            {
                title: 'Click "Add Product"',
                content: 'Look for the gold "Add Product" button at the top right of the page and click it. A form will appear.',
            },
            {
                title: 'Fill out the Basic Info',
                content: 'Enter the Name, SKU (a unique code for the product like GPGT-001), Description, Price, and Stock quantity. Make sure to select the correct Category from the dropdown menu.',
            },
            {
                title: 'Upload Product Images',
                content: 'Click on the "Images" tab at the top of the form. You can drag and drop your image files directly into the dotted box, or click the box to browse your computer. The first image you upload will be the main picture shown to customers.'
            },
            {
                title: 'Add Details (Optional but Recommended)',
                content: 'Click the "Content" tab to add Highlights (bullet points), Specifications, What\'s in the Box, and FAQs. These help customers understand your product better.'
            },
            {
                title: 'Save the Product',
                content: 'Once you are finished, click the gold "Save Product" button at the bottom. Your product is now live on the store!',
                note: 'If you want to hide the product temporarily, you can turn off the "Active" switch in the Basic Info tab before saving.'
            }
        ]
    },
    {
        id: 'upload-images',
        icon: <ImageIcon />,
        title: 'How to Upload and Reorganize Images',
        shortDesc: 'Learn how to add multiple photos to a product.',
        keywords: ['picture', 'photo', 'image', 'upload', 'gallery', 'main', 'cover'],
        steps: [
            {
                title: 'Edit a Product',
                content: 'Go to the Products page, find your product in the list, and click the small "pencil" icon on the right side of its row.',
                actionLink: '/admin/products',
                actionLabel: 'Go to Products Page'
            },
            {
                title: 'Go to the Images Tab',
                content: 'Click on the "Images" tab at the top of the editing form.'
            },
            {
                title: 'Add New Images',
                content: 'Drag your new photos into the large dotted box. A green popup will confirm when they finish uploading.'
            },
            {
                title: 'Set the Main Image',
                content: 'Your uploaded pictures will appear in a grid at the bottom. If you want to change the primary image (the one shown on the homepage), hover your mouse over the picture you want and click the dark "Set as Main" button that appears. This moves it to the front of the line.'
            },
            {
                title: 'Remove an Image',
                content: 'Hover over the picture you want to delete and click the small red trash can icon in the top right corner of that picture.'
            },
            {
                title: 'Save Changes',
                content: 'Do not forget to click the "Save Product" button at the very bottom when you are finished!'
            }
        ]
    },
    {
        id: 'delete-product',
        icon: <Trash2 />,
        title: 'How to Edit or Delete a Product',
        shortDesc: 'Update details or remove a product entirely from your store.',
        keywords: ['edit', 'change', 'update', 'delete', 'remove', 'trash'],
        steps: [
            {
                title: 'Find the Product',
                content: 'Go to the Products page. You can use the Search bar at the top to type in the product name or SKU to find it quickly.',
                actionLink: '/admin/products',
                actionLabel: 'Go to Products Page'
            },
            {
                title: 'Editing a Product',
                content: 'To change details like the price or name, click the gray pencil icon on the right side of the product row. The form will open up. Make your changes, and click "Save Product".'
            },
            {
                title: 'Deleting a Product',
                content: 'To permanently remove a product, click the red Trash Can icon on the right side of its row. A confirmation box will pop up asking "Delete this product?".'
            },
            {
                title: 'Confirm Deletion',
                content: 'Click "OK". The product will disappear from your store immediately.',
                note: 'Warning: Deleting a product cannot be undone. If you only want to hide it temporarily, Edit the product and turn off the "Active" toggle instead.'
            }
        ]
    },
    {
        id: 'featured-products',
        icon: <Star />,
        title: 'How to Choose Featured Products',
        shortDesc: 'Select which items show up on the homepage "Featured" section.',
        keywords: ['feature', 'star', 'highlight', 'homepage', 'popular'],
        steps: [
            {
                title: 'Open the Featured Products Page',
                content: 'From the left sidebar, click on "Featured Products" under the Shop Management section.',
                actionLink: '/admin/featured',
                actionLabel: 'Go to Featured Products Page'
            },
            {
                title: 'Add a New Featured Item',
                content: 'Click the gold "Add Featured Product" button. A window will pop up showing all the products currently in your catalog.'
            },
            {
                title: 'Search and Select',
                content: 'Use the search box in the popup to find the item you want. Once you see it, click the dark "Add" button next to it.'
            },
            {
                title: 'Upload a Special Banner (Optional)',
                content: 'Featured items on the homepage look best with a wide lifestyle photo. Once you add it to the featured list, find it in the table and click the gray "Upload Hero" dotted box in the middle to upload a wide banner picture.'
            },
            {
                title: 'Remove a Featured Item',
                content: 'If you want to take a product off the homepage (but keep it in your store), find it in the Featured Products list and click the red trash can icon on the far right. This removes its "star" status.',
                note: 'Removing an item from the Featured list does NOT delete the actual product from your store.'
            }
        ]
    },
    {
        id: 'hero-slides',
        icon: <FileText />,
        title: 'How to Manage the Home Page Hero Banners',
        shortDesc: 'Add or remove the large sliding images at the very top of your website.',
        keywords: ['hero', 'banner', 'slider', 'carousel', 'top', 'header', 'picture'],
        steps: [
            {
                title: 'Open Settings',
                content: 'From the left sidebar, click on "General" under the SETTINGS section at the bottom.'
            },
            {
                title: 'Navigate to Hero Slides',
                content: 'In the settings panel, click on the "Hero Slides" tab.',
                actionLink: '/admin/settings',
                actionLabel: 'Go to Settings Page'
            },
            {
                title: 'Add a New Slide',
                content: 'Click the "Add Slide" button. A new empty row will appear.'
            },
            {
                title: 'Upload the Banner Image',
                content: 'Click the dark dotted box on the left side of the new row that says "Upload" to select a picture from your computer.'
            },
            {
                title: 'Fill in the Text',
                content: 'Give your slide a Title (e.g. "Summer Sale") and a Subtitle. Finally, add the link for where the button should take the user—for example, type "/products" to send them to the shop page.'
            },
            {
                title: 'Save Changes',
                content: 'Click the gold "Save Slide Changes" button at the bottom of the list. If you do not click this, your new banner will not be saved!',
                note: 'You can remove a slide by clicking the red X icon in its top right corner.'
            }
        ]
    }
];

const AdminHelp = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(guideData[0].id); // Expand first by default

    const filteredGuides = guideData.filter(guide => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        return (
            guide.title.toLowerCase().includes(query) ||
            guide.shortDesc.toLowerCase().includes(query) ||
            guide.keywords.some(k => k.toLowerCase().includes(query)) ||
            guide.steps.some(step =>
                step.title.toLowerCase().includes(query) ||
                step.content.toLowerCase().includes(query)
            )
        );
    });

    return (
        <AdminLayout title="Help & Guide" subtitle="Step-by-step instructions for managing your store">
            <div className="max-w-4xl mx-auto pb-12">
                {/* Header & Search */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-gold/10 rounded-full mb-4">
                        <HelpCircle className="h-10 w-10 text-gold" />
                    </div>
                    <h1 className="text-3xl font-bold text-navy mb-4">How can we help you today?</h1>

                    <div className="relative max-w-xl mx-auto shadow-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search for 'add product', 'upload image', or 'delete'..."
                            className="w-full pl-12 pr-4 py-6 text-lg rounded-xl border-gray-200 focus:border-gold focus:ring-gold focus:ring-2 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Results Info */}
                {searchQuery && (
                    <p className="text-sm text-gray-500 mb-4 px-2">
                        Found {filteredGuides.length} matching {filteredGuides.length === 1 ? 'guide' : 'guides'}
                    </p>
                )}

                {/* Guides Accordion List */}
                <div className="space-y-4">
                    {filteredGuides.length > 0 ? (
                        filteredGuides.map((guide) => (
                            <HelpTopic
                                key={guide.id}
                                item={guide}
                                isExpanded={expandedId === guide.id}
                                onToggle={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
                            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-navy">No matching guides found</h3>
                            <p className="text-gray-500">Try using different keywords or simpler terms like 'add' or 'image'.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 text-gold hover:text-gold-dark font-medium underline"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>

                {/* Support Section */}
                <Card className="mt-12 bg-navy text-white overflow-hidden border-none shadow-xl">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                        <div className="flex-1 relative z-10">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gold" />
                                Still need assistance?
                            </h3>
                            <p className="text-gray-300 text-sm">
                                If you couldn't find the answer you need in these guides, please reach out to the technical support team or the development administrator.
                            </p>
                        </div>

                        <div className="relative z-10 flex-shrink-0">
                            <a href="mailto:admin@gpgt.ae" className="inline-flex items-center justify-center bg-gold hover:bg-gold-light text-navy-dark px-6 py-3 rounded-lg font-bold transition-colors">
                                Contact Support
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminHelp;
