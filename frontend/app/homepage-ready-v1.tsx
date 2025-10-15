'use client';

import './homepage.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Zap, Shield, Globe, Users, TrendingUp, Award, BookOpen,
  GraduationCap, Brain, Smartphone, Cloud, Lock, BarChart3, Play,
  CheckCircle, Star, ArrowRight, ChevronDown, Menu, X, Rocket,
  Database, Cpu, Layers, GitBranch, Activity, Target, Briefcase
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  // Generate particles
  const particles = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${20 + Math.random() * 10}s`
      }}
    />
  ));

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-level encryption with multi-factor authentication",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Learning",
      description: "Adaptive algorithms personalize each student's journey",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Scale",
      description: "Supporting 50,000+ schools across 120 countries",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "PWA Technology",
      description: "Works offline on any device, anywhere",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Infrastructure",
      description: "99.99% uptime with auto-scaling capabilities",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-time Analytics",
      description: "Comprehensive insights and predictive modeling",
      gradient: "from-teal-500 to-blue-500"
    }
  ];

  const stats = [
    { value: "50K+", label: "Schools", icon: <GraduationCap /> },
    { value: "2M+", label: "Students", icon: <Users /> },
    { value: "99.9%", label: "Uptime", icon: <Activity /> },
    { value: "4.9★", label: "Rating", icon: <Star /> }
  ];

  const workflows = [
    {
      title: "School Onboarding",
      steps: ["Register School", "Setup Classes", "Add Teachers", "Enroll Students"],
      time: "< 15 minutes"
    },
    {
      title: "Teacher Workflow",
      steps: ["Create Assignments", "Track Progress", "Provide Feedback", "Generate Reports"],
      time: "Automated"
    },
    {
      title: "Student Journey",
      steps: ["Join Class", "Learn Quran", "Submit Work", "Achieve Mastery"],
      time: "Self-paced"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="particles">{particles}</div>
      </div>

      {/* Futuristic Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 blur-lg opacity-75 animate-pulse-glow" />
                <h1 className="relative text-3xl font-bold holographic">QuranAkh</h1>
              </div>
              <span className="px-3 py-1 text-xs glass rounded-full text-green-400 border border-green-400/30">
                v3.0 Enterprise
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-green-400 transition-colors">Features</a>
              <a href="#workflows" className="hover:text-green-400 transition-colors">Workflows</a>
              <a href="#testimonials" className="hover:text-green-400 transition-colors">Success Stories</a>
              <a href="#pricing" className="hover:text-green-400 transition-colors">Pricing</a>
              <button 
                onClick={() => router.push('/school-dashboard')}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full btn-glow hover:scale-105 transition-transform"
              >
                Try Demo
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2"
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden absolute top-20 left-0 right-0 glass p-6 space-y-4">
            <a href="#features" className="block hover:text-green-400">Features</a>
            <a href="#workflows" className="block hover:text-green-400">Workflows</a>
            <a href="#testimonials" className="block hover:text-green-400">Success Stories</a>
            <button 
              onClick={() => router.push('/school-dashboard')}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg"
            >
              Try Demo
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Floating Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Trusted by 50,000+ Islamic Schools Worldwide</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="block holographic">Revolutionary</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Quran Education Platform
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Transform your Islamic school with AI-powered learning, real-time progress tracking, 
            and comprehensive management tools. Built for the future of Quranic education.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={() => router.push('/school-dashboard')}
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full text-lg font-semibold hover:scale-105 transition-all btn-glow"
            >
              <span className="flex items-center justify-center">
                Explore Live Demo
                <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => setVideoPlaying(true)}
              className="px-8 py-4 glass border border-white/20 rounded-full text-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <Play className="mr-2" />
              Watch Video Tour
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4 card-3d">
                <div className="text-3xl font-bold text-green-400 flex items-center justify-center mb-2">
                  {stat.icon}
                  <span className="ml-2">{stat.value}</span>
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>

        {/* 3D Floating Element */}
        <div className="absolute top-1/2 left-10 transform -translate-y-1/2 opacity-20">
          <div className="w-64 h-64 blob animate-morph" />
        </div>
        <div className="absolute top-1/2 right-10 transform -translate-y-1/2 opacity-20">
          <div className="w-48 h-48 blob animate-morph" style={{ animationDelay: '4s' }} />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Enterprise Features
              </span>
            </h2>
            <p className="text-xl text-gray-400">Powered by cutting-edge technology</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`glass rounded-2xl p-8 card-3d hover:bg-white/5 transition-all cursor-pointer ${
                  activeFeature === i ? 'ring-2 ring-green-400' : ''
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section id="workflows" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Seamless Workflows
              </span>
            </h2>
            <p className="text-xl text-gray-400">From onboarding to mastery in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflows.map((workflow, i) => (
              <div key={i} className="glass rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">{workflow.title}</h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    {workflow.time}
                  </span>
                </div>
                <div className="space-y-4">
                  {workflow.steps.map((step, j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                        {j + 1}
                      </div>
                      <span className="text-gray-300">{step}</span>
                      {j < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Built with Tomorrow's Technology
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: <Cpu />, name: "Next.js 14" },
              { icon: <Database />, name: "Supabase" },
              { icon: <Layers />, name: "TypeScript" },
              { icon: <GitBranch />, name: "Real-time Sync" },
              { icon: <Lock />, name: "End-to-End Encryption" },
              { icon: <Rocket />, name: "Edge Functions" }
            ].map((tech, i) => (
              <div key={i} className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform">
                <div className="text-3xl mb-3 text-green-400 flex justify-center">{tech.icon}</div>
                <span className="text-sm">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-green-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                Trusted by Leaders
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "QuranAkh transformed our school's entire approach to Quranic education. The results are phenomenal.",
                author: "Dr. Ahmad Hassan",
                role: "Principal, Al-Noor Academy",
                rating: 5
              },
              {
                quote: "The AI-powered progress tracking has revolutionized how we monitor student development.",
                author: "Fatima Al-Rashid",
                role: "Head Teacher, Baitul Hikmah",
                rating: 5
              },
              {
                quote: "Parent engagement increased by 300% after implementing QuranAkh. Simply incredible.",
                author: "Sheikh Muhammad",
                role: "Director, Darul Quran Institute",
                rating: 5
              }
            ].map((testimonial, i) => (
              <div key={i} className="glass rounded-2xl p-8">
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 text-gray-300">"{testimonial.quote}"</p>
                <div>
                  <div className="font-bold">{testimonial.author}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 animate-gradient" />
            <div className="relative z-10">
              <h2 className="text-5xl font-bold mb-6">
                Ready to Transform Your School?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join 50,000+ schools already using QuranAkh
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={() => router.push('/school-dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full text-lg font-semibold hover:scale-105 transition-all btn-glow"
                >
                  Start Free Trial
                </button>
                <button className="px-8 py-4 glass border border-white/20 rounded-full text-lg font-semibold hover:bg-white/10 transition-all">
                  Schedule Demo
                </button>
              </div>
              <p className="mt-6 text-sm text-gray-400">
                No credit card required • Free 30-day trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 holographic">QuranAkh</h3>
              <p className="text-gray-400">The future of Islamic education</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400">Features</a></li>
                <li><a href="#" className="hover:text-green-400">Pricing</a></li>
                <li><a href="#" className="hover:text-green-400">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400">About</a></li>
                <li><a href="#" className="hover:text-green-400">Blog</a></li>
                <li><a href="#" className="hover:text-green-400">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400">Contact</a></li>
                <li><a href="#" className="hover:text-green-400">Support</a></li>
                <li><a href="#" className="hover:text-green-400">Partners</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>© 2024 QuranAkh. All rights reserved. Built with ❤️ for the Ummah</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {videoPlaying && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6" onClick={() => setVideoPlaying(false)}>
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => setVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-green-400"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">Video Demo Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}