"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CreditCard,
  Truck,
  Shield,
  Headphones,
} from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterData {
  siteName: string;
  footerLinks: FooterLink[];
  socialLinks: FooterLink[];
  showFooterSocial: boolean;
}

export default function Footer() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<FooterData>({
    siteName: "Roboshop",
    footerLinks: [],
    socialLinks: [],
    showFooterSocial: true,
  });

  useEffect(() => {
    if (pathname?.startsWith("/dashboard")) return;
    let canceled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/settings");
        if (!res.ok) return;
        const s = await res.json();
        if (!canceled)
          setData({
            siteName: s?.siteName || "Roboshop",
            footerLinks: s?.navigation?.footerLinks || [],
            socialLinks: s?.navigation?.socialLinks || [],
            showFooterSocial: s?.ui?.showFooterSocial !== false,
          });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      canceled = true;
    };
  }, [pathname]);

  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <footer className="bg-gray-100 text-gray-600">
      {/* Features bar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Free Shipping
                </h4>
                <p className="text-xs text-gray-500">On orders over ৳5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-600/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Quality Guarantee
                </h4>
                <p className="text-xs text-gray-500">100% Original products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Secure Payment
                </h4>
                <p className="text-xs text-gray-500">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  24/7 Support
                </h4>
                <p className="text-xs text-gray-500">Dedicated support team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              {data.siteName}
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Your trusted source for robotics components, Arduino, Raspberry
              Pi, sensors, and electronics in Bangladesh.
            </p>
            <div className="space-y-2">
              <a
                href="tel:+8801700000000"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
              >
                <Phone className="w-4 h-4" />
                +880 1700-000000
              </a>
              <a
                href="mailto:info@roboshop.com"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
              >
                <Mail className="w-4 h-4" />
                info@roboshop.com
              </a>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {(data.footerLinks || []).map((l, i) => (
                <li key={i}>
                  <Link
                    href={l.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {(!data.footerLinks || data.footerLinks.length === 0) && (
                <>
                  <li>
                    <Link
                      href="/products"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?category=Arduino"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Arduino
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?category=Raspberry Pi"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Raspberry Pi
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?category=Sensors"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Sensors
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/my-orders"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Return Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Stay Connected</h3>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe to get updates on new products and special offers.
            </p>
            <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 h-10 px-4 text-sm bg-white border border-gray-300 rounded-l-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>

            {data.showFooterSocial && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Follow Us
                </h4>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-pink-600 hover:text-white transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} {data.siteName}. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <img
                src="https://cdn-icons-png.flaticon.com/32/349/349221.png"
                alt="Visa"
                className="h-6 opacity-60"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/32/349/349228.png"
                alt="MasterCard"
                className="h-6 opacity-60"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/32/5968/5968428.png"
                alt="bKash"
                className="h-6 opacity-60"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/32/6124/6124998.png"
                alt="Nagad"
                className="h-6 opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
