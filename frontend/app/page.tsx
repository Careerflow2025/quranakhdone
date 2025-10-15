'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, Users, GraduationCap, Shield, Star, ChevronRight,
  CheckCircle, TrendingUp, Award, Globe, Sparkles, ArrowRight,
  Menu, X, Play, Zap, Target, BarChart3, Clock, Heart,
  MessageCircle, Layers, Cpu, Cloud, Lock, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const stats = [
    { number: '50,000+', label: 'Active Students', icon: Users },
    { number: '1,200+', label: 'Certified Teachers', icon: GraduationCap },
    { number: '98%', label: 'Satisfaction Rate', icon: Star },
    { number: '120+', label: 'Countries', icon: Globe },
  ];

  const features = [
    {
      icon: BookOpen,
      title: '6 Quran Scripts',
      description: 'Support for Hafs, Warsh, Qaloon and more',
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: Users,
      title: 'Live Collaboration',
      description: 'Real-time teacher-student interaction',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Smart Tracking',
      description: 'AI-powered progress monitoring',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'End-to-end encryption for all data',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Smartphone,
      title: 'Works Offline',
      description: 'PWA technology for anywhere access',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Detailed insights and reports',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const testimonials = [
    {
      name: 'Fatima Al-Hassan',
      role: 'School Director',
      school: 'Al-Noor Academy',
      image: '👩‍🏫',
      quote: 'QuranAkh transformed how we teach Quran. The highlight system is revolutionary!',
      rating: 5
    },
    {
      name: 'Ahmed Ibrahim',
      role: 'Quran Teacher',
      school: 'Madinah Institute',
      image: '👨‍🏫',
      quote: 'Finally, a platform that understands how Quran education really works.',
      rating: 5
    },
    {
      name: 'Sarah Abdullah',
      role: 'Parent',
      school: 'Dubai Islamic School',
      image: '👩‍👧',
      quote: "I can track my children's progress in real-time. It's amazing!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  QuranAkh
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 transition">How it Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition">Testimonials</a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 transition">Pricing</a>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-emerald-600">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-emerald-600">How it Works</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-emerald-600">Testimonials</a>
              <a href="#pricing" className="block text-gray-700 hover:text-emerald-600">Pricing</a>

              <div className="space-y-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 1,200+ Islamic Schools Worldwide
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
                Quran Education
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
              The complete digital platform for Islamic schools. Manage students, track memorization,
              and collaborate in real-time with our revolutionary 6-color highlighting system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl text-lg px-8 py-6"
              >
                Start 30-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-500 mr-2" />
                GDPR Compliant
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-500 mr-2" />
                Setup in 5 Minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-3">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for Quran education with features that actually matter
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} mb-5`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of schools already using QuranAkh
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Your School',
                description: 'Register your school account and set up your profile in minutes',
                icon: GraduationCap
              },
              {
                step: '2',
                title: 'Add Users',
                description: 'Invite teachers, students, and parents with automated credentials',
                icon: Users
              },
              {
                step: '3',
                title: 'Start Teaching',
                description: 'Begin using our revolutionary highlighting system immediately',
                icon: BookOpen
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg h-full">
                  <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full text-2xl font-bold mb-6">
                    {item.step}
                  </div>
                  <item.icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-emerald-300" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl"
            >
              Create Your School Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Educators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what schools are saying about QuranAkh
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="flex justify-center mb-6">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>

            <blockquote className="text-2xl text-gray-800 text-center mb-8 italic">
              "{testimonials[currentTestimonial].quote}"
            </blockquote>

            <div className="flex items-center justify-center">
              <div className="text-4xl mr-4">{testimonials[currentTestimonial].image}</div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentTestimonial].role}
                </div>
                <div className="text-emerald-600">
                  {testimonials[currentTestimonial].school}
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? 'w-8 bg-emerald-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Quran School?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join 1,200+ schools already using QuranAkh. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="bg-white text-emerald-700 hover:bg-gray-100 shadow-xl text-lg px-8 py-6"
            >
              Start Free 30-Day Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Sign In to Dashboard
            </Button>
          </div>
          <p className="text-emerald-100 mt-6">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">QuranAkh</span>
              </div>
              <p className="text-sm">
                The complete digital platform for Quran education.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
                <li><a href="#" className="hover:text-white">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2024 QuranAkh. All rights reserved. Built with ❤️ for Islamic Education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}