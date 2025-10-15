'use client';
import { useEffect, useRef, useState } from 'react';

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      number: 50000,
      suffix: '+',
      label: 'Active Students',
      description: 'Learning Quran daily',
      icon: '📚',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      number: 2500,
      suffix: '+',
      label: 'Certified Teachers',
      description: 'Expert instructors',
      icon: '👨‍🏫',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      number: 500,
      suffix: '+',
      label: 'Partner Schools',
      description: 'Across 45 countries',
      icon: '🏫',
      color: 'from-purple-500 to-pink-600'
    },
    {
      number: 98,
      suffix: '%',
      label: 'Satisfaction Rate',
      description: 'From user surveys',
      icon: '⭐',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const Counter = ({ end, suffix }: { end: number; suffix: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let startTime: number | null = null;
      const duration = 2000;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        setCount(Math.floor(progress * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [isVisible, end]);

    return (
      <span className="text-4xl font-bold">
        {count.toLocaleString()}{suffix}
      </span>
    );
  };

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Islamic Institutions Worldwide
          </h2>
          <p className="text-lg text-gray-600">
            Join thousands of schools transforming Quran education with digital innovation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div className="relative inline-block mb-4">
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative w-20 h-20 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
              <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                <Counter end={stat.number} suffix={stat.suffix} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{stat.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 mb-6">Trusted by leading Islamic educational institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Al-Azhar', 'Darul Uloom', 'Islamic Foundation', 'Muslim Academy', 'Quran Institute'].map((name, idx) => (
              <div key={idx} className="text-gray-400 font-semibold text-lg">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}