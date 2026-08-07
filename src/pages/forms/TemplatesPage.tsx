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
  description: string;
  icon: React.ReactNode;
  color: string;
  questions: { text: string; type: string; options?: string[] }[];
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'feedback',
    name: 'Customer Feedback',
    category: 'Feedback',
    description: 'Gather user satisfaction ratings, feedback, and NPS.',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
    questions: [
      { text: 'How satisfied are you with our service?', type: 'rating' },
      { text: 'How likely are you to recommend us to a friend?', type: 'linear_scale' },
      { text: 'What can we improve?', type: 'long_text' },
    ],
  },
  {
    id: 'registration',
    name: 'Event Registration',
    category: 'Registration',
    description: 'Collect participant details, contact info, and dietary preferences.',
    icon: <Users className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    questions: [
      { text: 'Full Name', type: 'short_text' },
      { text: 'Email Address', type: 'email' },
      { text: 'Phone Number', type: 'phone' },
      { text: 'Dietary Restrictions', type: 'multiple_choice', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'] },
    ],
  },
  {
    id: 'quiz',
    name: 'General Knowledge Quiz',
    category: 'Quiz',
    description: 'Test knowledge with standard multiple choice question blocks.',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    questions: [
      { text: 'Participant Name', type: 'short_text' },
      { text: 'Question 1: What is the capital of France?', type: 'multiple_choice', options: ['London', 'Berlin', 'Paris', 'Madrid'] },
      { text: 'Question 2: Which planet is known as the Red Planet?', type: 'multiple_choice', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
    ],
  },
  {
    id: 'web_quiz',
    name: 'Web Development Quiz',
    category: 'Quiz',
    description: 'Assessment quiz covering HTML, CSS, JavaScript, and React.',
    icon: <Code className="w-5 h-5" />,
    color: 'from-purple-600 to-indigo-600',
    questions: [
      { text: 'Student Name / Email', type: 'short_text' },
      { text: '1. Which HTML tag is used for the main heading?', type: 'multiple_choice', options: ['<h1>', '<head>', '<header>', '<heading>'] },
      { text: '2. What does CSS stand for?', type: 'multiple_choice', options: ['Cascading Style Sheets', 'Computer Style System', 'Creative Sheet Style', 'Colorful Style Sheets'] },
      { text: '3. Which JS keyword declares a block-scoped variable?', type: 'multiple_choice', options: ['var', 'let', 'global', 'const'] },
    ],
  },
  {
    id: 'job_app',
    name: 'Job Application & HR Intake',
    category: 'HR',
    description: 'Collect applicant details, resume attachments, and experience.',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'from-sky-500 to-[#0878e8]',
    questions: [
      { text: 'Full Name', type: 'short_text' },
      { text: 'Email Address', type: 'email' },
      { text: 'Position Applied For', type: 'dropdown', options: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'Product Manager'] },
      { text: 'Years of Experience', type: 'number' },
      { text: 'Portfolio / LinkedIn URL', type: 'short_text' },
    ],
  },
  {
    id: 'course_eval',
    name: 'Course & Teacher Evaluation',
    category: 'Education',
    description: 'Gather student feedback on course materials, teaching, and clarity.',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'from-teal-500 to-emerald-600',
    questions: [
      { text: 'Course Name', type: 'short_text' },
      { text: 'Instructor Clarity & Preparation', type: 'rating' },
      { text: 'Was the pace of the course appropriate?', type: 'yes_no' },
      { text: 'What did you like most about this course?', type: 'long_text' },
    ],
  },
  {
    id: 'it_ticket',
    name: 'IT Support Ticket & Issue Report',
    category: 'IT Support',
    description: 'Log technical issues, priority level, and system details.',
    icon: <Wrench className="w-5 h-5" />,
    color: 'from-slate-600 to-slate-800',
    questions: [
      { text: 'User Name / Department', type: 'short_text' },
      { text: 'Issue Category', type: 'dropdown', options: ['Hardware', 'Software', 'Network / Wi-Fi', 'Account Access'] },
      { text: 'Priority Level', type: 'multiple_choice', options: ['Low', 'Medium', 'High', 'Critical'] },
      { text: 'Detailed Issue Description', type: 'long_text' },
    ],
  },
  {
    id: 'survey',
    name: 'Product Research Survey',
    category: 'Survey',
    description: 'Understand customer demographics and product usage habits.',
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: 'from-purple-500 to-violet-600',
    questions: [
      { text: 'How often do you use our product?', type: 'dropdown', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { text: 'Which features do you use most?', type: 'checkbox', options: ['Forms', 'Mail', 'Analytics', 'Settings'] },
      { text: 'Additional Comments', type: 'long_text' },
    ],
  },
  {
    id: 'contact',
    name: 'Simple Contact Form',
    category: 'Contact',
    description: 'Basic contact card for websites or personal profiles.',
    icon: <User className="w-5 h-5" />,
    color: 'from-indigo-500 to-sky-600',
    questions: [
      { text: 'Your Name', type: 'short_text' },
      { text: 'Email Address', type: 'email' },
      { text: 'Subject', type: 'short_text' },
      { text: 'Message', type: 'long_text' },
    ],
  },
  {
    id: 'poll',
    name: 'Quick Vote / Poll',
    category: 'Poll',
    description: 'A quick single-question poll to check audience sentiment.',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-600',
    questions: [
      { text: 'What feature should we build next?', type: 'multiple_choice', options: ['Dark Mode', 'Mobile App', 'Export to PDF', 'Custom Domains'] },
    ],
  },
];

export const TemplatesPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Feedback', 'Registration', 'Quiz', 'HR', 'Education', 'IT Support', 'Survey', 'Contact', 'Poll'];

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
