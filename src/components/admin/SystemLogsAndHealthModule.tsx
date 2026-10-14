import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Server,
  Database,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Play,
  RotateCcw,
  Ban,
  Cpu,
  HardDrive,
  FileText,
  ChevronRight,
  ExternalLink,
  Eye,
  Plus,
  Terminal,
  Zap,
  Layers,
  Calendar
} from 'lucide-react';
import { AuditLogItem, BackgroundJobItem, SystemHealthData } from '../../types';
import { apiFetch } from '../../services/apiClient';
import { DataTable } from './framework/DataTable';
import { ConfirmDialog } from './framework/ConfirmDialog';
import { Badge, Button, Modal } from '../common/UI';

export const SystemLogsAndHealthModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'jobs' | 'health'>('audit');

  // ============================================================================
  // TAB 1: AUDIT LOGS STATE
  // ============================================================================
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // ============================================================================
  // TAB 2: BACKGROUND JOBS STATE
  // ============================================================================
  const [jobs, setJobs] = useState<BackgroundJobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<BackgroundJobItem | null>(null);
  const [isEnqueueOpen, setIsEnqueueOpen] = useState(false);
  const [enqueueType, setEnqueueType] = useState('sitemap_generation');
  const [enqueuePayload, setEnqueuePayload] = useState('{}');
  const [isEnqueuing, setIsEnqueuing] = useState(false);

  // ============================================================================
  // TAB 3: SYSTEM HEALTH & BACKUPS STATE
  // ============================================================================
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreJsonData, setRestoreJsonData] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // ============================================================================
  // AUDIT LOGS FETCHING
  // ============================================================================
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(auditPage));
      params.append('limit', '40');
      if (auditEntityFilter) params.append('entity', auditEntityFilter);
      if (auditActionFilter) params.append('action', auditActionFilter);

      const res = await apiFetch<{ items: AuditLogItem[]; total: number }>(`/audit-logs?${params.toString()}`);
      if (res && Array.isArray(res.items)) {
        setAuditLogs(res.items);
        setAuditTotal(res.total || res.items.length);
      }
    } catch (err: any) {
      setAuditError(err.message || 'Failed to load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  };

  // ============================================================================
  // BACKGROUND JOBS FETCHING
  // ============================================================================
  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await apiFetch<BackgroundJobItem[]>('/admin/jobs');
      setJobs(data);
    } catch (err: any) {
      setJobsError(err.message || 'Failed to load background jobs.');
    } finally {
      setJobsLoading(false);
    }
  };

  const handleRetryJob = async (id: string) => {
    try {
      await apiFetch(`/admin/jobs/${id}/retry`, { method: 'POST' });
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to retry job.');
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await apiFetch(`/admin/jobs/${id}/cancel`, { method: 'POST' });
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel job.');
    }
  };

  const handleEnqueueJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEnqueuing(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(enqueuePayload);
      } catch (_) {
        throw new Error('Payload must be valid JSON.');
      }

      await apiFetch('/admin/jobs/enqueue', {
        method: 'POST',
        body: JSON.stringify({ type: enqueueType, payload: parsedPayload })
      });
      setIsEnqueueOpen(false);
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to enqueue background job.');
    } finally {
      setIsEnqueuing(false);
    }
  };

  // ============================================================================
  // SYSTEM HEALTH FETCHING
  // ============================================================================
  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await apiFetch<SystemHealthData>('/admin/system/health');
      setHealthData(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to fetch system health status.');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setRestoreJsonData(parsed);
        setRestoreError(null);
      } catch (err) {
        setRestoreError('Invalid JSON backup file. Please select a genuine CamneX backup export.');
        setRestoreJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restoreConfirmText !== 'RESTORE DATABASE') {
      setRestoreError('Please type "RESTORE DATABASE" exactly to proceed.');
      return;
    }
    if (!restoreJsonData) {
      setRestoreError('Please select a valid backup JSON file.');
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreResult(null);
    try {
      const res = await apiFetch<any>('/admin/system/restore', {
        method: 'POST',
        body: JSON.stringify({
          confirmPhrase: restoreConfirmText,
          backupData: restoreJsonData
        })
      });
      setRestoreResult(res);
      fetchHealth();
    } catch (err: any) {
      setRestoreError(err.message || 'Database restoration failed.');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'jobs') fetchJobs();
    if (activeTab === 'health') fetchHealth();
  }, [activeTab, auditPage, auditEntityFilter, auditActionFilter]);

  // Filtered lists
  const filteredAuditLogs = auditLogs.filter(log => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.entity.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.actorName && log.actorName.toLowerCase().includes(q))
    );
  });

  const filteredJobs = jobs.filter(job => {
    if (jobStatusFilter !== 'all' && job.status !== jobStatusFilter) return false;
    return true;
  });

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="dark">Cancelled</Badge>;
      default:
        return <Badge variant="info">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F15A24]" />
            <span>System Logs, Health & Database Backups</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable audit trail inspection, background queue monitor, live server metrics, and full database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'audit' && (
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAuditLogs}
              disabled={auditLoading}
              className="border-slate-800 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${auditLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}

          {activeTab === 'jobs' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchJobs}
                disabled={jobsLoading}
                className="border-slate-800 text-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${jobsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setIsEnqueueOpen(true)}
                className="bg-[#F15A24] text-white hover:bg-[#D94D1C]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Enqueue Job
              </Button>
            </>
          )}

          {activeTab === 'health' && (
            <Button
              size="sm"
              variant="outline"
              onClick={fetchHealth}
              disabled={healthLoading}
              className="border-slate-800 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${healthLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'audit'
              ? 'border-[#F15A24] text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Audit Logs Explorer</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            {auditTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'jobs'
              ? 'border-[#F15A24] text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-sky-400" />
          <span>Background Jobs Queue</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            {jobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'health'
              ? 'border-[#F15A24] text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>System Health & Backups</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 1. AUDIT LOGS EXPLORER TAB */}
      {/* ==================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {auditError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{auditError}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search entity, ID, action, actor..."
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={auditEntityFilter}
                onChange={(e) => { setAuditEntityFilter(e.target.value); setAuditPage(1); }}
                className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
              >
                <option value="">All Entities</option>
                <option value="product">Products</option>
                <option value="order">Orders</option>
                <option value="quote">Quotes</option>
                <option value="category">Categories</option>
                <option value="brand">Brands</option>
                <option value="coupon">Coupons</option>
                <option value="document">Documents</option>
                <option value="system">System / Settings</option>
                <option value="user">Users / Staff</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
              >
                <option value="">All Actions</option>
                <option value="create">create</option>
                <option value="update">update</option>
                <option value="delete">delete</option>
                <option value="archive">archive</option>
                <option value="restore">restore</option>
                <option value="convert_to_order">convert_to_order</option>
              </select>

              <span className="text-xs text-slate-400 ml-auto md:ml-2">
                Showing <strong className="text-white">{filteredAuditLogs.length}</strong> of {auditTotal}
              </span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <DataTable<AuditLogItem>
            data={filteredAuditLogs}
            isLoading={auditLoading}
            idField="id"
            columns={[
              {
                key: 'createdAt',
                header: 'Timestamp',
                render: (log) => (
                  <div className="space-y-0.5">
                    <div className="text-white font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-slate-500 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                )
              },
              {
                key: 'actor',
                header: 'Actor / User',
                render: (log) => (
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">
                      {log.actorName || 'System'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {log.actorId ? `ID: ${log.actorId}` : (log.ip ? `IP: ${log.ip}` : 'Automated')}
                    </div>
                  </div>
                )
              },
              {
                key: 'entity',
                header: 'Target Entity',
                render: (log) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        {log.entity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={log.entityId}>
                      {log.entityId}
                    </div>
                  </div>
                )
              },
              {
                key: 'action',
                header: 'Action',
                render: (log) => {
                  let badgeVariant: any = 'info';
                  if (log.action.includes('delete')) badgeVariant = 'danger';
                  if (log.action.includes('create')) badgeVariant = 'success';
                  if (log.action.includes('archive')) badgeVariant = 'warning';
                  if (log.action.includes('convert')) badgeVariant = 'orange';
                  return <Badge variant={badgeVariant}>{log.action}</Badge>;
                }
              },
              {
                key: 'diffSummary',
                header: 'Change Summary',
                render: (log) => {
                  if (log.diff) {
                    const keys = Object.keys(log.diff);
                    return (
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs block">
                        Updated {keys.length} field(s): {keys.slice(0, 3).join(', ')}{keys.length > 3 ? '...' : ''}
                      </span>
                    );
                  }
                  if (log.after) {
                    return <span className="text-[11px] text-emerald-400 italic font-mono">Record created</span>;
                  }
                  if (log.before) {
                    return <span className="text-[11px] text-rose-400 italic font-mono">Record deleted</span>;
                  }
                  return <span className="text-slate-500 text-[11px]">-</span>;
                }
              },
              {
                key: 'actions',
                header: 'Inspect',
                render: (log) => (
                  <button
                    onClick={() => setSelectedAuditLog(log)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1 text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Diff</span>
                  </button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. BACKGROUND JOBS QUEUE TAB */}
      {/* ==================================================================== */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {jobsError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jobsError}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-[#F15A24] outline-none"
              >
                <option value="all">All Job Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Queue length: <strong className="text-white">{filteredJobs.length}</strong> jobs
            </div>
          </div>

          {/* Jobs DataTable */}
          <DataTable<BackgroundJobItem>
            data={filteredJobs}
            isLoading={jobsLoading}
            idField="id"
            columns={[
              {
                key: 'id',
                header: 'Job ID & Type',
                render: (job) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#F15A24]" />
                      <span className="font-bold text-white text-xs">{job.type}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{job.id}</div>
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (job) => getJobStatusBadge(job.status)
              },
              {
                key: 'attempts',
                header: 'Attempts',
                render: (job) => (
                  <span className="font-mono text-xs text-slate-300">
                    {job.attempts} / {job.max_attempts}
                  </span>
                )
              },
              {
                key: 'timing',
                header: 'Timestamps',
                render: (job) => (
                  <div className="space-y-0.5 text-[10px] font-mono">
                    <div className="text-slate-400">Queued: {new Date(job.created_at).toLocaleTimeString()}</div>
                    {job.completed_at && (
                      <div className="text-emerald-400">Done: {new Date(job.completed_at).toLocaleTimeString()}</div>
                    )}
                  </div>
                )
              },
              {
                key: 'last_error',
                header: 'Execution Output / Error',
                render: (job) => {
                  if (job.last_error) {
                    return (
                      <span className="text-[11px] text-rose-400 font-mono truncate max-w-xs block" title={job.last_error}>
                        Error: {job.last_error}
                      </span>
                    );
                  }
                  if (job.result) {
                    return (
                      <span className="text-[11px] text-emerald-400 font-mono truncate max-w-xs block">
                        Result: {JSON.stringify(job.result)}
                      </span>
                    );
                  }
                  return <span className="text-slate-500 text-[11px] italic">In progress / awaiting queue</span>;
                }
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (job) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
                      title="Inspect Payload & Result"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {(job.status === 'failed' || job.status === 'cancelled') && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 transition"
                        title="Re-queue Job"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(job.status === 'pending' || job.status === 'processing') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                        title="Cancel Job"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. SYSTEM HEALTH & DATABASE BACKUPS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {healthError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{healthError}</span>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>System Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400 uppercase tracking-wider">
                {healthData?.status || 'Online'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Node {healthData?.nodeVersion} on {healthData?.platform}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Server Uptime</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-black text-white font-mono">
                {healthData?.uptimeFormatted || '0h 0m 0s'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Continuous availability
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>RAM Usage (RSS)</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-purple-400 font-mono">
                {healthData?.memory.rssFormatted || '0 MB'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Heap Used: {healthData?.memory.heapUsedFormatted}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>SQLite DB File</span>
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {healthData?.database.sizeFormatted || '0 MB'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                WAL mode &bull; {healthData?.database.path}
              </div>
            </div>
          </div>

          {/* Database Table Entity Counts Grid */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F15A24]" />
              Database Record Inventory
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {healthData?.database.tableCounts && Object.entries(healthData.database.tableCounts).map(([table, count]) => (
                <div key={table} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono capitalize">
                    {table.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Disaster Recovery Actions */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Database Backup & Disaster Recovery
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Export an all-inclusive snapshot of products, categories, orders, customers, and configuration for disaster recovery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/api/admin/system/backup"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Database Backup (JSON)</span>
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRestoreOpen(true);
                  setRestoreConfirmText('');
                  setRestoreFile(null);
                  setRestoreJsonData(null);
                  setRestoreError(null);
                  setRestoreResult(null);
                }}
                className="border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 py-2.5"
              >
                <Upload className="w-4 h-4 mr-1.5 text-amber-400" />
                <span>Restore Database From Backup...</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* AUDIT LOG DIFF INSPECTOR MODAL */}
      {/* ==================================================================== */}
      {selectedAuditLog && (
        <Modal
          isOpen={!!selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
          title={`Audit Event: ${selectedAuditLog.entity.toUpperCase()} #${selectedAuditLog.entityId}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Action:</span>
                <span className="font-bold text-white">{selectedAuditLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Actor:</span>
                <span className="font-bold text-white">{selectedAuditLog.actorName || 'System'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IP:</span>
                <span className="text-slate-300">{selectedAuditLog.ip || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <span className="text-slate-300">{new Date(selectedAuditLog.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedAuditLog.diff ? (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Computed Field Differences</h4>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-60 font-mono text-xs">
                  <pre>{JSON.stringify(selectedAuditLog.diff, null, 2)}</pre>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Before State</h4>
                <div className="bg-slate-100 text-slate-800 p-2.5 rounded-xl overflow-x-auto max-h-48 font-mono text-[10px]">
                  <pre>{selectedAuditLog.before ? JSON.stringify(selectedAuditLog.before, null, 2) : 'null (None)'}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">After State</h4>
                <div className="bg-slate-100 text-slate-800 p-2.5 rounded-xl overflow-x-auto max-h-48 font-mono text-[10px]">
                  <pre>{selectedAuditLog.after ? JSON.stringify(selectedAuditLog.after, null, 2) : 'null (None)'}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedAuditLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* JOB PAYLOAD / RESULT INSPECTOR MODAL */}
      {/* ==================================================================== */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={`Job Inspector: ${selectedJob.type} (${selectedJob.id})`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-bold text-white capitalize">{selectedJob.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Attempts:</span>
                <span className="text-slate-300">{selectedJob.attempts} / {selectedJob.max_attempts}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Created:</span>
                <span className="text-slate-300">{new Date(selectedJob.created_at).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Completed:</span>
                <span className="text-slate-300">{selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            {selectedJob.last_error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-mono text-xs">
                <span className="font-bold block mb-1">Last Error:</span>
                {selectedJob.last_error}
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Payload JSON</h4>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-48 font-mono text-xs">
                <pre>{JSON.stringify(selectedJob.payload, null, 2)}</pre>
              </div>
            </div>

            {selectedJob.result && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Result JSON</h4>
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto max-h-48 font-mono text-xs">
                  <pre>{JSON.stringify(selectedJob.result, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* ENQUEUE JOB MODAL */}
      {/* ==================================================================== */}
      {isEnqueueOpen && (
        <Modal
          isOpen={isEnqueueOpen}
          onClose={() => setIsEnqueueOpen(false)}
          title="Enqueue Background Job"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEnqueueJob} className="space-y-4 text-xs text-slate-800">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Job Type *</label>
              <select
                value={enqueueType}
                onChange={(e) => setEnqueueType(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-xl font-bold"
              >
                <option value="sitemap_generation">sitemap_generation (Re-generate XML sitemap)</option>
                <option value="catalog_audit">catalog_audit (Scan broken images & prices)</option>
                <option value="product_research">product_research (Fetch vendor datasheet specs)</option>
                <option value="notification_dispatch">notification_dispatch (Send transactional message)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payload JSON</label>
              <textarea
                rows={4}
                value={enqueuePayload}
                onChange={(e) => setEnqueuePayload(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-xl font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEnqueueOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isEnqueuing} className="bg-[#F15A24] text-white">
                {isEnqueuing ? 'Enqueuing...' : 'Enqueue Job'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* RESTORE DATABASE MODAL */}
      {/* ==================================================================== */}
      {isRestoreOpen && (
        <Modal
          isOpen={isRestoreOpen}
          onClose={() => setIsRestoreOpen(false)}
          title="Restore Database from Backup"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleExecuteRestore} className="space-y-4 text-xs text-slate-800">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Destructive Operation Warning</span>
              </div>
              <p>
                Restoring a database replaces existing catalog and configuration data with the records present in your backup file.
              </p>
            </div>

            {restoreError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {restoreError}
              </div>
            )}

            {restoreResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1">
                <div className="font-bold">✓ {restoreResult.message}</div>
                <div className="text-[11px] font-mono">
                  Restored tables: {Object.keys(restoreResult.restoredCounts || {}).length}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Backup JSON File *</label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFileSelected}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#F15A24] file:text-white hover:file:bg-[#D94D1C] cursor-pointer"
                required
              />
              {restoreJsonData && (
                <div className="mt-1.5 p-2 bg-slate-100 rounded-lg text-[11px] text-slate-700 font-mono">
                  Backup Date: {restoreJsonData.meta?.exportedAt || 'Unknown'} &bull; Tables: {restoreJsonData.meta?.totalTables || 0}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Type <span className="font-mono text-rose-600 font-black">RESTORE DATABASE</span> to confirm *
              </label>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE DATABASE"
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsRestoreOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="danger"
                disabled={isRestoring || restoreConfirmText !== 'RESTORE DATABASE' || !restoreJsonData}
              >
                {isRestoring ? 'Restoring Database...' : 'Execute Restoration'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

