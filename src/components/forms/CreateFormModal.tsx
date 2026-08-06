import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { FileText, MessageSquare, Users, Zap, ClipboardCheck, User, HelpCircle } from 'lucide-react';

interface CreateFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (form: Form) => void;
}

const TEMPLATES = [
  { id: 'blank', label: 'Blank Form', description: 'Start from scratch', icon: <FileText className="w-5 h-5" />, color: 'bg-slate-100 text-slate-600' },
  { id: 'feedback', label: 'Feedback', description: 'Collect feedback from users', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
  { id: 'registration', label: 'Registration', description: 'Event or course signup', icon: <Users className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'quiz', label: 'Quiz', description: 'Test knowledge with scoring', icon: <Zap className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
  { id: 'survey', label: 'Survey', description: 'Gather opinions and data', icon: <ClipboardCheck className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
  { id: 'contact', label: 'Contact Form', description: 'Basic contact information', icon: <User className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'poll', label: 'Poll', description: 'Quick single-question vote', icon: <HelpCircle className="w-5 h-5" />, color: 'bg-pink-50 text-pink-600' },
];

export const CreateFormModal: React.FC<CreateFormModalProps> = ({ open, onClose, onCreated }) => {
  const { profile } = useAuth();
  const [selected, setSelected] = useState('blank');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!profile) return;
    setCreating(true);
    const templateLabel = TEMPLATES.find(t => t.id === selected)?.label || 'Form';
    const formTitle = title.trim() || (selected === 'blank' ? 'Untitled Form' : templateLabel);
    const form = await formService.createForm(profile.id, formTitle);
    setCreating(false);
    if (form) {
      setTitle('');
      setSelected('blank');
      onCreated(form);
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
