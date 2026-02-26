import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';

const Footer = () => {
  const { settings, categories } = useApp();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-navy text-white border-t border-gold">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-6">
              <img
                src={settings?.logo || '/logo1.jpeg'}
                alt="Grand Palace Logo"
                className="h-16 w-auto object-contain bg-white p-2 rounded-lg"
              />
            </div>
            <p className="text-gray-400 mb-4">Your trusted partner in construction materials and general trading across UAE.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.id}`} className="text-gray-400 hover:text-gold transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-gold transition-colors">All Products</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-gold transition-colors">Shopping Cart</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-gold transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-gold transition-colors">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-5 w-5 text-gold shrink-0" />
                {settings.company_address || 'Shop No:3 Al Sajaya Building, Al Qusais 2, Damascus St.  244, Sector, Dubai, United Arab Emirates'}
              </p>
              <a href={`tel:${settings.company_mobile || '+971545680916'}`} className="flex items-center gap-2 text-gray-400 hover:text-gold" title="Mobile">
                <Phone className="h-5 w-5 text-gold shrink-0" />
                {settings.company_mobile || '+971 54 568 0916'}
              </a>
              <a href={`tel:${settings.company_phone || '+97142727815'}`} className="flex items-center gap-2 text-gray-400 hover:text-gold" title="Landline">
                <Phone className="h-5 w-5 text-gold shrink-0" />
                {settings.company_phone || '+971 4 272 7815'}
              </a>
              <a href={`mailto:sales@gpgt.ae`} className="flex items-center gap-2 text-gray-400 hover:text-gold">
                <Mail className="h-5 w-5 text-gold shrink-0" />
                {settings.company_email || 'sales@gpgt.ae'}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-navy-light py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2025 Grand Palace General Trading. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/profile.php?id=61587535891263" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/grandpalace.ae?igsh=MWdtaThhcTd6dG5oeA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/grand-palace-general-trading-llc-2904063a8?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://www.youtube.com/channel/UCINXOBFtfMPvDSsXRMJM48w" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="YouTube">
              <Youtube className="h-5 w-5" />
            </a>
            <a href="https://x.com/GrandPalace2022" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="X (Twitter)">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://www.tiktok.com/@grandpalace.ae?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" title="TikTok">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>

          <p className="text-gray-500 text-sm">TRN: {settings.company_trn || 'TRN123456789'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
