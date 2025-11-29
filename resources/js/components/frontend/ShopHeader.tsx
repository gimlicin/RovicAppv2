import { useState, useEffect } from "react";
import {
  ShoppingBag,
  User,
  ChevronDown,
  Plus,
  Minus,
  X,
  Search,
  HelpCircle,
  Settings,
  LogOut,
  Bell,
  Package,
  LayoutDashboard,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePage, router } from "@inertiajs/react";
import { useCart } from "@/contexts/CartContext";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationSidebar from "./NotificationSidebar";
import SearchBar from "./SearchBar";
const route = (window as any).route || ((name: string) => name);

// ShopHeader component with integrated cart functionality

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PageProps {
  auth: {
    user: User | null;
  };
  [key: string]: any;
}

export default function ShopHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { auth, filters = {} } = usePage<PageProps>().props || {};
  const { totalItems, toggleCart } = useCart();
  const { unreadCount, toggleNotifications } = useNotifications();

  // Track scroll position for styling changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout - exempt from CSRF so it always works
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Use Inertia's post method for logout
    // This will properly handle the redirect and prevent contexts from reloading
    router.post(route('logout'), {}, {
      onFinish: () => {
        // Redirect to home after logout completes
        window.location.href = '/';
      }
    });
  };


  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled ? "bg-white dark:bg-black shadow-md" : "bg-white dark:bg-black"
      }`}
    >
      <div className="container mx-auto">
        <div className="flex h-20 items-center justify-between px-4 md:px-6">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative h-8 w-40">
                <div className="flex items-center">
                  <span className="text-1xl font-bold tracking-tight">
                    Rovic Meat Products
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Search bar - directly in the navbar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar 
              initialValue={filters?.search || ''}
              placeholder="Search products, brands and categories"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-6">
            {/* Authentication Section */}
            {auth?.user ? (
              // Profile Dropdown for authenticated users
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-sm border border-[#19140035] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b] bg-transparent hover:bg-gray-100 transition-colors cursor-pointer">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">
                    {auth.user.name}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {auth.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {auth.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Admin & Super Admin quick links */}
                  {(auth.user.role === 'admin' || auth.user.role === 'super_admin') && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={route('admin.dashboard')} className="flex items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={route('admin.orders.index')} className="flex items-center">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Manage Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Customer menu items (shown for all users) */}
                  <DropdownMenuItem asChild>
                    <Link href={route('orders.customer')} className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={route('profile.edit')} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Settings - only for non-admin users */}
                  {auth.user.role !== 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href={route('profile.edit')} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Login button for guests
              <Link
                href={route('login')}
                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
              >
                Login
              </Link>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={toggleNotifications}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Shopping Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={toggleCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <svg
                    width="18"
                    height="11"
                    viewBox="0 0 18 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 0.5H18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M0 5.5H18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M0 10.5H18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search" className="pl-9" />
                  </div>
                  <nav className="grid gap-2">
                    <Link
                      href="#"
                      className="flex items-center justify-between py-2 text-base font-medium"
                    >
                      New Arrivals <ChevronDown className="h-4 w-4" />
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center justify-between py-2 text-base font-medium"
                    >
                      Women <ChevronDown className="h-4 w-4" />
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center justify-between py-2 text-base font-medium"
                    >
                      Men <ChevronDown className="h-4 w-4" />
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center justify-between py-2 text-base font-medium"
                    >
                      Accessories <ChevronDown className="h-4 w-4" />
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center justify-between py-2 text-base font-medium"
                    >
                      Collections <ChevronDown className="h-4 w-4" />
                    </Link>
                  </nav>
                  <div className="border-t pt-4 mt-6">
                    <nav className="grid gap-1">
                      <Link href="#" className="text-sm py-2">
                        Account
                      </Link>
                      <Link href="#" className="text-sm py-2">
                        Wishlist
                      </Link>
                      <Link href="#" className="text-sm py-2">
                        Order Tracking
                      </Link>
                      <Link href="#" className="text-sm py-2">
                        Help & Contact
                      </Link>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Notification Sidebar */}
      <NotificationSidebar />
    </header>
  );
}
