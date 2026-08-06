import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeletonCard, MexoEmptyState } from '../../components/common/MexoSkeleton';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { Trash2, RotateCcw, XCircle } from 'lucide-react';

export const TrashPage: React.FC = () => {
  const { profile } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    formService.getTrashedForms(profile.id).then(f => { setForms(f); setLoading(false); });
  }, [profile]);

  const handleRestore = async (formId: string) => {
    await formService.restoreForm(formId);
    setForms(prev => prev.filter(f => f.id !== formId));
  };

  const handleDeletePermanent = async (formId: string) => {
    if (confirm('Are you sure you want to permanently delete this form? This cannot be undone.')) {
      await formService.deleteFormPermanently(formId);
      setForms(prev => prev.filter(f => f.id !== formId));
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading mb-6 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" /> Trash
        </h1>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <MexoSkeletonCard key={i} />)}</div>
        ) : forms.length === 0 ? (
          <MexoEmptyState
            icon={<Trash2 className="w-8 h-8 text-app-muted" />}
            title="Trash is empty"
            description="Forms moved to trash will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-app-border p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-app-heading text-sm">{f.title}</h3>
                  <p className="text-xs text-app-muted mt-1">{f.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-app-border">
                  <MexoButton
                    id={`restore-${f.id}`}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => handleRestore(f.id)}
                  >
                    Restore
                  </MexoButton>
                  <MexoButton
                    id={`delete-perm-${f.id}`}
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleDeletePermanent(f.id)}
                  >
                    Delete
                  </MexoButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
