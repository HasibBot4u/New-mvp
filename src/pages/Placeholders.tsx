const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-surface-dark">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-text-primary mb-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{title}</h1>
      <p className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এই পেজটির কাজ চলছে...</p>
    </div>
  </div>
);

export const ShopPage = () => <PlaceholderPage title="শপ" />;
export const AboutPage = () => <PlaceholderPage title="আমাদের সম্পর্কে" />;
export const SuccessStoriesPage = () => <PlaceholderPage title="সাফল্য" />;
export const ContactPage = () => <PlaceholderPage title="যোগাযোগ" />;
export const PrivacyPage = () => <PlaceholderPage title="প্রাইভেসি পলিসি" />;
export const TermsPage = () => <PlaceholderPage title="শর্তাবলী" />;
export const RefundPage = () => <PlaceholderPage title="রিফান্ড পলিসি" />;
