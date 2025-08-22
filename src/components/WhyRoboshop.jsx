import { Award, Headphones, Shield, Truck } from 'lucide-react';
import React from 'react';

const WhyRoboshop = () => {
    return (
        
      <section className="py-12 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-10 text-center">Why Roboshop?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="rounded-xl border p-6 bg-white/70">
              <Truck className="text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Fast, Reliable Shipping</h3>
              <p className="text-sm text-muted-foreground">Get your parts quickly with tracked delivery across the country.</p>
            </div>
            <div className="rounded-xl border p-6 bg-white/70">
              <Shield className="text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Quality You Can Trust</h3>
              <p className="text-sm text-muted-foreground">Sourced from trusted manufacturers with warranty support.</p>
            </div>
            <div className="rounded-xl border p-6 bg-white/70">
              <Headphones className="text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Expert Support</h3>
              <p className="text-sm text-muted-foreground">Need help? Our team can guide component selection and compatibility.</p>
            </div>
            <div className="rounded-xl border p-6 bg-white/70">
              <Award className="text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Great Value</h3>
              <p className="text-sm text-muted-foreground">Competitive pricing with frequent deals on popular components.</p>
            </div>
          </div>
        </div>
      </section>
    );
};

export default WhyRoboshop;