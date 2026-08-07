import React, { useState, useMemo } from 'react';
import { FormQuestion, FormResponse, FormAnswer } from '../../types/forms';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResponseTableTabProps {
  questions: FormQuestion[];
  responses: FormResponse[];
  answers: FormAnswer[];
}

const PAGE_SIZE = 20;

export const ResponseTableTab: React.FC<ResponseTableTabProps> = ({ questions, responses, answers }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<'submitted_at' | 'respondent_email'>('submitted_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const getAnswer = (responseId: string, questionId: string) => {
    const ans = answers.find(a => a.response_id === responseId && a.question_id === questionId);
    if (!ans) return '';
    if (Array.isArray(ans.answer_json)) return ans.answer_json.join(', ');
    if (ans.answer_json !== null && ans.answer_json !== undefined) return JSON.stringify(ans.answer_json);
    return ans.answer_text || '';
  };

  const filtered = useMemo(() => {
    let r = [...responses];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(resp =>
        (resp.respondent_email || '').toLowerCase().includes(q) ||
        (resp.id || '').toLowerCase().includes(q) ||
        questions.some(qObj => getAnswer(resp.id, qObj.id).toLowerCase().includes(q))
      );
    }
    r.sort((a, b) => {
      const va = a[sortKey] || '';
      const vb = b[sortKey] || '';
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return r;
  }, [responses, search, sortKey, sortDir]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
        <input
          id="response-table-search"
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search responses..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-app-border text-xs text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED] bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-app-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-app-border">
                <th className="px-4 py-3 text-left font-bold text-app-muted whitespace-nowrap w-8">#</th>
                <th
                  className="px-4 py-3 text-left font-bold text-app-muted whitespace-nowrap cursor-pointer hover:text-app-body"
                  onClick={() => toggleSort('submitted_at')}
                >
                  Submitted {sortKey === 'submitted_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="px-4 py-3 text-left font-bold text-app-muted whitespace-nowrap cursor-pointer hover:text-app-body"
                  onClick={() => toggleSort('respondent_email')}
                >
                  Respondent {sortKey === 'respondent_email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                {questions.map(q => (
                  <th key={q.id} className="px-4 py-3 text-left font-bold text-app-muted whitespace-nowrap max-w-[180px]">
                    <span className="block truncate max-w-[160px]" title={q.question_text}>{q.question_text}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {paginated.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-app-muted font-semibold">{page * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 text-app-muted whitespace-nowrap">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-app-heading font-semibold whitespace-nowrap">
                    {r.respondent_email || 'Anonymous'}
                  </td>
                  {questions.map(q => (
                    <td key={q.id} className="px-4 py-3 text-app-body max-w-[180px]">
                      <span className="block truncate max-w-[160px]" title={getAnswer(r.id, q.id)}>
                        {getAnswer(r.id, q.id) || '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={3 + questions.length} className="px-4 py-8 text-center text-xs text-app-muted">
                    {search ? 'No matching responses found.' : 'No responses yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-app-border flex items-center justify-between">
            <p className="text-[11px] text-app-muted">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                id="prev-page"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-app-muted hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-app-body px-2">Page {page + 1} / {totalPages}</span>
              <button
                id="next-page"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-app-muted hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
