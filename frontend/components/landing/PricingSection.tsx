'use client';
import { useState } from 'react';

interface PricingSectionProps {
  onSelectPlan: () => void;
}

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small madrasahs and new schools',
      monthlyPrice: 99,
      annualPrice: 79,
      color: 'gray',
      features: [
        { text: 'Up to 50 students', included: true },
        { text: '5 teacher accounts', included: true },
        { text: 'Basic annotation tools', included: true },
        { text: 'Parent portal access', included: true },
        { text: 'Email support', included: true },
        { text: 'Monthly progress reports', included: true },
        { text: 'Custom branding', included: false },
        { text: 'API access', included: false }
      ],
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      description: 'Most popular for established institutions',
      monthlyPrice: 299,
      annualPrice: 249,
      color: 'emerald',
      popular: true,
      features: [
        { text: 'Up to 500 students', included: true },
        { text: 'Unlimited teachers', included: true },
        { text: 'Advanced annotation suite', included: true },
        { text: 'Parent & student portals', included: true },
        { text: 'Priority support', included: true },
        { text: 'Real-time analytics', included: true },
        { text: 'Custom branding', included: true },
        { text: 'API access', included: false }
      ],
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      description: 'For large schools and multi-branch networks',
      monthlyPrice: 999,
      annualPrice: 799,
      color: 'purple',
      features: [
        { text: 'Unlimited students', included: true },
        { text: 'Unlimited everything', included: true },
        { text: 'Full feature access', included: true },
        { text: 'White-label options', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Advanced AI features', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Full API access', included: true }
      ],
      cta: 'Contact Sales'
    }
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const savings = (plan: typeof plans[0]) => {
    return (plan.monthlyPrice - plan.annualPrice) * 12;
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your institution. All plans include a 30-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Annual
              <span className="ml-2 text-emerald-600 text-sm">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-2xl ${
                plan.popular 
                  ? 'ring-2 ring-emerald-500 shadow-xl scale-105' 
                  : 'border border-gray-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${currentPrice(plan)}</span>
                    <span className="text-gray-600 ml-2">
                      /month {billingCycle === 'annual' && '(billed annually)'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-emerald-600 text-sm mt-2">
                      Save ${savings(plan)} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={onSelectPlan}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
              <p className="text-gray-600 text-sm">256-bit SSL encryption. PCI compliant.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">30-Day Free Trial</h4>
              <p className="text-gray-600 text-sm">No credit card required. Cancel anytime.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Money-Back Guarantee</h4>
              <p className="text-gray-600 text-sm">Not satisfied? Get a full refund within 60 days.</p>
            </div>
          </div>
        </div>

        {/* Custom Plan CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need a custom plan for your organization?</p>
          <button className="text-emerald-600 font-semibold hover:text-emerald-700">
            Contact our sales team →
          </button>
        </div>
      </div>
    </section>
  );
}