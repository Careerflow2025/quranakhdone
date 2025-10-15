'use client';

interface CTASectionProps {
  onStart: () => void;
}

export default function CTASection({ onStart }: CTASectionProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Quran Education?
        </h2>
        <p className="text-xl text-emerald-50 mb-8 leading-relaxed">
          Join thousands of schools worldwide who are already using Quran Mate to deliver 
          exceptional Islamic education. Start your free 30-day trial today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
          >
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all border-2 border-emerald-400">
            Schedule Demo
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-emerald-100">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>30-day free trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}