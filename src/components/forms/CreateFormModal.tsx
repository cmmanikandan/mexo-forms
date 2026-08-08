import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { FileText, MessageSquare, Users, Zap, ClipboardCheck, User, HelpCircle, Code, Star, GraduationCap } from 'lucide-react';

interface CreateFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (form: Form) => void;
  initialTemplateId?: string;
}

interface TemplateDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  mode?: 'standard' | 'registration' | 'quiz';
  prefix?: string;
  questions?: { text: string; type: string; required?: boolean; options?: string[] }[];
}

const TEMPLATES: TemplateDef[] = [
  { id: 'blank', label: 'Blank Form', description: 'Start from scratch', icon: <FileText className="w-5 h-5" />, color: 'bg-slate-100 text-slate-600' },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Collect feedback from users',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-blue-50 text-blue-600',
    mode: 'standard',
    questions: [
      { text: 'How satisfied are you with our service?', type: 'rating', required: true },
      { text: 'How likely are you to recommend us to a friend?', type: 'linear_scale', required: true },
      { text: 'What features do you appreciate most?', type: 'short_text', required: false },
      { text: 'What can we improve?', type: 'long_text', required: false },
    ],
  },
  {
    id: 'registration',
    label: 'Registration',
    description: 'Event or course signup',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-emerald-50 text-emerald-600',
    mode: 'registration',
    prefix: 'MXEV',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Mobile Number', type: 'phone', required: true },
      { text: 'Organization / Institution', type: 'short_text' },
      { text: 'Participant Category', type: 'dropdown', options: ['Student', 'Faculty', 'Professional', 'Guest'] },
      { text: 'Special Notes / Requirements', type: 'long_text' },
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Test knowledge with scoring',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-amber-50 text-amber-600',
    mode: 'quiz',
    questions: [
      { text: 'Student Name / Email', type: 'short_text', required: true },
      { text: 'Question 1: What is the capital of France?', type: 'multiple_choice', required: true, options: ['London', 'Berlin', 'Paris', 'Madrid'] },
      { text: 'Question 2: Which planet is known as the Red Planet?', type: 'multiple_choice', required: true, options: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
      { text: 'Question 3: What element does "O" represent on the periodic table?', type: 'multiple_choice', required: true, options: ['Gold', 'Oxygen', 'Osmium', 'Silver'] },
    ],
  },
  {
    id: 'survey',
    label: 'Survey',
    description: 'Gather opinions and data',
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: 'bg-violet-50 text-violet-600',
    mode: 'standard',
    questions: [
      { text: 'Respondent Name / Department', type: 'short_text' },
      { text: 'Primary Topic of Interest', type: 'multiple_choice', options: ['Technology', 'Business', 'Design', 'Science'] },
      { text: 'Frequency of Use', type: 'dropdown', options: ['Daily', 'Weekly', 'Monthly', 'First Time'] },
      { text: 'Additional Comments & Feedback', type: 'long_text' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact Form',
    description: 'Basic contact information',
    icon: <User className="w-5 h-5" />,
    color: 'bg-indigo-50 text-indigo-600',
    mode: 'standard',
    questions: [
      { text: 'Full Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Subject', type: 'short_text', required: true },
      { text: 'Your Message', type: 'long_text', required: true },
    ],
  },
  {
    id: 'poll',
    label: 'Poll',
    description: 'Quick single-question vote',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'bg-pink-50 text-pink-600',
    mode: 'standard',
    questions: [
      { text: 'What feature should we build next?', type: 'multiple_choice', required: true, options: ['Dark Mode', 'Mobile App', 'Offline Sync', 'Custom Themes'] },
    ],
  },
  {
    id: 'hackathon_registration',
    label: 'Hackathon Registration',
    description: 'Team hackathon signup',
    icon: <Code className="w-5 h-5" />,
    color: 'bg-amber-50 text-amber-700',
    mode: 'registration',
    prefix: 'MXHK',
    questions: [
      { text: 'Team Name', type: 'short_text', required: true },
      { text: 'Team Leader Name', type: 'short_text', required: true },
      { text: 'Team Leader Email', type: 'email', required: true },
      { text: 'Team Leader Mobile', type: 'phone', required: true },
      { text: 'Team Size (2 - 4)', type: 'number', required: true },
      { text: 'Problem Track / Domain', type: 'dropdown', options: ['AI & ML', 'Web & App Development', 'Blockchain & Fintech', 'Open Innovation'] },
    ],
  },
  {
    id: 'cultural_fest',
    label: 'Cultural Fest Signup',
    description: 'Music, dance & arts signup',
    icon: <Star className="w-5 h-5" />,
    color: 'bg-purple-50 text-purple-700',
    mode: 'registration',
    prefix: 'MXCL',
    questions: [
      { text: 'Participant / Group Name', type: 'short_text', required: true },
      { text: 'Contact Email', type: 'email', required: true },
      { text: 'Phone Number', type: 'phone', required: true },
      { text: 'Competition Event', type: 'dropdown', options: ['Solo Singing', 'Group Dance', 'Battle of Bands', 'Drama / Skit', 'Photography'] },
    ],
  },
  {
    id: 'sports_tournament',
    label: 'Sports Tournament',
    description: 'Intra-college sports signup',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-teal-50 text-teal-700',
    mode: 'registration',
    prefix: 'MXSP',
    questions: [
      { text: 'Player / Captain Name', type: 'short_text', required: true },
      { text: 'Email Address', type: 'email', required: true },
      { text: 'Phone Number', type: 'phone', required: true },
      { text: 'Sport Discipline', type: 'dropdown', options: ['Cricket (T10)', 'Football (5v5)', 'Badminton (Singles)', 'Basketball', 'Table Tennis'] },
    ],
  },
  {
    id: 'course_evaluation',
    label: 'Course Evaluation',
    description: 'Student course feedback',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-cyan-50 text-cyan-700',
    mode: 'standard',
    questions: [
      { text: 'Course Name / Code', type: 'short_text', required: true },
      { text: 'Overall Rating of the Course', type: 'rating', required: true },
      { text: 'Instructor Clarity & Delivery', type: 'rating', required: true },
      { text: 'Were course materials helpful?', type: 'yes_no', required: true },
    ],
  },
  {
    id: 'python_datascience_quiz',
    label: 'Python Quiz',
    description: 'Python & Data Science test',
    icon: <Code className="w-5 h-5" />,
    color: 'bg-blue-50 text-blue-700',
    mode: 'quiz',
    questions: [
      { text: 'Student / Candidate Name', type: 'short_text', required: true },
      { text: '1. Which data structure in Python is mutable and ordered?', type: 'multiple_choice', required: true, options: ['List', 'Tuple', 'Set', 'Frozenset'] },
      { text: '2. Which library is used for multi-dimensional array operations?', type: 'multiple_choice', required: true, options: ['NumPy', 'Pandas', 'Matplotlib', 'Requests'] },
    ],
  },
];

export const CreateFormModal: React.FC<CreateFormModalProps> = ({ open, onClose, onCreated, initialTemplateId }) => {
  const { profile } = useAuth();
  const [selected, setSelected] = React.useState(initialTemplateId || 'blank');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  React.useEffect(() => {
    if (initialTemplateId) setSelected(initialTemplateId);
  }, [initialTemplateId]);

  const handleCreate = async () => {
    if (!profile) return;
    setCreating(true);

    const tmpl = TEMPLATES.find(t => t.id === selected);
    const templateLabel = tmpl?.label || 'Form';
    const formTitle = title.trim() || (selected === 'blank' ? 'Untitled Form' : templateLabel);

    const form = await formService.createForm(profile.id, formTitle);
    if (form) {
      if (tmpl && tmpl.id !== 'blank') {
        await formService.updateForm(form.id, {
          description: tmpl.description,
          form_mode: tmpl.mode as any,
          form_type: tmpl.mode === 'quiz' ? 'quiz' : 'form',
          registration_prefix: tmpl.prefix || null,
          closed_title: tmpl.mode === 'registration' ? 'Registration Closed' : (tmpl.mode === 'quiz' ? 'Assessment Closed' : 'Form Closed'),
          closed_message: tmpl.mode === 'registration' ? 'Registration for this event has ended.' : 'This form is no longer accepting responses.',
        });

        if (tmpl.questions && tmpl.questions.length > 0) {
          for (let i = 0; i < tmpl.questions.length; i++) {
            const qData = tmpl.questions[i];
            const q = await formService.addQuestion(form.id, qData.type, i);
            if (q) {
              await formService.updateQuestion(q.id, { question_text: qData.text, required: qData.required ?? false });
              if (qData.options && qData.options.length > 0) {
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
        }
      }

      setCreating(false);
      setTitle('');
      setSelected('blank');
      onCreated(form);
    } else {
      setCreating(false);
    }
  };

  return (
    <MexoModal
      open={open}
      onOpenChange={o => { if (!o) onClose(); }}
      title="Create New Form"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <MexoButton variant="secondary" size="sm" onClick={onClose}>Cancel</MexoButton>
          <MexoButton id="create-form-submit" variant="primary" size="sm" onClick={handleCreate} loading={creating}>
            Create Form
          </MexoButton>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title input */}
        <div>
          <label className="block text-xs font-semibold text-app-heading mb-1.5">Form Title</label>
          <input
            id="new-form-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={selected === 'blank' ? 'Untitled Form' : TEMPLATES.find(t => t.id === selected)?.label}
            className="w-full rounded-xl border border-app-border px-3 py-2.5 text-sm text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 transition-all"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        {/* Template grid */}
        <div>
          <label className="block text-xs font-semibold text-app-heading mb-2">Start from</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                id={`template-${tmpl.id}`}
                onClick={() => setSelected(tmpl.id)}
                className={`relative flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                  selected === tmpl.id
                    ? 'border-[#7C3AED] bg-indigo-50/50 ring-2 ring-purple-200'
                    : 'border-app-border hover:border-slate-300 bg-white'
                }`}
              >
                {selected === tmpl.id && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7C3AED]" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tmpl.color}`}>
                  {tmpl.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-app-heading leading-tight">{tmpl.label}</p>
                  <p className="text-[11px] text-app-muted mt-0.5 leading-tight">{tmpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MexoModal>
  );
};
