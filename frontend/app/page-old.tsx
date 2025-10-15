'use client';

import './homepage.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// AuthModal removed - using /login and /register pages instead
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

  // Auth removed - using dedicated /login and /register pages

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 text-gray-900 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-green-50/50 to-yellow-50/50" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="particles opacity-30">{particles}</div>
      </div>

      {/* Futuristic Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <div className="relative">
                <h1 className="text-3xl font-bold text-gray-800">
                  <span className="text-green-600">Quran</span>
                  <span className="text-blue-600">Akh</span>
                </h1>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
              <a href="#workflows" className="text-gray-700 hover:text-green-600 transition-colors">Workflows</a>
              <a href="#testimonials" className="text-gray-700 hover:text-green-600 transition-colors">Success Stories</a>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-gray-700 border-2 border-gray-300 bg-white rounded-full hover:border-green-500 hover:text-green-600 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full hover:scale-105 transition-transform shadow-md"
                >
                  Register School
                </button>
                <div className="relative group">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all flex items-center text-gray-700">
                    <Users className="w-4 h-4 mr-2" />
                    Login
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 text-green-600 flex items-center"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Teacher Login
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 flex items-center border-t border-gray-200"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Student Login
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 text-purple-600 flex items-center border-t border-gray-200"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Parent Login
                    </button>
                  </div>
                </div>
              </div>
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
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-md p-6 space-y-4 border-b border-gray-200 shadow-lg">
            <a href="#features" className="block text-gray-700 hover:text-green-600">Features</a>
            <a href="#workflows" className="block text-gray-700 hover:text-green-600">Workflows</a>
            <a href="#testimonials" className="block text-gray-700 hover:text-green-600">Success Stories</a>

            <div className="pt-4 border-t border-gray-300 space-y-3">
              <button
                onClick={() => {
                  router.push('/register');
                  setMobileMenu(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-md"
              >
                Register School
              </button>
              <button
                onClick={() => {
                  router.push('/login');
                  setMobileMenu(false);
                }}
                className="w-full py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600"
              >
                School Login
              </button>
              <button
                onClick={() => {
                  router.push('/login');
                  setMobileMenu(false);
                }}
                className="w-full py-3 text-green-700 bg-white border border-green-400 rounded-lg hover:bg-green-50"
              >
                Teacher Login
              </button>
              <button
                onClick={() => {
                  router.push('/login');
                  setMobileMenu(false);
                }}
                className="w-full py-3 text-blue-700 bg-white border border-blue-400 rounded-lg hover:bg-blue-50"
              >
                Student Login
              </button>
              <button
                onClick={() => {
                  router.push('/login');
                  setMobileMenu(false);
                }}
                className="w-full py-3 text-purple-700 bg-white border border-purple-400 rounded-lg hover:bg-purple-50"
              >
                Parent Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Floating Quran Verses - Left Side - Optimal Distance */}
        <div className="absolute left-8 top-1/3 w-1/5 space-y-8 pl-4 hidden lg:block">
          <div className="text-3xl text-green-600/20 font-bold transform -rotate-6 animate-pulse" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            وَإِنَّهُ لَكِتَابٌ عَزِيزٌ
          </div>
          <div className="text-2xl text-blue-600/20 font-semibold transform rotate-3" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            لَا يَأْتِيهِ الْبَاطِلُ
          </div>
          <div className="text-xl text-yellow-600/20 font-medium transform -rotate-3 animate-pulse" style={{ fontFamily: 'serif', direction: 'rtl', animationDelay: '2s' }}>
            كِتَابٌ أُحْكِمَتْ آيَاتُهُ
          </div>
          <div className="text-2xl text-green-600/15 font-bold transform rotate-6" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            تَنزِيلٌ مِّنْ حَكِيمٍ حَمِيدٍ
          </div>
        </div>

        {/* Floating Quran Verses - Right Side - Optimal Distance */}
        <div className="absolute right-8 top-1/3 w-1/5 space-y-8 pr-4 hidden lg:block text-right">
          <div className="text-3xl text-blue-600/20 font-bold transform rotate-6 animate-pulse" style={{ fontFamily: 'serif', direction: 'rtl', animationDelay: '1s' }}>
            إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي
          </div>
          <div className="text-2xl text-green-600/20 font-semibold transform -rotate-3" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            لِلَّتِي هِيَ أَقْوَمُ
          </div>
          <div className="text-xl text-yellow-600/20 font-medium transform rotate-3 animate-pulse" style={{ fontFamily: 'serif', direction: 'rtl', animationDelay: '3s' }}>
            شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ
          </div>
          <div className="text-2xl text-blue-600/15 font-bold transform -rotate-6" style={{ fontFamily: 'serif', direction: 'rtl' }}>
            هُدًى لِّلنَّاسِ
          </div>
        </div>

        {/* Additional Decorative Elements */}
        <div className="absolute left-10 bottom-1/4 text-4xl text-green-600/10 font-bold transform rotate-12" style={{ fontFamily: 'serif' }}>
          ﷽
        </div>
        <div className="absolute right-10 bottom-1/4 text-4xl text-blue-600/10 font-bold transform -rotate-12" style={{ fontFamily: 'serif' }}>
          ﷽
        </div>

        {/* Top Floating Verses */}
        <div className="absolute top-32 left-1/4 text-2xl text-yellow-600/15 font-semibold transform rotate-6" style={{ fontFamily: 'serif', direction: 'rtl' }}>
          يَا أَيُّهَا الَّذِينَ آمَنُوا
        </div>
        <div className="absolute top-32 right-1/4 text-2xl text-green-600/15 font-semibold transform -rotate-6" style={{ fontFamily: 'serif', direction: 'rtl' }}>
          اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ
        </div>

        {/* Bottom Floating Verses */}
        <div className="absolute bottom-32 left-1/3 text-xl text-blue-600/10 font-medium transform -rotate-3" style={{ fontFamily: 'serif', direction: 'rtl' }}>
          وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا
        </div>
        <div className="absolute bottom-32 right-1/3 text-xl text-green-600/10 font-medium transform rotate-3" style={{ fontFamily: 'serif', direction: 'rtl' }}>
          وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Floating Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-6 animate-float shadow-lg border border-yellow-300">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-700">Trusted by 50,000+ Islamic Schools Worldwide</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="block text-gray-800">Revolutionary</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              Quran Education Platform
            </span>
          </h1>

          {/* Quran Verses Instead of Description */}
          <div className="mb-8 max-w-3xl mx-auto">
            {/* Quran Page Container */}
            <div className="relative bg-gradient-to-br from-yellow-50 to-green-50 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400 shadow-xl">
              {/* Top Corner Decoration */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-yellow-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-yellow-500 rounded-tr-xl" />

              <div className="text-center space-y-6" style={{ fontFamily: 'serif', direction: 'rtl' }}>
                {/* Bismillah */}
                <div className="text-2xl md:text-3xl text-green-700 font-bold">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>

                {/* Decorative Separator */}
                <div className="flex justify-center items-center space-x-3">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-600 to-transparent" />
                  <div className="text-yellow-600 text-lg">❋</div>
                  <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-yellow-600 to-transparent" />
                </div>

                {/* Selected Verses */}
                <div className="text-xl md:text-2xl text-gray-800 leading-relaxed font-semibold space-y-2">
                  <div>إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div>
                  <div className="text-sm md:text-base text-gray-600 italic" style={{ direction: 'ltr' }}>
                    "We sent down the Quran and will preserve it"
                  </div>
                  <div className="text-xs text-gray-500" style={{ direction: 'ltr' }}>- Surah Al-Hijr 15:9 -</div>
                </div>

                {/* Another Verse */}
                <div className="text-lg md:text-xl text-gray-700 leading-relaxed font-semibold space-y-1 pt-3">
                  <div>وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ</div>
                  <div className="text-sm text-gray-600 italic" style={{ direction: 'ltr' }}>
                    "We made the Quran easy to remember"
                  </div>
                  <div className="text-xs text-gray-500" style={{ direction: 'ltr' }}>- Al-Qamar 54:17 -</div>
                </div>
              </div>

              {/* Bottom Corner Decoration */}
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-yellow-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-yellow-500 rounded-br-xl" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push('/login')}
              className="group px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-full text-lg font-semibold hover:scale-105 transition-all shadow-lg text-white"
            >
              <span className="flex items-center justify-center">
                Start Your School
                <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white border-2 border-gray-300 rounded-full text-lg font-semibold hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center text-gray-700 shadow-md"
            >
              <Lock className="mr-2" />
              Sign In
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center mb-1">
                  {stat.icon}
                  <span className="ml-2">{stat.value}</span>
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                Enterprise Features
              </span>
            </h2>
            <p className="text-xl text-gray-600">Powered by cutting-edge technology</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer ${
                  activeFeature === i ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Seamless Workflows
              </span>
            </h2>
            <p className="text-xl text-gray-600">From onboarding to mastery in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflows.map((workflow, i) => (
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{workflow.title}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm border border-green-300">
                    {workflow.time}
                  </span>
                </div>
                <div className="space-y-4">
                  {workflow.steps.map((step, j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                        {j + 1}
                      </div>
                      <span className="text-gray-700 flex-1">{step}</span>
                      {j < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
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
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 text-gray-700">"{testimonial.quote}"</p>
                <div>
                  <div className="font-bold text-gray-800">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Access Your Dashboard
              </span>
            </h2>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>

          {/* Auth Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* School Admin Card - Full Access */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-yellow-300 shadow-lg relative overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-bl-xl border-l border-b border-yellow-300">
                FULL ACCESS
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">School Administrator</h3>
              <p className="text-gray-600 mb-6">Complete control over your institution</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Create School Account</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Manage All Users</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Full Analytics Access</span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full text-sm text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Teacher Card - Login Only */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-green-300 shadow-lg relative overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-bl-xl border-l border-b border-green-300">
                LOGIN ONLY
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Teacher</h3>
              <p className="text-gray-600 mb-6">Manage your classes and students</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Quran Teaching Tools</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Student Progress Tracking</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Assignment Management</span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
                >
                  Teacher Login
                </button>
                <p className="text-xs text-center text-gray-500">
                  Credentials provided by your school admin
                </p>
              </div>
            </div>

            {/* Student Card - Login Only */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-blue-300 shadow-lg relative overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-bl-xl border-l border-b border-blue-300">
                LOGIN ONLY
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Student</h3>
              <p className="text-gray-600 mb-6">Access your learning dashboard</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>View Assignments</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Track Your Progress</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Submit Work</span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
                >
                  Student Login
                </button>
                <p className="text-xs text-center text-gray-500">
                  Use credentials from your teacher
                </p>
              </div>
            </div>

            {/* Parent Card - Login Only */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-purple-300 shadow-lg relative overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-bl-xl border-l border-b border-purple-300">
                LOGIN ONLY
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Parent</h3>
              <p className="text-gray-600 mb-6">Monitor your children's progress</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>View Children's Progress</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Communicate with Teachers</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span>Track Attendance</span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
                >
                  Parent Login
                </button>
                <p className="text-xs text-center text-gray-500">
                  Access provided by school
                </p>
              </div>
            </div>

            {/* Demo Access Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-cyan-300 shadow-lg relative overflow-hidden lg:col-span-2 hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-bl-xl border-l border-b border-cyan-300">
                DEMO MODE
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Try Demo Mode</h3>
              <p className="text-gray-600 mb-6">Explore all dashboards without signing up</p>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/school-dashboard')}
                  className="py-2 px-4 bg-white border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-all text-sm text-gray-700"
                >
                  Demo as School Admin
                </button>
                <button
                  onClick={() => router.push('/teacher-dashboard')}
                  className="py-2 px-4 bg-white border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-all text-sm text-gray-700"
                >
                  Demo as Teacher
                </button>
                <button
                  onClick={() => router.push('/student-dashboard')}
                  className="py-2 px-4 bg-white border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-all text-sm text-gray-700"
                >
                  Demo as Student
                </button>
                <button
                  onClick={() => router.push('/parent-dashboard')}
                  className="py-2 px-4 bg-white border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-all text-sm text-gray-700"
                >
                  Demo as Parent
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-300 shadow-lg">
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-green-600 mt-1 mr-3" />
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Enterprise Security</h4>
                  <p className="text-sm text-gray-600">
                    All data is encrypted with bank-level security. Multi-factor authentication available.
                    GDPR compliant with complete data isolation between schools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-16 relative overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50" />
            <div className="relative z-10">
              <h2 className="text-5xl font-bold mb-6 text-gray-800">
                Ready to Transform Your School?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join 50,000+ schools already using QuranAkh
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/school-dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full text-lg font-semibold hover:scale-105 transition-all text-white shadow-lg"
                >
                  Start Free Trial
                </button>
                <button className="px-8 py-4 bg-white border border-gray-300 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all text-gray-700">
                  Schedule Demo
                </button>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                No credit card required • Free 30-day trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">QuranAkh</h3>
              <p className="text-gray-600">The future of Islamic education</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-800">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-800">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-800">Connect</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-600">
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

      {/* Auth Modal removed - using /login and /register pages */}
    </div>
  );
}