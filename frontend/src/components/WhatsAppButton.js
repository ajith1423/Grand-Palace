import React from 'react';
import { useApp } from '@/context/AppContext';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const { settings } = useApp();
  const phone = settings.whatsapp_number?.replace(/[^0-9]/g, '') || '97144567890';

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      data-testid="whatsapp-btn"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
};

export default WhatsAppButton;
