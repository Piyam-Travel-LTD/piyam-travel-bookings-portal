export const OFFICE_SUPPORT = Object.freeze({
  email: 'info@piyamtravel.com',
  phoneDisplay: '+44 7400 828212',
  phoneDial: '+447400828212',
  whatsAppUrl: 'https://wa.me/447400828212'
});

export const CONTACT_UPDATE_WHATSAPP_URL =
  `${OFFICE_SUPPORT.whatsAppUrl}?text=${encodeURIComponent('Hello, I would like to update my contact details for my travel package.')}`;
