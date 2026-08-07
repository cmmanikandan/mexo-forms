import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoEmptyState, MexoSkeletonCard } from '../../components/common/MexoSkeleton';
import { FormCard } from '../../components/forms/FormCard';
import { formService } from '../../services/formService';
import { useAuth } from '../../contexts/AuthContext';
import { Form } from '../../types/forms';
import { Share2, RefreshCw, Search, Users } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const SharedPage: React.FC = () => {
  useDocumentTitle('Shared with me — MEXO Forms');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSharedForms = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sharedList = await formService.getSharedForms(user.id);
      setForms(sharedList);
    } catch (e) {
      console.error('[SHARED] Error fetching shared forms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedForms();
  }, [user?.id]);

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading flex items-center gap-2">
              <Share2 className="w-6 h-6 text-[#7C3AED]" /> Shared with me
            </h1>
            <p className="text-xs text-app-muted mt-1">
              Forms shared with you by other MEXO Account users for collaboration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSharedForms}
              disabled={loading}
              className="p-2 rounded-xl border border-app-border text-app-muted hover:text-app-heading hover:bg-slate-50 transition-colors"
              title="Refresh shared forms"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
              My Forms
            </MexoButton>
          </div>
        </div>

        {forms.length > 0 && (
          <div className="mb-6 relative max-w-md">
            <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shared forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-app-border rounded-xl pl-9 pr-4 py-2 text-xs text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED]"
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <MexoSkeletonCard key={n} />
            ))}
          </div>
        ) : filteredForms.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
              <Users className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{filteredForms.length} shared {filteredForms.length === 1 ? 'form' : 'forms'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                />
              ))}
            </div>
          </div>
        ) : (
          <MexoEmptyState
            icon={<Share2 className="w-10 h-10 text-[#7C3AED]/50" />}
            title={searchQuery ? "No matching shared forms" : "No shared forms yet"}
            description={
              searchQuery
                ? `No shared forms found matching "${searchQuery}".`
                : "When another MEXO user invites or shares a form with you, it will appear here."
            }
            action={
              <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
                View My Forms
              </MexoButton>
            }
          />
        )}
      </div>
    </AppShell>
  );
};
