import React from 'react';
import { FormQuestion, FormResponse, FormAnswer, ResponseAnalytics } from '../../types/forms';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Star } from 'lucide-react';

interface ResponseSummaryTabProps {
  questions: FormQuestion[];
  responses: FormResponse[];
  answers: FormAnswer[];
  analytics: ResponseAnalytics | null;
}

const COLORS = ['#7C3AED', '#6366F1', '#0878e8', '#10b981', '#f59e0b', '#f43f5e', '#8B5CF6'];

export const ResponseSummaryTab: React.FC<ResponseSummaryTabProps> = ({
  questions, responses, answers, analytics,
}) => {
  // Quiz Score Analytics computation
  const scoredResponses = responses.filter(r => r.score !== undefined && r.score !== null);
  const hasQuizScores = scoredResponses.length > 0;

  let avgPercentage = 0;
  let passRate = 0;
  let maxScore = 0;
  let minScore = 0;
  let scoreDistData: { bracket: string; count: number }[] = [];

  if (hasQuizScores) {
    const percentages = scoredResponses.map(r => (r as any).percentage ?? Math.round(((r.score || 0) / (r.total_points || 1)) * 100));
    avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const passed = percentages.filter(p => p >= 70).length;
    passRate = Math.round((passed / percentages.length) * 100);
    maxScore = Math.max(...percentages);
    minScore = Math.min(...percentages);

    const b1 = percentages.filter(p => p < 25).length;
    const b2 = percentages.filter(p => p >= 25 && p < 50).length;
    const b3 = percentages.filter(p => p >= 50 && p < 75).length;
    const b4 = percentages.filter(p => p >= 75).length;
    scoreDistData = [
      { bracket: '0-24%', count: b1 },
      { bracket: '25-49%', count: b2 },
      { bracket: '50-74%', count: b3 },
      { bracket: '75-100%', count: b4 },
    ];
  }

  return (
    <div className="space-y-5">
      {/* Quiz Performance Analytics (Shown if quiz scores exist) */}
      {hasQuizScores && (
        <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 rounded-2xl p-5 text-white shadow-mexo-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Quiz Assessment Analytics
              </h3>
              <p className="text-[11px] text-purple-200 mt-0.5">Automated scoring & performance breakdown across {scoredResponses.length} quiz attempts</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Quiz Mode Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] font-semibold text-purple-200">Average Score</p>
              <p className="text-2xl font-black text-amber-300 mt-1">{avgPercentage}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] font-semibold text-purple-200">Pass Rate (≥70%)</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{passRate}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] font-semibold text-purple-200">Highest Score</p>
              <p className="text-2xl font-black text-cyan-300 mt-1">{maxScore}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <p className="text-[11px] font-semibold text-purple-200">Lowest Score</p>
              <p className="text-2xl font-black text-rose-300 mt-1">{minScore}%</p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] font-bold text-purple-200 mb-2">Score Distribution</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={scoreDistData}>
                <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#e2e8f0' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4338ca', color: '#fff', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Response Trend & Device Breakdown Grid */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl border border-app-border p-5">
            <h3 className="text-xs font-bold text-app-heading mb-4">Response Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={analytics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-app-border p-5 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-app-heading mb-2">Device Breakdown</h3>
            <div className="h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.deviceBreakdown}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={4}
                  >
                    {analytics.deviceBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [`${value} responses`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-around text-[11px] text-app-muted pt-2 border-t border-app-border">
              {analytics.deviceBreakdown.map((item, idx) => (
                <div key={item.device} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{item.device}: <strong>{item.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-question summaries */}
      {questions.map(q => {
        const qAnswers = answers.filter(a => a.question_id === q.id);
        return (
          <div key={q.id} className="bg-white rounded-2xl border border-app-border p-5">
            <h3 className="text-sm font-bold text-app-heading mb-1">{q.question_text}</h3>
            <p className="text-[11px] text-app-muted mb-4">{qAnswers.length} responses</p>
            <QuestionSummary question={q} answers={qAnswers} />
          </div>
        );
      })}
    </div>
  );
};

const QuestionSummary: React.FC<{ question: FormQuestion; answers: FormAnswer[] }> = ({ question, answers }) => {
  const type = question.question_type;

  if (answers.length === 0) {
    return <p className="text-xs text-app-muted italic">No answers yet.</p>;
  }

  // Multiple choice / dropdown → bar chart
  if (['multiple_choice', 'dropdown', 'yes_no'].includes(type)) {
    const counts: Record<string, number> = {};
    answers.forEach(a => {
      const v = a.answer_text || String(a.answer_json || '');
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
    return (
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Checkbox → horizontal bar
  if (type === 'checkbox') {
    const counts: Record<string, number> = {};
    answers.forEach(a => {
      const vals = Array.isArray(a.answer_json) ? a.answer_json : [a.answer_text];
      vals.forEach((v: string) => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
    return (
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Rating → average + distribution
  if (type === 'rating') {
    const values = answers.map(a => Number(a.answer_text || 0)).filter(v => v > 0);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
    const maxRating = question.settings?.max_rating || 5;
    const dist: Record<number, number> = {};
    values.forEach(v => { dist[v] = (dist[v] || 0) + 1; });
    const distData = [...Array(maxRating)].map((_, i) => ({ rating: i + 1, count: dist[i + 1] || 0 }));
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-[#7C3AED]">{avg}</span>
          <div>
            <div className="flex gap-0.5">
              {[...Array(maxRating)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avg)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <p className="text-[11px] text-app-muted">{values.length} ratings</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={distData}>
            <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Linear scale → distribution
  if (type === 'linear_scale') {
    const values = answers.map(a => Number(a.answer_text || 0)).filter(v => v > 0);
    const min = question.settings?.min ?? 1;
    const max = question.settings?.max ?? 10;
    const dist: Record<number, number> = {};
    values.forEach(v => { dist[v] = (dist[v] || 0) + 1; });
    const data = [...Array(max - min + 1)].map((_, i) => ({ value: min + i, count: dist[min + i] || 0 }));
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
    return (
      <div>
        <p className="text-xs text-app-muted mb-2">Average: <strong className="text-app-heading">{avg}</strong></p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data}>
            <XAxis dataKey="value" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0878e8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Text answers → show list
  const textAnswers = answers.map(a => a.answer_text || '').filter(Boolean).slice(0, 10);
  return (
    <div className="space-y-2">
      {textAnswers.map((ans, i) => (
        <div key={i} className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-app-heading border border-app-border">
          {ans}
        </div>
      ))}
      {answers.length > 10 && (
        <p className="text-[11px] text-app-muted">+{answers.length - 10} more responses</p>
      )}
    </div>
  );
};
