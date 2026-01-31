'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Network,
  Database,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  UserCircle,
  Bell,
  HelpCircle,
  Mail,
  ChevronDown,
  Search,
  History,
  FileText,
  BookOpen,
  Award,
  Globe,
  DollarSign,
  Phone,
  Info,
  Sparkles
} from 'lucide-react';

// Dashboard navigation
const dashboardNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Graph Explorer', href: '/graph', icon: Network },
  { name: 'Connections', href: '/connections', icon: Database },
];

// Landing page navigation
const landingNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Features', href: '/features', icon: Sparkles },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Contact', href: '/contact', icon: Phone },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if we're in dashboard section
  const isDashboardPage = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/graph') || 
                         pathname.startsWith('/connections') || 
                         pathname.startsWith('/analytics') ||
                         pathname === '/profile' ||
                         pathname === '/settings';

  const currentNavigation = isDashboardPage ? dashboardNavigation : landingNavigation;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't show navbar on login page
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const user = session?.user;
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
  };

  const ProfileDropdown = () => (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50">
      {/* User Info Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name}
                className="h-10 w-10 rounded-full border object-cover border-gray-300"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                user?.role === 'admin' 
                  ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {user?.role === 'admin' ? 'Administrator' : 'Researcher'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="py-1">
        {!isDashboardPage && (
          <Link 
            href="/dashboard" 
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setProfileDropdownOpen(false)}
          >
            <Home className="h-4 w-4 mr-3 text-gray-500" />
            Go to Dashboard
          </Link>
        )}
        
        <Link 
          href="/dashboard/profile" 
          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => setProfileDropdownOpen(false)}
        >
          <UserCircle className="h-4 w-4 mr-3 text-gray-500" />
          View Profile
        </Link>
        
        <Link 
          href="/account/settings" 
          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => setProfileDropdownOpen(false)}
        >
          <Settings className="h-4 w-4 mr-3 text-gray-500" />
          Account Settings
        </Link>
        
        {isDashboardPage && (
          <Link 
            href="/research/library" 
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setProfileDropdownOpen(false)}
          >
            <BookOpen className="h-4 w-4 mr-3 text-gray-500" />
            Research Library
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100"></div>

      {/* Help Section */}
      <div className="py-1">
        <Link 
          href="/help" 
          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => setProfileDropdownOpen(false)}
        >
          <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
          Help & Support
        </Link>
        
        {isDashboardPage && (
          <Link 
            href="/documentation" 
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setProfileDropdownOpen(false)}
          >
            <FileText className="h-4 w-4 mr-3 text-gray-500" />
            Documentation
          </Link>
        )}
        
        <Link 
          href="/feedback" 
          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => setProfileDropdownOpen(false)}
        >
          <Mail className="h-4 w-4 mr-3 text-gray-500" />
          Send Feedback
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100"></div>

      {/* Logout */}
      <div className="p-2">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );

  // Right side content for logged in users
  const LoggedInContent = () => (
    <div className="flex items-center space-x-3">
      {/* Quick Actions (only in dashboard) */}
      {isDashboardPage && (
        <>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
            <Search className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-gray-800 rounded-full"></span>
          </button>
        </>
      )}

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center space-x-2 p-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <div className="flex items-center space-x-2">
            <div className="relative">
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name}
                  className="h-9 w-10 rounded-full border object-cover border-gray-300"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
            <div className="hidden md:block text-sm text-gray-700">
              {user?.name}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
            profileDropdownOpen ? 'rotate-180' : ''
          }`} />
        </button>
        
        {profileDropdownOpen && <ProfileDropdown />}
      </div>
    </div>
  );

  // Right side content for logged out users
  const LoggedOutContent = () => (
    <div className="flex items-center space-x-4">
      <Link
        href="/login"
        className="text-gray-700 hover:text-gray-900 text-sm font-medium"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium"
      >
        Get Started
      </Link>
    </div>
  );

  // Mobile menu content
  const MobileMenuContent = () => (
    <div className="sm:hidden bg-white border-b border-gray-200">
      <div className="pt-2 pb-3 space-y-1">
        {currentNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center pl-3 pr-4 py-3 text-base font-medium ${
                isActive
                  ? 'bg-gray-50 text-gray-900 border-l-4 border-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      {/* Mobile auth section */}
      <div className="pt-4 pb-3 border-t border-gray-200 px-4">
        {isLoggedIn ? (
          <>
            <div className="flex items-center">
              <div className="relative">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name}
                    className="h-10 w-10 rounded-full border border-gray-300"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              {!isDashboardPage && (
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              )}
              <Link 
                href="/dashboard/profile" 
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                View Profile
              </Link>
              <Link 
                href="/settings" 
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-200"
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full text-center px-4 py-2 bg-gray-900 text-white text-base font-medium hover:bg-gray-800 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex">
            <Link href={'/'} className="flex-shrink-0 flex items-center">
              <Network className="h-8 w-8 text-gray-800" />
              <span className="ml-2 text-xl font-bold text-gray-900">ATDL</span>
              {isDashboardPage && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                  Research Platform
                </span>
              )}
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {currentNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-gray-900 border-b-2 border-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 border-b-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? <LoggedInContent /> : <LoggedOutContent />}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && <MobileMenuContent />}
    </nav>
  );
}