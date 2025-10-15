'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeaturesSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('school');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const features = {
    school: {
      title: 'School Administration',
      subtitle: 'Complete Digital Infrastructure for Islamic Education',
      icon: '🏫',
      color: 'blue',
      mainFeatures: [
        {
          icon: '📊',
          title: 'Comprehensive Analytics Dashboard',
          description: 'Real-time insights into student progress, teacher performance, and class metrics with exportable reports.'
        },
        {
          icon: '👥',
          title: 'Bulk User Management',
          description: 'Import hundreds of students and teachers via CSV. Automated class assignments and role management.'
        },
        {
          icon: '🔒',
          title: 'Enterprise-Grade Security',
          description: 'Complete data isolation with Row Level Security. COPPA compliant with comprehensive audit trails.'
        },
        {
          icon: '📅',
          title: 'Intelligent Scheduling',
          description: 'Automated class scheduling, session management, and conflict resolution with calendar integration.'
        }
      ],
      capabilities: [
        'Multi-tenant architecture with complete data isolation',
        'Role-based access control (RBAC) system',
        'Automated backup and disaster recovery',
        'Custom branding and white-label options',
        'API access for third-party integrations',
        'Compliance with educational data standards'
      ]
    },
    teacher: {
      title: 'Teacher Tools',
      subtitle: 'Professional-Grade Annotation and Assessment Platform',
      icon: '👨‍🏫',
      color: 'emerald',
      mainFeatures: [
        {
          icon: '✏️',
          title: 'Advanced PDF Annotation',
          description: 'Mark corrections, highlight achievements, and add contextual notes directly on Quran pages with ultra-high resolution.'
        },
        {
          icon: '📝',
          title: 'Smart Notes System',
          description: 'Create public and private notes with rich formatting. Auto-categorization and searchable history.'
        },
        {
          icon: '📈',
          title: 'Progress Tracking',
          description: 'Visual progress charts, milestone tracking, and automated parent communication for achievements.'
        }
      ],
      capabilities: [
        'Instant page rendering with 8x pixel density',
        'Three-tool annotation system (correct/mistake/highlight)',
        'Offline mode with automatic sync',
        'Voice recording and playback integration',
        'Customizable assessment rubrics',
        'Batch operations for multiple students'
      ]
    },
    parent: {
      title: 'Parent Portal',
      subtitle: 'Stay Connected with Your Child\'s Quran Journey',
      icon: '👨‍👩‍👧',
      color: 'purple',
      mainFeatures: [
        {
          icon: '👀',
          title: 'Real-Time Progress Viewing',
          description: 'See exactly what your child is learning with annotated pages and teacher feedback updated instantly.'
        },
        {
          icon: '📱',
          title: 'Mobile-First Experience',
          description: 'Access from any device with responsive design. Native mobile apps for iOS and Android coming soon.'
        },
        {
          icon: '🎯',
          title: 'Milestone Celebrations',
          description: 'Receive notifications for achievements. Share progress with family members securely.'
        },
        {
          icon: '💬',
          title: 'Teacher Communication',
          description: 'View teacher notes and feedback. Schedule virtual meetings directly through the platform.'
        }
      ],
      capabilities: [
        'Child-safe environment with privacy controls',
        'Multiple children management in one account',
        'Progress comparison with anonymized peers',
        'Downloadable progress reports',
        'Practice recommendations for home',
        'Achievement badges and rewards system'
      ]
    }
  };

  const currentFeature = features[activeTab as keyof typeof features];

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(key);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Every User
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Purpose-built tools designed specifically for Islamic education, combining traditional teaching methods with modern technology.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-xl shadow-lg p-1 border border-gray-100">
            {Object.entries(features).map(([key, feature]) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-105'
                }`}
                style={{ minWidth: '160px' }}
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2 text-lg">{feature.icon}</span>
                  <span>{feature.title}</span>
                </span>
                {activeTab === key && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Content */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 lg:p-12 transition-all duration-300 ${
          isTransitioning ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
        }`}>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                activeTab === 'school' ? 'bg-blue-100' :
                activeTab === 'teacher' ? 'bg-emerald-100' :
                'bg-purple-100'
              }`}>
                {currentFeature.icon}
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{currentFeature.title}</h3>
            </div>
            <p className="text-lg text-gray-600">{currentFeature.subtitle}</p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {currentFeature.mainFeatures.map((feature, idx) => (
              <div key={`${activeTab}-${idx}`} 
                className="flex space-x-4 hover:bg-gray-50 p-4 rounded-lg transition-colors cursor-default"
                style={{ 
                  animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`
                }}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    activeTab === 'school' ? 'bg-blue-100' :
                    activeTab === 'teacher' ? 'bg-emerald-100' :
                    'bg-purple-100'
                  }`}>
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Capabilities */}
          <div className="border-t pt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Capabilities</h4>
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {currentFeature.capabilities.map((capability, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{capability}</span>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-6 border-t">
              <button 
                onClick={() => {
                  const routes = {
                    school: '/admin/dashboard',
                    teacher: '/teacher/dashboard',
                    parent: '/parent/dashboard'
                  };
                  router.push(routes[activeTab as keyof typeof routes]);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'school' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg' 
                  : activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg'
              }`}>
                {activeTab === 'school' ? '🚀 Try Admin Demo' : 
                 activeTab === 'teacher' ? '✏️ Try Teacher Demo' : 
                 '👀 View Parent Portal'}
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-all">
                📹 Watch Video Tour
              </button>
              <button className="px-6 py-3 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                Learn More →
              </button>
            </div>
          </div>
        </div>

        {/* Integration Section */}
        <div className="mt-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 lg:p-12 text-white">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Seamless Integrations</h3>
              <p className="text-emerald-50 mb-6">
                Connect Quran Mate with your existing tools and workflows. Our platform integrates with popular educational and communication tools.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <span>📧</span>
                  </div>
                  <span>Email Systems</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <span>📅</span>
                  </div>
                  <span>Calendar Apps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <span>💬</span>
                  </div>
                  <span>WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <span>🔄</span>
                  </div>
                  <span>API Access</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative grid grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-white/10 backdrop-blur rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}