'use client';

import { useState } from 'react';
import Logo from './Logo';

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
  onGoToTest: () => void;
  onCreateCharacter: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome to TalkWise',
    subtitle: 'Your AI communication coach',
    description:
      'TalkWise helps you practice real conversations before they happen — so you walk in prepared, not nervous.',
    highlights: [
      'Practice with AI characters that feel like real people',
      'Get honest feedback on how you communicate',
      'Build confidence for work and life situations',
    ],
  },
  {
    id: 'characters',
    emoji: '🎭',
    title: 'Create someone to talk to',
    subtitle: 'Step 1 of the journey',
    description:
      'Build a character with a name and personality — a tough boss, a first date, a difficult client. You set how they behave.',
    highlights: [
      'Choose Work or Life track',
      'Set personality traits with sliders',
      'Save and reuse characters anytime',
    ],
  },
  {
    id: 'practice',
    emoji: '💬',
    title: 'Pick a scenario & practice',
    subtitle: 'Step 2 of the journey',
    description:
      'Choose what you want to practice — salary negotiation, conflict resolution, small talk — then have the conversation.',
    highlights: [
      'Select from common goals or write your own',
      'Chat naturally, just like texting a real person',
      'End whenever you feel ready for feedback',
    ],
  },
  {
    id: 'feedback',
    emoji: '📊',
    title: 'Get personalized feedback',
    subtitle: 'Step 3 of the journey',
    description:
      'After each conversation, AI analyzes what you said and gives you a detailed report — strengths, areas to improve, and key moments.',
    highlights: [
      'Confidence score with detailed breakdown',
      'Specific tips you can use right away',
      'Track your progress over time',
    ],
  },
  {
    id: 'profile',
    emoji: '🧠',
    title: 'Discover your communication style',
    subtitle: 'Optional but recommended',
    description:
      'Take a quick 8-minute personality test to uncover your communication strengths and blind spots. Get AI-powered advice tailored to your role and goals.',
    highlights: [
      '27 research-backed questions',
      'Personalized radar chart of 9 traits',
      'AI growth recommendations for work & life',
    ],
  },
];

export default function Onboarding({ userName, onComplete, onGoToTest, onCreateCharacter }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = async () => {
    onComplete();
  };

  const handleStartPracticing = () => {
    onComplete();
    onCreateCharacter();
  };

  const handleTakeTest = () => {
    onComplete();
    onGoToTest();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <Logo size={32} />
        <button
          onClick={handleSkip}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip tour
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-8 bg-gradient-to-r from-brand-500 to-accent-500'
                : i < currentStep
                ? 'w-2 bg-brand-300'
                : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
        <div className="max-w-lg w-full py-8">
          {/* Step icon */}
          <div className="text-center mb-6">
            {isFirst ? (
              <div className="flex flex-col items-center gap-3 mb-2">
                <Logo size={80} />
                <div className="text-4xl">{step.emoji}</div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-4xl">{step.emoji}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            {isFirst && (
              <p className="text-sm font-medium text-brand-600 mb-1">
                Hi {userName}! 
              </p>
            )}
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {step.title}
            </h1>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              {step.subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-base text-slate-600 text-center leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Highlights */}
          <div className="space-y-3 mb-8">
            {step.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{h}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons on last step */}
          {isLast && (
            <div className="space-y-3 mb-4">
              <button
                onClick={handleStartPracticing}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25 text-base"
              >
                Create my first character
              </button>
              <button
                onClick={handleTakeTest}
                className="w-full py-3.5 rounded-xl font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all text-base"
              >
                Take the personality test first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirst}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all"
          >
            &larr; Back
          </button>

          <span className="text-xs text-slate-400">
            {currentStep + 1} of {STEPS.length}
          </span>

          {!isLast ? (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
            >
              Next &rarr;
            </button>
          ) : (
            <div className="w-20" /> // spacer to balance layout since CTAs are above
          )}
        </div>
      </div>
    </div>
  );
}
