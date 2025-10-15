'use client';
import { useState } from 'react';

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Sheikh Abdullah Rahman',
      role: 'Principal, Al-Noor Academy',
      location: 'London, UK',
      image: '👨‍🏫',
      rating: 5,
      quote: 'Quran Mate has revolutionized how we manage our Hifz program. The annotation tools are incredibly precise, and parents love the real-time progress updates. We\'ve seen a 40% improvement in student retention.',
      stats: { students: '500+', improvement: '40%' }
    },
    {
      name: 'Ustadha Fatima Al-Zahra',
      role: 'Senior Teacher, Baitul Hikmah',
      location: 'Dubai, UAE',
      image: '👩‍🏫',
      rating: 5,
      quote: 'The annotation tools save me hours every week. I can focus on teaching while the platform handles the administrative work. My students\' recitation accuracy has improved significantly.',
      stats: { timeSaved: '10hrs/week', accuracy: '+35%' }
    },
    {
      name: 'Ahmad Hassan',
      role: 'Parent of 3 Students',
      location: 'Toronto, Canada',
      image: '👨',
      rating: 5,
      quote: 'As a working parent, I struggled to keep track of my children\'s Quran progress. Now I can see their daily achievements, teacher notes, and even practice with them using the annotated pages.',
      stats: { children: '3', engagement: 'Daily' }
    },
    {
      name: 'Dr. Mariam Ibrahim',
      role: 'Director, Islamic Learning Center',
      location: 'California, USA',
      image: '👩',
      rating: 5,
      quote: 'We evaluated 5 different platforms before choosing Quran Mate. The security features, multi-tenant architecture, and comprehensive analytics made it the clear choice for our 12 branches.',
      stats: { branches: '12', students: '2000+' }
    }
  ];

  const caseStudies = [
    {
      title: 'Al-Furqan Academy Success Story',
      metric: '65%',
      description: 'Increase in Hifz completion rate',
      details: '300 students, 6-month implementation'
    },
    {
      title: 'Madinah Institute Transformation',
      metric: '3x',
      description: 'Faster progress tracking',
      details: 'Reduced admin time by 75%'
    },
    {
      title: 'Global Quran Network',
      metric: '15',
      description: 'Countries connected',
      details: '5000+ students worldwide'
    }
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Success Stories from Our Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how schools, teachers, and parents are transforming Quran education with our platform
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Testimonial Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <blockquote className="text-xl text-gray-700 italic leading-relaxed">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{testimonials[activeTestimonial].image}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</p>
                  <p className="text-gray-600">{testimonials[activeTestimonial].role}</p>
                  <p className="text-sm text-gray-500">{testimonials[activeTestimonial].location}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-gray-900">Key Metrics</h4>
              {Object.entries(testimonials[activeTestimonial].stats).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-bold text-emerald-600">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTestimonial === idx 
                    ? 'w-8 bg-emerald-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Case Studies */}
        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((study, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-3">{study.title}</h3>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{study.metric}</div>
              <p className="text-gray-700 mb-2">{study.description}</p>
              <p className="text-sm text-gray-500">{study.details}</p>
            </div>
          ))}
        </div>

        {/* Video Testimonial CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Watch Video Testimonials</h3>
          <p className="text-emerald-50 mb-6">See how real schools are using Quran Mate to transform their teaching</p>
          <button className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
            Watch Success Stories
          </button>
        </div>
      </div>
    </section>
  );
}