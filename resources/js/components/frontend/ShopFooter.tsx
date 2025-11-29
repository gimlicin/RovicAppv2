import { Link } from "@inertiajs/react";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

export default function ShopFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full text-white border-t border-orange-500/70 bg-linear-to-t from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-start space-x-3">
              <div className="shrink-0">
                <img 
                  src="/images/rovic-logo.png" 
                  alt="Rovic Meat Products Logo" 
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Rovic Meat Products</h3>
                <p className="text-sm text-orange-400 font-medium">San Roque, Marikina</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              One stop shop food store - EATS MORE FUN IN THE PHILIPPINES! 
              Your trusted source for fresh, quality meat products since 2013.
            </p>
            <div className="pt-2">
              <p className="text-xs text-gray-400 font-semibold mb-2">We Accept:</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white rounded-lg px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                  <span className="text-sm font-semibold text-gray-800">GCash</span>
                </div>

                <div className="bg-white rounded-lg px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                  <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    M
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Maya</span>
                </div>

                <div className="bg-white rounded-lg px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                  <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center text-white text-[10px] font-bold">
                    BT
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Bank Transfer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-orange-500 pb-2">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    182 JP. Rizal St<br />
                    Brgy. San Roque<br />
                    Marikina City, Philippines<br />
                    1802
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-400 shrink-0" />
                <a href="tel:09365543854" className="text-gray-300 hover:text-orange-400 transition-colors">
                  0936 554 3854
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-400 shrink-0" />
                <a href="mailto:Kxrstynbasan2@gmail.com" className="text-gray-300 hover:text-orange-400 transition-colors break-all">
                  Kxrstynbasan2@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-400 shrink-0" />
                <p className="text-gray-300">
                  7:00 AM - 7:00 PM<br />
                  <span className="text-xs text-gray-400">Daily</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-orange-500 pb-2">Quick Links</h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-gray-300 hover:text-orange-400 transition-colors">
                Products
              </Link>
              <Link href="/track-order" className="text-gray-300 hover:text-orange-400 transition-colors">
                My Order
              </Link>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center text-sm md:flex-row md:justify-between">
            <p className="text-gray-400">
              © {currentYear} <span className="text-orange-400 font-semibold">Rovic Meat Products</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Serving fresh quality since 2013
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
