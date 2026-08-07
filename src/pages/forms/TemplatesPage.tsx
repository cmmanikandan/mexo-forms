import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import {
  MessageSquare, Users, Zap, ClipboardCheck, User,
  HelpCircle, Layout, ArrowRight, Star, Briefcase, GraduationCap, Wrench, Code,
} from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  mode: 'standard' | 'registration' | 'quiz';
  description: string;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  questions: { text: string; type: string; required?: boolean; options?: string[] }[];
}

const TEMPLATES: TemplateItem[] = [
  // STANDARD FORMS
  {
    id: 'customer_feedback',
    name: 'Customer Feedback',
    category: 'Standard Forms',
    mode: 'standard',
    description: 'Gather user satisfaction ratings, feedback, and NPS score.',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
    questions: [
      { text: 'How satisfied are you with our service?', type: 'rating', required: true },
      { text: 'How likely are you to recommend us to a friend?', type: 'linear_scale', required: true },
      { text: 'What can we improve?', type: 'long_text', required: false },
    ],
  },
  {
    id: 'contact_form',
    name: 'Contact & Enquiry Form',
    category: 'Standard Forms',
    mode: 'standard',
    description: 'Collect visitor messages, subject line, and contact details.',
    icon: <User className="w-5 h-5" />,
    color: 'from-sky-500 to-blue-600',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Subject', type: 'short_text', required: true },
      { text: 'Your Message', type: 'long_text', required: true },
    ],
  },
  {
    id: 'general_survey',
    name: 'General Survey',
    category: 'Standard Forms',
    mode: 'standard',
    description: 'Collect opinion votes, demographic choices, and survey inputs.',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'from-indigo-500 to-purple-600',
    questions: [
      { text: 'Respondent Name / Department', type: 'short_text' },
      { text: 'Primary Topic of Interest', type: 'multiple_choice', options: ['Technology', 'Business', 'Design', 'Science'] },
      { text: 'Additional Comments', type: 'long_text' },
    ],
  },

  // REGISTRATION & EVENT FORMS
  {
    id: 'event_registration',
    name: 'Event Registration',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXEV',
    description: 'Collect participant details, contact info, and registration preferences.',
    icon: <Users className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone', required: true },
      { text: 'Department / Organization', type: 'short_text' },
      { text: 'Participant Type', type: 'dropdown', options: ['Student', 'Faculty', 'Professional', 'Guest'] },
      { text: 'Special Requirements / Notes', type: 'long_text' },
    ],
  },
  {
    id: 'workshop_registration',
    name: 'Workshop Registration',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXWS',
    description: 'Hands-on workshop signup with skill levels and session selection.',
    icon: <Wrench className="w-5 h-5" />,
    color: 'from-purple-500 to-indigo-600',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone', required: true },
      { text: 'College / Company', type: 'short_text', required: true },
      { text: 'Experience Level', type: 'multiple_choice', options: ['Beginner', 'Intermediate', 'Advanced'] },
      { text: 'Workshop Session', type: 'dropdown', options: ['Morning Session (10 AM)', 'Afternoon Session (2 PM)'] },
    ],
  },
  {
    id: 'seminar_registration',
    name: 'Seminar Registration',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXSM',
    description: 'Academic or professional seminar registration with attendance mode.',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'from-blue-600 to-cyan-600',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone', required: true },
      { text: 'Institution / Department', type: 'short_text', required: true },
      { text: 'Attendance Mode', type: 'multiple_choice', options: ['In-Person', 'Online Stream'] },
    ],
  },
  {
    id: 'conference_registration',
    name: 'Conference Registration',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXCF',
    description: 'Multi-track conference registration with participant categories.',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'from-teal-600 to-emerald-700',
    questions: [
      { text: 'Participant Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone', required: true },
      { text: 'Organization / Institution', type: 'short_text', required: true },
      { text: 'Category', type: 'dropdown', options: ['Student', 'Faculty', 'Researcher', 'Professional', 'Speaker'] },
      { text: 'Dietary Preferences', type: 'multiple_choice', options: ['Regular', 'Vegetarian', 'Vegan'] },
    ],
  },
  {
    id: 'hackathon_registration',
    name: 'Hackathon Team Registration',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXHK',
    description: 'Team hackathon registration with problem domain & tech stack.',
    icon: <Code className="w-5 h-5" />,
    color: 'from-amber-600 to-orange-600',
    questions: [
      { text: 'Team Name', type: 'short_text', required: true },
      { text: 'Team Leader Name', type: 'short_text', required: true },
      { text: 'Team Leader Email', type: 'email', required: true },
      { text: 'Team Leader Mobile', type: 'phone', required: true },
      { text: 'College / Organization', type: 'short_text', required: true },
      { text: 'Team Size (2 - 4)', type: 'number', required: true },
      { text: 'Problem Track / Domain', type: 'dropdown', options: ['AI & ML', 'Web & App Development', 'Blockchain & Fintech', 'Open Innovation'] },
    ],
  },
  {
    id: 'webinar_registration',
    name: 'Webinar / Online Event',
    category: 'Registration & Events',
    mode: 'registration',
    prefix: 'MXWB',
    description: 'Online webinar registration with joining link delivery.',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-600',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone' },
      { text: 'Organization / Institution', type: 'short_text' },
    ],
  },

  // QUIZ & ASSESSMENTS
  {
    id: 'general_quiz',
    name: 'General Knowledge Quiz',
    category: 'Quiz & Assessments',
    mode: 'quiz',
    description: 'Test knowledge with standard multiple choice question blocks.',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    questions: [
      { text: 'Participant Name', type: 'short_text', required: true },
      { text: 'Question 1: What is the capital of France?', type: 'multiple_choice', required: true, options: ['London', 'Berlin', 'Paris', 'Madrid'] },
      { text: 'Question 2: Which planet is known as the Red Planet?', type: 'multiple_choice', required: true, options: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
    ],
  },
  {
    id: 'web_quiz',
    name: 'Web Development Assessment',
    category: 'Quiz & Assessments',
    mode: 'quiz',
    description: 'Technical assessment quiz covering HTML, CSS, JavaScript, and React.',
    icon: <Code className="w-5 h-5" />,
    color: 'from-purple-600 to-indigo-600',
    questions: [
      { text: 'Student Name / Email', type: 'short_text', required: true },
      { text: '1. Which HTML tag is used for the main heading?', type: 'multiple_choice', required: true, options: ['<h1>', '<head>', '<header>', '<heading>'] },
      { text: '2. What does CSS stand for?', type: 'multiple_choice', required: true, options: ['Cascading Style Sheets', 'Computer Style System', 'Creative Sheet Style', 'Colorful Style Sheets'] },
      { text: '3. Which JS keyword declares a block-scoped variable?', type: 'multiple_choice', required: true, options: ['var', 'let', 'global', 'const'] },
    ],
  },
];

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Standard Forms', 'Registration & Events', 'Quiz & Assessments'];

  const handleUseTemplate = async (tmpl: TemplateItem) => {
    if (!profile) return;
    setCreating(tmpl.id);
    const form = await formService.createForm(profile.id, tmpl.name);
    if (form) {
      await formService.updateForm(form.id, { description: tmpl.description });
      for (let i = 0; i < tmpl.questions.length; i++) {
        const qData = tmpl.questions[i];
        const q = await formService.addQuestion(form.id, qData.type, i);
        if (q) {
          await formService.updateQuestion(q.id, { question_text: qData.text });
          if (qData.options && qData.options.length > 0) {
            // clear default opts
            if (q.options) {
              for (const opt of q.options) {
                await formService.deleteOption(opt.id);
              }
            }
            for (let j = 0; j < qData.options.length; j++) {
              await formService.addOption(q.id, qData.options[j], j);
            }
          }
        }
      }
      setCreating(null);
      navigate(`/forms/${form.id}/edit`);
    } else {
      setCreating(null);
    }
  };

  const filtered = selectedCat === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === selectedCat);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#7C3AED]" /> Form Templates
          </h1>
          <p className="text-xs text-app-muted mt-1">Jumpstart your workflow with pre-built form templates.</p>
        </div>

        {/* Category bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              id={`cat-${cat.toLowerCase()}`}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCat === cat
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'bg-white text-app-body border border-app-border hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(tmpl => (
            <div
              key={tmpl.id}
              className="bg-white rounded-2xl border border-app-border hover:border-indigo-200 hover:shadow-mexo-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                  {tmpl.icon}
                </div>
                <h3 className="font-bold text-app-heading text-sm">{tmpl.name}</h3>
                <p className="text-xs text-app-muted mt-1 leading-relaxed">{tmpl.description}</p>
                <div className="mt-3 text-[11px] text-app-body bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="font-semibold text-app-heading">{tmpl.questions.length} Questions:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-app-muted">
                    {tmpl.questions.slice(0, 2).map((q, i) => (
                      <li key={i} className="truncate">{q.text}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-app-border">
                <MexoButton
                  id={`use-template-${tmpl.id}`}
                  variant="primary"
                  size="sm"
                  className="w-full justify-between"
                  loading={creating === tmpl.id}
                  onClick={() => handleUseTemplate(tmpl)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Use Template
                </MexoButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};
