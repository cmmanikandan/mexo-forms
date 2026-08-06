import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeletonCard, MexoEmptyState } from '../../components/common/MexoSkeleton';
import { FormCard } from '../../components/forms/FormCard';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { Star } from 'lucide-react';

export const StarredPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    formService.getStarredForms(profile.id).then(f => { setForms(f); setLoading(false); });
  }, [profile]);

  const handleFormDeleted = (id: string) => setForms(prev => prev.filter(f => f.id !== id));
  const handleFormStarred = (id: string, starred: boolean) => {
    if (!starred) setForms(prev => prev.filter(f => f.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Starred Forms
        </h1>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <MexoSkeletonCard key={i} />)}</div>
        ) : forms.length === 0 ? (
          <MexoEmptyState
            icon={<Star className="w-8 h-8 text-app-muted" />}
            title="No starred forms"
            description="Star your important forms to find them quickly here."
            action={<MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>View All Forms</MexoButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map(f => <FormCard key={f.id} form={f} onDeleted={handleFormDeleted} onStarred={handleFormStarred} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
};
