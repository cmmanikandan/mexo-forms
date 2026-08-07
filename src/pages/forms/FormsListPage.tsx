import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeletonCard, MexoEmptyState } from '../../components/common/MexoSkeleton';
import { FormCard } from '../../components/forms/FormCard';
import { CreateFormModal } from '../../components/forms/CreateFormModal';
import { formService } from '../../services/formService';
import { Form, FormStatus } from '../../types/forms';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { Plus, FileText, Search, X } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const STATUS_FILTERS: { label: string; value: FormStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Closed', value: 'closed' },
];

export const FormsListPage: React.FC = () => {
  useDocumentTitle('My Forms');
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated_at' | 'title' | 'response_count'>('updated_at');

  useEffect(() => {
    if (!profile) return;
    formService.getUserForms(profile.id).then(f => {
      setForms(f);
      setLoading(false);
    });
  }, [profile]);

  const filtered = useMemo(() => {
    let r = forms;
    if (statusFilter !== 'all') r = r.filter(f => f.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(f => f.title.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q));
    }
    r = [...r].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'response_count') return (b.response_count || 0) - (a.response_count || 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return r;
  }, [forms, search, statusFilter, sortBy]);

  const handleFormCreated = (form: Form) => {
    setCreateOpen(false);
    navigate(`/forms/${form.id}/edit`);
  };

  const handleFormDeleted = (id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const handleFormRestored = (restoredForm: Form) => {
    setForms(prev => {
      if (prev.some(f => f.id === restoredForm.id)) return prev;
      return [restoredForm, ...prev];
    });
  };

  const handleFormStarred = (id: string, starred: boolean) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, is_starred: starred } : f));
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading tracking-tight">My Forms</h1>
          <MexoButton id="forms-list-create" variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Create Form
          </MexoButton>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
            <input
              id="forms-list-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-app-border text-sm text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED] bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-body">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
            {STATUS_FILTERS.map(sf => (
              <button
                key={sf.value}
                id={`filter-${sf.value}`}
                onClick={() => setStatusFilter(sf.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === sf.value ? 'bg-white text-app-heading shadow-sm' : 'text-app-muted hover:text-app-body'}`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            id="forms-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-app-border text-xs font-semibold text-app-heading outline-none bg-white focus:border-[#7C3AED] flex-shrink-0"
          >
            <option value="updated_at">Last Modified</option>
            <option value="title">Title A–Z</option>
            <option value="response_count">Most Responses</option>
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-[11px] text-app-muted mb-4">
            {filtered.length} {filtered.length === 1 ? 'form' : 'forms'}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <MexoSkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <MexoEmptyState
            icon={<FileText className="w-8 h-8 text-app-muted" />}
            title={search ? 'No forms found' : 'Create your first form'}
            description={search ? `No forms match "${search}"` : 'Start collecting responses in minutes.'}
            action={!search ? (
              <MexoButton variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
                Create Form
              </MexoButton>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(f => (
              <FormCard
                key={f.id}
                form={f}
                onDeleted={handleFormDeleted}
                onRestored={handleFormRestored}
                onStarred={handleFormStarred}
                onShowToast={addToast}
              />
            ))}
          </div>
        )}
      </div>

      <CreateFormModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleFormCreated} />
      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
