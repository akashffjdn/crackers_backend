// data/defaultContentData.js

// This data should match the structure of your Content model
// Use 'contentId' as the primary key string.
const defaultContentData = [
  // ===== HEADER CONTENT =====
  {
    contentId: 'companyName',
    title: 'Company Name',
    content: 'Akash Crackers',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'companyTagline',
    title: 'Company Tagline',
    content: 'Premium Sivakasi Fireworks',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'supportPhone',
    title: 'Support Phone',
    content: '+918870296456',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'headerAnnouncement',
    title: 'Header Announcement Message',
    content: '🎆 Festival Special Offers! Free Delivery on Orders Above ₹2000 🎆',
    type: 'text',
    metadata: {}
  },

  // ===== HERO SECTION CONTENT =====
  {
    contentId: 'heroTitle',
    title: 'Homepage Hero Title',
    content: 'Light Up Your Festival!', // Corrected title
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroSubtitle',
    title: 'Homepage Hero Subtitle',
    content: 'Premium quality crackers from Sivakasi. Safe, colorful, and guaranteed to make your celebrations unforgettable!',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'heroRatingText',
    title: 'Hero Rating Text',
    content: 'Rated 4.9/5 by 10,000+ customers',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroCtaPrimary',
    title: 'Hero Primary CTA',
    content: 'Shop Now 🛒',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroCtaSecondary',
    title: 'Hero Secondary CTA',
    content: 'Watch Demo',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroStat1Number',
    title: 'Hero Stat 1 Number',
    content: '500+',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroStat1Label',
    title: 'Hero Stat 1 Label',
    content: 'Products',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'heroStat2Number',
    title: 'Hero Stat 2 Number',
    content: '10K+',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'heroStat2Label',
    title: 'Hero Stat 2 Label',
    content: 'Happy Customers',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'heroStat3Number',
    title: 'Hero Stat 3 Number',
    content: '15+',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'heroStat3Label',
    title: 'Hero Stat 3 Label',
    content: 'Years Experience',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroSpecialOffer',
    title: 'Hero Special Offer Badge',
    content: '🎉 Festival Special!',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'heroImage',
    title: 'Homepage Hero Image',
    content: 'Hero Background Image Description', // Content describes the image purpose
    type: 'image',
    metadata: {
      imageUrl: 'https://static.toiimg.com/photo/msid-114651439,width-96,height-65.cms',
      altText: 'Colorful Diwali crackers and fireworks display'
    }
  },

  // ===== ABOUT SECTION CONTENT =====
  {
    contentId: 'aboutTitle',
    title: 'About Section Title',
    content: 'Celebrating Festivals for Over 15 Years',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutContent',
    title: 'About Section Content',
    content: 'Based in the heart of Sivakasi, the fireworks capital of India, we have been bringing joy and light to millions of families across the country. Our commitment to quality, safety, and customer satisfaction has made us a trusted name in the industry.',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutFeature1',
    title: 'About Feature 1',
    content: 'ISO certified manufacturing facility',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutFeature2',
    title: 'About Feature 2',
    content: 'Government licensed and approved products',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'aboutFeature3',
    title: 'About Feature 3',
    content: 'Eco-friendly and minimal smoke formulations',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutFeature4',
    title: 'About Feature 4',
    content: 'Pan India delivery network',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'aboutButtonText',
    title: 'About Button Text',
    content: 'Learn More About Us',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutBadgeText',
    title: 'About Badge Text',
    content: '🏆 Award Winning Quality',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'aboutImage',
    title: 'About Section Image',
    content: 'About Section Image Description',
    type: 'image',
    metadata: {
      imageUrl: 'https://images.cnbctv18.com/wp-content/uploads/2018/10/Firecrackers-1019x573.jpg',
      altText: 'Sivakasi crackers manufacturing'
    }
  },

   // ===== FEATURES SECTION =====
  {
    contentId: 'featuresSection',
    title: 'Features Section Title',
    content: 'Why Choose Us?', // Title stored in content for text type
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'featuresSubtitle',
    title: 'Features Section Subtitle',
    content: 'We\'re committed to making your festivals brighter and safer with our premium quality products and exceptional service.',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'featuresData',
    title: 'Features List',
    content: 'List of key selling points', // Description for admin
    type: 'features',
    metadata: {
      features: [
        { icon: 'FaShieldAlt', title: '100% Safe & Legal', description: 'All our products comply with government safety standards and regulations.' },
        { icon: 'FaTruck', title: 'Fast Delivery', description: 'Quick and secure delivery across India with proper packaging.' },
        { icon: 'FaPhone', title: '24/7 Support', description: 'Our expert team is always ready to help you with your queries.' },
        { icon: 'FaCertificate', title: 'Premium Quality', description: 'Authentic Sivakasi crackers with guaranteed quality and performance.' }
      ]
    }
  },

    // ===== HOW IT WORKS SECTION =====
  {
    contentId: 'howItWorksSection',
    title: 'How It Works Section Title',
    content: 'How It Works',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'howItWorksData',
    title: 'How It Works Steps',
    content: 'Steps for ordering',
    type: 'steps',
    metadata: {
      steps: [
        { icon: 'FaClipboardList', title: 'Browse & Select', description: 'Choose from our wide range of premium crackers and festival collections.' },
        { icon: 'FaPaperPlane', title: 'Place Order', description: 'Add to cart and complete your order with secure payment options.' },
        { icon: 'FaTrophy', title: 'Enjoy Festival', description: 'Receive your crackers and celebrate your festivals with joy and safety.' }
      ]
    }
  },

  // ===== TESTIMONIALS SECTION =====
  {
    contentId: 'testimonialsSection',
    title: 'Customer Testimonials Title',
    content: 'What Our Customers Say',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'testimonialsSubtitle',
    title: 'Testimonials Section Subtitle',
    content: 'Don\'t just take our word for it - hear from thousands of satisfied customers who trust us for their festival celebrations.',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'testimonialsData',
    title: 'Customer Testimonials',
    content: 'Collection of customer reviews',
    type: 'testimonials',
    metadata: {
      testimonials: [
        { name: "Rajesh Kumar", location: "Mumbai", rating: 5, comment: "Excellent quality crackers! The delivery was prompt and the products were exactly as described. Perfect for our Diwali celebration.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
        { name: "Priya Sharma", location: "Delhi", rating: 5, comment: "Amazing service and top-quality fireworks. The safety instructions were clear and the products were fresh. Highly recommended!", image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=100&h=100&fit=crop&crop=face" },
        { name: "Arjun Patel", location: "Bangalore", rating: 4, comment: "Good quality overall, though one rocket didn't launch properly. Delivery was quick.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" } // Example rating 4
      ]
    }
  },

   // ===== FOOTER CONTENT =====
  {
    contentId: 'footerCompanyDescription',
    title: 'Footer Company Description',
    content: 'Your trusted partner for safe, colorful, and memorable festival celebrations with premium quality crackers from Sivakasi.',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'footerNewsletterTitle',
    title: 'Footer Newsletter Title',
    content: 'Stay Updated',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'footerNewsletterDescription',
    title: 'Footer Newsletter Description',
    content: 'Subscribe to get special offers and festival updates!',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'footerCopyright',
    title: 'Footer Copyright Text',
    content: '© 2025 Akash Crackers. All rights reserved. | Licensed by Govt. of Tamil Nadu',
    type: 'text',
    metadata: {}
  },

   // ===== COMPANY INFO =====
  {
    contentId: 'companyPhone',
    title: 'Company Phone Number',
    content: '+91 88702 96456',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'companyEmail',
    title: 'Company Email',
    content: 'akashrajapa@gmail.com',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'companyAddress',
    title: 'Company Address',
    content: '123 Fireworks Street, Sivakasi, Tamil Nadu 626123',
    type: 'text',
    metadata: {}
  },

  // ===== POLICIES =====
  {
    contentId: 'shippingPolicy',
    title: 'Shipping Policy',
    content: 'Free delivery on orders above ₹2000. Standard delivery takes 3-5 business days. Express delivery available at extra cost.',
    type: 'text',
    metadata: {}
  },
  {
    contentId: 'returnPolicy',
    title: 'Return Policy',
    content: 'Returns accepted within 7 days of delivery for damaged or defective items only. Unused items can be returned under specific conditions.',
    type: 'text',
    metadata: {}
  },
  // === CTA Section ===
   {
    contentId: 'cta-title', // Use hyphenated IDs
    title: 'CTA Title',
    content: 'Ready to Light Up Your Festival?',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'cta-subtitle',
    title: 'CTA Subtitle',
    content: "Don't wait! Order your premium crackers now and make this festival unforgettable.",
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'cta-offer',
    title: 'CTA Offer Text',
    content: 'Free delivery on orders above ₹2000.',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'cta-primary-button',
    title: 'CTA Primary Button Text',
    content: 'Order Now 🛒',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'cta-secondary-button',
    title: 'CTA Secondary Button Text',
    content: 'Get Catalog 📋',
    type: 'text',
    metadata: {}
  },
   {
    contentId: 'cta-contact-info',
    title: 'CTA Contact Info Text',
    content: '📞 Call us: +91 98765 43210 | 🚚 Free delivery | 100% Safe',
    type: 'text',
    metadata: {}
  }
];

module.exports = defaultContentData;