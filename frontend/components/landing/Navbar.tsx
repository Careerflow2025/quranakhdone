'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  onAuthClick: (type: 'login' | 'signup', role?: string) => void;
}

export default function Navbar({ onAuthClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Navigation items
  const navItems = [
    { name: 'Features', href: '#features', id: 'features' },
    { name: 'Pricing', href: '#pricing', id: 'pricing' },
    { name: 'Success Stories', href: '#testimonials', id: 'testimonials' }
  ];

  useEffect(() => {
    // Handle scroll effects
    const handleScroll = () => {
      // Check if page is scrolled
      setIsScrolled(window.scrollY > 10);

      // Calculate scroll progress
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));

      // Find active section
      const sections = ['features', 'pricing', 'testimonials'];
      const scrollPosition = window.scrollY + 100; // Offset for fixed navbar

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }

      // Clear active section if at top of page
      if (window.scrollY < 100) {
        setActiveSection('');
      }
    };

    handleScroll(); // Check initial position
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false); // Close mobile menu if open
    }
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      <nav className={`fixed top-1 w-full backdrop-blur-md border-b z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 border-gray-200 shadow-sm' : 'bg-white/90 border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveSection('');
              }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <Image
                src="/quranakh-logo.png"
                alt="QuranAkh Logo"
                width={48}
                height={48}
                priority
                className="w-12 h-12 transform transition-transform hover:scale-110"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">QuranAkh</h1>
                <p className="text-xs text-gray-500 -mt-1">Quranic Education Excellence</p>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`relative font-medium transition-all duration-300 px-3 py-1.5 rounded-lg ${
                  activeSection === item.id
                    ? 'text-emerald-600 bg-emerald-50 shadow-sm'
                    : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
                {activeSection === item.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></span>
                )}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Login Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="text-gray-700 hover:text-emerald-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-1"
              >
                <span>Login</span>
                <svg className={`w-4 h-4 transition-transform ${loginDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {loginDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div className="fixed inset-0" onClick={() => setLoginDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fadeIn">
                    <button
                      onClick={() => {
                        onAuthClick('login', 'school');
                        setLoginDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🏫</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">School Admin</p>
                          <p className="text-xs text-gray-500">Manage your institution</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        onAuthClick('login', 'teacher');
                        setLoginDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">👨‍🏫</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Teacher</p>
                          <p className="text-xs text-gray-500">Access your classes</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        onAuthClick('login', 'parent');
                        setLoginDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">👨‍👩‍👧</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Parent</p>
                          <p className="text-xs text-gray-500">Track progress</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Get Started Button */}
            <button
              onClick={() => onAuthClick('signup')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-6 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`block py-2 font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-emerald-600'
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                {item.name}
                {activeSection === item.id && (
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
                )}
              </a>
            ))}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => {
                  onAuthClick('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onAuthClick('signup');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
    </>
  );
}