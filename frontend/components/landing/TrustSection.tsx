'use client';

export default function TrustSection() {
  const certifications = [
    {
      name: 'SOC 2 Type II',
      description: 'Audited security controls',
      icon: '🛡️'
    },
    {
      name: 'COPPA Compliant',
      description: 'Child privacy protection',
      icon: '👶'
    },
    {
      name: 'ISO 27001',
      description: 'Information security',
      icon: '🔐'
    },
    {
      name: 'GDPR Ready',
      description: 'Data protection compliant',
      icon: '🇪🇺'
    }
  ];

  const securityFeatures = [
    {
      title: 'Enterprise Security',
      items: [
        '256-bit SSL encryption',
        'Multi-factor authentication',
        'Role-based access control',
        'IP whitelisting available'
      ]
    },
    {
      title: 'Data Protection',
      items: [
        'Daily automated backups',
        '99.9% uptime SLA',
        'Disaster recovery plan',
        'Data residency options'
      ]
    },
    {
      title: 'Privacy First',
      items: [
        'Complete data isolation',
        'No third-party sharing',
        'Parent consent workflows',
        'Right to deletion'
      ]
    },
    {
      title: 'Compliance',
      items: [
        'Regular security audits',
        'Penetration testing',
        'Compliance reporting',
        'Audit trail logging'
      ]
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bank-Level Security for Educational Data
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We take the security and privacy of your institution's data seriously. 
            Built with enterprise-grade security from day one.
          </p>
        </div>

        {/* Certifications */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {certifications.map((cert, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{cert.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cert.name}</h3>
              <p className="text-sm text-gray-600">{cert.description}</p>
            </div>
          ))}
        </div>

        {/* Security Features Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Comprehensive Security Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((category, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {category.title}
                </h4>
                <ul className="space-y-2">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-gray-600 text-sm flex items-start">
                      <span className="text-emerald-500 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 lg:p-12 text-white">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Trusted Infrastructure
              </h3>
              <p className="text-blue-100 mb-6">
                Our platform is built on world-class infrastructure providers, ensuring your data is always secure, 
                available, and compliant with international standards.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-blue-200">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-blue-200">Security Breaches</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-blue-200">Monitoring</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">15min</div>
                  <div className="text-blue-200">RTO/RPO</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                    <div className="flex-1 h-3 bg-white/20 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                    <div className="flex-1 h-3 bg-white/20 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                    <div className="flex-1 h-3 bg-white/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Awards */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">Recognized for Excellence</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-gray-400">
              <div className="font-semibold">EdTech Award</div>
              <div className="text-sm">2024 Winner</div>
            </div>
            <div className="text-gray-400">
              <div className="font-semibold">Best Islamic App</div>
              <div className="text-sm">Innovation Prize</div>
            </div>
            <div className="text-gray-400">
              <div className="font-semibold">Parent's Choice</div>
              <div className="text-sm">Gold Award</div>
            </div>
            <div className="text-gray-400">
              <div className="font-semibold">Teacher Approved</div>
              <div className="text-sm">5 Star Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}