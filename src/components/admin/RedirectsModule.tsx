import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, Trash2, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface RedirectItem {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at?: string;
}

export const RedirectsModule: React.FC = () => {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');
  const [statusCode, setStatusCode] = useState<number>(301);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRedirects = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<RedirectItem[]>('/admin/redirects');
      setRedirects(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load redirects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRedirects();
  }, []);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPath.trim() || !toPath.trim()) {
      setError('Both source and target paths are required.');
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<RedirectItem>('/admin/redirects', {
        method: 'POST',
        body: JSON.stringify({
          from_path: fromPath.trim(),
          to_path: toPath.trim(),
          status_code: statusCode
        })
      });
      setSuccess(`Redirect added: ${fromPath.trim()} -> ${toPath.trim()} (${statusCode})`);
      setFromPath('');
      setToPath('');
      loadRedirects();
    } catch (err: any) {
      setError(err.message || 'Failed to create redirect');
    }
  };

  const handleDelete = async (id: string, from: string) => {
    if (!confirm(`Delete redirect for "${from}"?`)) return;
    try {
      await apiFetch(`/admin/redirects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setRedirects(redirects.filter(r => r.id !== id));
      setSuccess('Redirect deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete redirect');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>URL Redirects Manager</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              Live HTTP 301/302
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage permanent (301) and temporary (302) URL redirects. Requests hitting the source path are automatically redirected by the Express server.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Redirect Form */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-[#F15A24]" />
          Create New URL Redirect Rule
        </h3>

        <form onSubmit={handleAddRedirect} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-5">
            <span className="font-semibold text-slate-400 block mb-1">Source Path (From)</span>
            <input
              type="text"
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="e.g. /old-cctv-package"
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono text-xs focus:border-[#F15A24] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <span className="font-semibold text-slate-400 block mb-1">Target Path / URL (To)</span>
            <input
              type="text"
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="e.g. /packages or /category/cctv-cameras"
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono text-xs focus:border-[#F15A24] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="font-semibold text-slate-400 block mb-1">Status Code</span>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(parseInt(e.target.value) || 301)}
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs focus:border-[#F15A24] focus:outline-none font-mono"
            >
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-[#F15A24] hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Redirects Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300">Active Server Redirections ({redirects.length})</span>
          <span className="text-slate-500 font-mono text-[11px]">Exact match, case-insensitive</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading redirect rules...</div>
        ) : redirects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No URL redirect rules configured. Create one above to handle legacy URLs or campaign shortcuts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Incoming Request (From)</th>
                  <th className="py-3 px-4">Destination (To)</th>
                  <th className="py-3 px-4">HTTP Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {r.from_path}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{r.to_path}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        r.status_code === 301
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        HTTP {r.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.from_path)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                        title="Delete redirect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

