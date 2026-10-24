import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Globe,
  Server,
  Smartphone,
  Mail,
  Truck,
  CreditCard,
  Webhook,
  RotateCcw,
  Search,
  ExternalLink,
  Layers,
  Activity,
  Terminal,
  Check,
  X,
  Sliders,
  FileCode
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { Badge, Button, Modal } from '../common/UI';
import { ConfirmDialog } from './framework/ConfirmDialog';

interface IntegrationField {
  key: string;
  label: string;
  envKey?: string;
  type: 'text' | 'password' | 'url' | 'number' | 'boolean';
  secret?: boolean;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
}

interface SecretStatusInfo {
  configured: boolean;
  masked: string | null;
}

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  enabled: boolean;
  isCustom: boolean;
  isCritical: boolean;
  adapterStatus: 'integrated' | 'development_required' | string;
  isConfigured: boolean;
  completeness: {
    isComplete: boolean;
    requiredCount: number;
    configuredCount: number;
    missingFields: string[];
  };
  config: Record<string, any>;
  secretStatus: Record<string, SecretStatusInfo>;
  description: string;
  website: string;
  dependentFeatures: string[];
  codeConsumers: string[];
  fields: IntegrationField[];
  lastTestAt: string | null;
  lastTestStatus: string;
  lastTestMessage: string | null;
  version: number;
  updatedAt: string;
}

interface EnvVariableItem {
  key: string;
  category: string;
  label: string;
  isSecret: boolean;
  isMutable: boolean;
  immutableReason: string | null;
  description: string;
  value: string | null;
  secretStatus: SecretStatusInfo | null;
  source: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface ReconciliationReport {
  timestamp: string;
  summary: {
    discoveredInCodeCount: number;
    registeredInDbCount: number;
    syncedCount: number;
    missingRegistrationCount: number;
    customOrOrphanedCount: number;
    unresolvedVariableCount: number;
    conflictCount: number;
    isHealthy: boolean;
  };
  missingInDb: Array<{ id: string; name: string; category: string; consumers: string[] }>;
  registeredAndSynced: Array<{
    id: string;
    name: string;
    category: string;
    enabled: boolean;
    isConfigured: boolean;
    missingFields: string[];
    consumers: string[];
  }>;
  customOrOrphanedInDb: Array<{ id: string; name: string; category: string; isCustom: boolean }>;
  unresolvedVariables: Array<{ integrationId: string; integrationName: string; missingFields: string[] }>;
  conflicts: Array<{ type: string; message: string }>;
}

interface SnapshotItem {
  id: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  integrationCount: number;
  configCount: number;
}

interface IntegrationsListResponse {
  integrations: IntegrationItem[];
}

interface EnvListResponse {
  variables: EnvVariableItem[];
}

interface ReconciliationResponse {
  report: ReconciliationReport;
}

interface SnapshotsListResponse {
  snapshots: SnapshotItem[];
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; badgeColor: string }> = {
  authentication: {
    label: 'Authentication & OAuth',
    icon: <Key className="w-4 h-4 text-sky-400" />,
    badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
  },
  messaging_otp: {
    label: 'Phone OTP & SMS Gateways',
    icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  },
  security_captcha: {
    label: 'Bot Protection & CAPTCHA',
    icon: <Shield className="w-4 h-4 text-amber-400" />,
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  },
  messaging_email: {
    label: 'Transactional Email & SMTP',
    icon: <Mail className="w-4 h-4 text-indigo-400" />,
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
  },
  delivery_courier: {
    label: 'Delivery & Courier APIs',
    icon: <Truck className="w-4 h-4 text-orange-400" />,
    badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/30'
  },
  payments: {
    label: 'Payment Gateways & MFS',
    icon: <CreditCard className="w-4 h-4 text-pink-400" />,
    badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/30'
  },
  webhooks_erp: {
    label: 'Webhooks & ERP/POS Sync',
    icon: <Webhook className="w-4 h-4 text-purple-400" />,
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  },
  custom: {
    label: 'Custom Integrations',
    icon: <Sliders className="w-4 h-4 text-slate-400" />,
    badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
  }
};

export const ApiControlCenterModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registry' | 'environment' | 'reconciliation' | 'snapshots'>('registry');

  // Registry state
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail & Edit Drawer/Modal state
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [editSecrets, setEditSecrets] = useState<Record<string, string>>({});
  const [editEnabled, setEditEnabled] = useState<boolean>(false);
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const [integrationFeedback, setIntegrationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Connection test state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; status: string; message: string; testedAt: string }>>({});

  // Critical disable confirmation state
  const [criticalToggleTarget, setCriticalToggleTarget] = useState<{ item: IntegrationItem; nextEnabled: boolean } | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Delete / Purge confirmation state
  const [deleteTarget, setDeleteTarget] = useState<IntegrationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Custom Integration Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newIntName, setNewIntName] = useState('');
  const [newIntProvider, setNewIntProvider] = useState('');
  const [newIntCategory, setNewIntCategory] = useState('custom');
  const [newIntDescription, setNewIntDescription] = useState('');
  const [newIntEndpointUrl, setNewIntEndpointUrl] = useState('');
  const [newIntApiKey, setNewIntApiKey] = useState('');
  const [isCreatingInt, setIsCreatingInt] = useState(false);
  const [createIntError, setCreateIntError] = useState<string | null>(null);

  // Environment Variables state
  const [envVariables, setEnvVariables] = useState<EnvVariableItem[]>([]);
  const [envEdits, setEnvEdits] = useState<Record<string, string>>({});
  const [envFilter, setEnvFilter] = useState<'all' | 'mutable' | 'immutable'>('all');
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [envFeedback, setEnvFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reconciliation state
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Snapshots & Rollback state
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [rollbackTarget, setRollbackTarget] = useState<SnapshotItem | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchControlCenterData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [intRes, envRes, recRes, snapRes] = await Promise.all([
        apiFetch<IntegrationsListResponse>('/admin/integrations'),
        apiFetch<EnvListResponse>('/admin/integrations/env'),
        apiFetch<ReconciliationResponse>('/admin/integrations/reconciliation'),
        apiFetch<SnapshotsListResponse>('/admin/integrations/snapshots')
      ]);

      if (intRes?.integrations) setIntegrations(intRes.integrations);
      if (envRes?.variables) {
        setEnvVariables(envRes.variables);
        const initialEdits: Record<string, string> = {};
        for (const v of envRes.variables) {
          if (v.isMutable && !v.isSecret) {
            initialEdits[v.key] = v.value || '';
          }
        }
        setEnvEdits(initialEdits);
      }
      if (recRes?.report) setReconciliation(recRes.report);
      if (snapRes?.snapshots) setSnapshots(snapRes.snapshots);
    } catch (err: any) {
      setError(err.message || 'Failed to load Central API & Authentication Control Center.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControlCenterData();
  }, [fetchControlCenterData]);

  // Open Integration Detail Modal
  const openIntegrationDetail = (item: IntegrationItem) => {
    setSelectedIntegration(item);
    setEditConfig({ ...(item.config || {}) });
    setEditSecrets({});
    setEditEnabled(item.enabled);
    setIntegrationFeedback(null);
  };

  // Save Integration Config & Secrets
  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;
    setIsSavingIntegration(true);
    setIntegrationFeedback(null);

    try {
      const res = await apiFetch<{ success: boolean; integration: IntegrationItem }>(
        `/admin/integrations/${selectedIntegration.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            enabled: editEnabled,
            config: editConfig,
            secrets: editSecrets,
            version: selectedIntegration.version
          })
        }
      );

      if (res?.integration) {
        setSelectedIntegration(res.integration);
        setEditConfig({ ...(res.integration.config || {}) });
        setEditSecrets({});
        setIntegrations(prev => prev.map(i => (i.id === res.integration.id ? res.integration : i)));
        setIntegrationFeedback({
          type: 'success',
          message: 'Configuration saved, secrets encrypted at rest, and runtime updated immediately.'
        });
        fetchControlCenterData();
      }
    } catch (err: any) {
      setIntegrationFeedback({
        type: 'error',
        message: err.message || 'Failed to update integration.'
      });
    } finally {
      setIsSavingIntegration(false);
    }
  };

  // Run Safe Server-Side Connection Test
  const handleTestConnection = async (item: IntegrationItem, useModalEdits = false) => {
    setTestingId(item.id);
    try {
      const payload = useModalEdits
        ? { config: editConfig, secrets: editSecrets }
        : {};
      const res = await apiFetch<{ success: boolean; status: string; message: string; testedAt: string }>(
        `/admin/integrations/${item.id}/test`,
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      setTestResults(prev => ({ ...prev, [item.id]: res }));
      setIntegrations(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                lastTestAt: res.testedAt,
                lastTestStatus: res.status,
                lastTestMessage: res.message
              }
            : i
        )
      );
      if (selectedIntegration?.id === item.id) {
        setSelectedIntegration(prev =>
          prev
            ? {
                ...prev,
                lastTestAt: res.testedAt,
                lastTestStatus: res.status,
                lastTestMessage: res.message
              }
            : null
        );
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [item.id]: {
          success: false,
          status: 'failed',
          message: err.message || 'Connection test failed.',
          testedAt: new Date().toISOString()
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  // Toggle Integration Enabled/Disabled
  const handleToggleRequest = (item: IntegrationItem) => {
    const nextEnabled = !item.enabled;
    if (!nextEnabled && item.isCritical) {
      setCriticalToggleTarget({ item, nextEnabled });
      return;
    }
    executeToggle(item, nextEnabled, false);
  };

  const executeToggle = async (item: IntegrationItem, nextEnabled: boolean, confirmCritical: boolean) => {
    setIsToggling(true);
    try {
      const res = await apiFetch<{ success: boolean; integration: IntegrationItem }>(
        `/admin/integrations/${item.id}/toggle`,
        {
          method: 'POST',
          body: JSON.stringify({ enabled: nextEnabled, confirmCritical })
        }
      );
      if (res?.integration) {
        setIntegrations(prev => prev.map(i => (i.id === res.integration.id ? res.integration : i)));
        if (selectedIntegration?.id === res.integration.id) {
          setSelectedIntegration(res.integration);
          setEditEnabled(res.integration.enabled);
        }
      }
      setCriticalToggleTarget(null);
      fetchControlCenterData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle integration state.');
    } finally {
      setIsToggling(false);
    }
  };

  // Delete Custom Integration or Purge Credentials
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        mode: string;
        integration?: IntegrationItem;
        message: string;
      }>(`/admin/integrations/${deleteTarget.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmDelete: true })
      });

      if (res.mode === 'removed') {
        setIntegrations(prev => prev.filter(i => i.id !== deleteTarget.id));
        if (selectedIntegration?.id === deleteTarget.id) {
          setSelectedIntegration(null);
        }
      } else if (res.integration) {
        setIntegrations(prev => prev.map(i => (i.id === res.integration!.id ? res.integration! : i)));
        if (selectedIntegration?.id === res.integration.id) {
          setSelectedIntegration(res.integration);
          setEditEnabled(false);
          setEditSecrets({});
        }
      }
      setDeleteTarget(null);
      fetchControlCenterData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete/purge integration.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Custom Integration
  const handleCreateCustomIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingInt(true);
    setCreateIntError(null);
    try {
      const res = await apiFetch<{ success: boolean; integration: IntegrationItem }>('/admin/integrations', {
        method: 'POST',
        body: JSON.stringify({
          name: newIntName,
          provider: newIntProvider || newIntName,
          category: newIntCategory,
          description: newIntDescription,
          enabled: true,
          config: {
            endpointUrl: newIntEndpointUrl,
            timeoutMs: 8000
          },
          secrets: newIntApiKey ? { apiKey: newIntApiKey } : {}
        })
      });

      if (res?.integration) {
        setIntegrations(prev => [...prev, res.integration]);
        setAddModalOpen(false);
        setNewIntName('');
        setNewIntProvider('');
        setNewIntDescription('');
        setNewIntEndpointUrl('');
        setNewIntApiKey('');
        fetchControlCenterData();
      }
    } catch (err: any) {
      setCreateIntError(err.message || 'Failed to register integration.');
    } finally {
      setIsCreatingInt(false);
    }
  };

  // Save Runtime Environment Variables
  const handleSaveEnvironmentVariables = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEnv(true);
    setEnvFeedback(null);
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(envEdits)) {
        if (v !== undefined && v !== null) {
          payload[k] = v;
        }
      }
      const res = await apiFetch<{ success: boolean; updatedKeys: string[]; variables: EnvVariableItem[] }>(
        '/admin/integrations/env',
        {
          method: 'PUT',
          body: JSON.stringify({ updates: payload })
        }
      );
      if (res?.variables) {
        setEnvVariables(res.variables);
        // Clear secret rotation inputs after saving
        const refreshedEdits: Record<string, string> = {};
        for (const v of res.variables) {
          if (v.isMutable && !v.isSecret) {
            refreshedEdits[v.key] = v.value || '';
          }
        }
        setEnvEdits(refreshedEdits);
      }
      setEnvFeedback({
        type: 'success',
        message: `Updated ${res.updatedKeys?.length || 0} runtime variable(s) and synchronized active services.`
      });
      fetchControlCenterData();
    } catch (err: any) {
      setEnvFeedback({
        type: 'error',
        message: err.message || 'Failed to update environment variables.'
      });
    } finally {
      setIsSavingEnv(false);
    }
  };

  // Run Reconciliation & Repair
  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await apiFetch<{ report: ReconciliationReport; integrations: IntegrationItem[] }>(
        '/admin/integrations/reconcile',
        { method: 'POST' }
      );
      if (res?.report) setReconciliation(res.report);
      if (res?.integrations) setIntegrations(res.integrations);
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed.');
    } finally {
      setIsReconciling(false);
    }
  };

  // Execute Snapshot Rollback
  const handleExecuteRollback = async () => {
    if (!rollbackTarget) return;
    setIsRollingBack(true);
    try {
      await apiFetch(`/admin/integrations/rollback/${rollbackTarget.id}`, {
        method: 'POST'
      });
      setRollbackTarget(null);
      await fetchControlCenterData();
    } catch (err: any) {
      alert(err.message || 'Rollback failed.');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Filtered integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [integrations, selectedCategory, searchQuery]);

  // Filtered environment variables
  const filteredEnvVars = useMemo(() => {
    return envVariables.filter(v => {
      if (envFilter === 'mutable') return v.isMutable;
      if (envFilter === 'immutable') return !v.isMutable;
      return true;
    });
  }, [envVariables, envFilter]);

  const activeCount = integrations.filter(i => i.enabled).length;
  const configuredCount = integrations.filter(i => i.isConfigured).length;
  const healthyTestCount = integrations.filter(i => i.lastTestStatus === 'healthy').length;

  return (
    <div className="space-y-6">
      {/* Top Control Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F15A24]/15 border border-[#F15A24]/30 flex items-center justify-center text-[#F15A24]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-white tracking-tight flex items-center gap-2">
                <span>Central API, Authentication & Environment Control Center</span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                  Zero-cPanel Runtime
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Unified registry for OAuth, SMS & Email OTP, Cloudflare Turnstile, Couriers, Payment Gateways, Webhooks, and encrypted runtime variables.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchControlCenterData}
            disabled={loading}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-[#F15A24]' : ''}`} />
            Refresh Registry
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/60 text-xs"
          >
            <Activity className={`w-3.5 h-3.5 mr-1.5 ${isReconciling ? 'animate-spin' : ''}`} />
            Reconcile & Sync Runtime
          </Button>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* 4 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Registered Integrations</span>
            <Layers className="w-4 h-4 text-[#F15A24]" />
          </div>
          <div className="text-2xl font-black text-white font-heading">{integrations.length}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{activeCount} enabled</span>
            <span>·</span>
            <span>{configuredCount} configured</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Secret Vault Security</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 font-heading mt-1">AES-256-GCM</div>
          <div className="mt-2 text-[11px] text-slate-400">
            Write-only secrets · Zero plaintext API exposure
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Codebase Reconciliation</span>
            <FileCode className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-black text-white font-heading mt-1 flex items-center gap-2">
            {reconciliation?.summary.isHealthy ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 100% Synced
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Needs Review
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {reconciliation?.summary.discoveredInCodeCount || 17} code providers · {reconciliation?.summary.missingRegistrationCount || 0} missing
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Rollback Snapshots</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-heading">{snapshots.length}</div>
          <div className="mt-2 text-[11px] text-slate-400">
            {healthyTestCount} integration(s) verified healthy
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        {[
          { id: 'registry', label: `Integration Registry (${integrations.length})`, icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'environment', label: `Environment & Runtime Config (${envVariables.length})`, icon: <Terminal className="w-3.5 h-3.5" /> },
          { id: 'reconciliation', label: 'Codebase Reconciliation', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'snapshots', label: `Rollback Snapshots (${snapshots.length})`, icon: <RotateCcw className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#F15A24] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================================
          TAB 1: UNIFIED INTEGRATION REGISTRY
         ===================================================================== */}
      {activeTab === 'registry' && (
        <div className="space-y-5">
          {/* Category Filter + Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({integrations.length})
              </button>
              {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                const count = integrations.filter(i => i.category === catKey).length;
                if (count === 0) return null;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === catKey
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                    <span className="text-[10px] text-slate-500">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search provider, ID, route..."
                className="w-full bg-slate-900 border border-slate-800 text-white pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#F15A24]"
              />
            </div>
          </div>

          {/* Integration Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIntegrations.map(item => {
              const catMeta = CATEGORY_META[item.category] || CATEGORY_META.custom;
              const liveTest = testResults[item.id];
              const effectiveTestStatus = liveTest?.status || item.lastTestStatus;
              const effectiveTestMsg = liveTest?.message || item.lastTestMessage;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl bg-slate-950 border transition-all flex flex-col justify-between ${
                    item.enabled
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-slate-900 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Row: Category Badge, Critical Badge, Enabled Switch */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.badgeColor}`}>
                          {catMeta.icon}
                          <span>{catMeta.label}</span>
                        </span>
                        {item.isCritical && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            Critical Service
                          </span>
                        )}
                        {item.adapterStatus === 'development_required' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Catalogued Adapter
                          </span>
                        )}
                      </div>

                      {/* Enable / Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleRequest(item)}
                        disabled={isToggling}
                        title={item.enabled ? 'Click to Disable Integration' : 'Click to Enable Integration'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          item.enabled
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{item.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{item.name}</h3>
                        <span className="text-[11px] font-mono text-slate-500">({item.id})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    {/* Completeness & Secret Status Pills */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Configuration Completeness:</span>
                        {item.isConfigured ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete ({item.completeness.configuredCount}/{item.completeness.requiredCount} required)
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Missing: {item.completeness.missingFields.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Masked Secret Indicators */}
                      {Object.keys(item.secretStatus || {}).length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                          {Object.entries(item.secretStatus).map(([secKey, secInfo]) => (
                            <span
                              key={secKey}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                                secInfo.configured
                                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>{secKey}:</span>
                              <strong>{secInfo.configured ? secInfo.masked : 'Not Set'}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Last Connection Test Result Banner */}
                    {effectiveTestMsg && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] mb-3 flex items-start gap-2 border ${
                          effectiveTestStatus === 'healthy'
                            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                            : effectiveTestStatus === 'ip_restricted'
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                        }`}
                      >
                        {effectiveTestStatus === 'healthy' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{effectiveTestMsg}</div>
                          {item.lastTestAt && (
                            <div className="text-[10px] opacity-75 mt-0.5">
                              Tested: {new Date(item.lastTestAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Dependent Features Count & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 truncate">
                      <span className="font-semibold text-slate-300">{item.dependentFeatures.length}</span> dependent feature(s)
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(item, false)}
                        disabled={testingId === item.id}
                        className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs py-1 px-2.5"
                      >
                        {testingId === item.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-[#F15A24]" />
                        ) : (
                          <Play className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        )}
                        Test
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => openIntegrationDetail(item)}
                        className="bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold py-1 px-3 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CENTRAL APPLICATION CONFIGURATION & ENVIRONMENT VARIABLES
         ===================================================================== */}
      {activeTab === 'environment' && (
        <div className="space-y-5">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#F15A24]" />
                <span>Central Runtime Configuration & Environment Variables</span>
              </h3>
              <p className="text-xs text-slate-400">
                <strong>Mutable Runtime Settings</strong> update active backend behavior immediately without visiting cPanel.{' '}
                <strong>Secret Variables</strong> are encrypted with AES-256-GCM and are strictly write-only after saving.{' '}
                <strong>Immutable Infrastructure Settings</strong> (<code className="text-amber-300">PORT</code>, <code className="text-amber-300">DB_*</code>, <code className="text-amber-300">ENCRYPTION_KEY</code>) are bound at process startup and displayed read-only for operational clarity.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {(['all', 'mutable', 'immutable'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEnvFilter(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    envFilter === mode
                      ? 'bg-[#F15A24] text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mode === 'all' ? 'All Variables' : mode === 'mutable' ? 'Mutable Runtime' : 'Immutable Infra'}
                </button>
              ))}
            </div>
          </div>

          {envFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                envFeedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-800 text-rose-200'
              }`}
            >
              {envFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{envFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveEnvironmentVariables} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-800/80">
              {filteredEnvVars.map(item => (
                <div key={item.key} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-900/40">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-xs font-bold font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {item.key}
                      </code>
                      <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                      {item.isSecret && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Write-Only Secret
                        </span>
                      )}
                      {!item.isMutable ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          Immutable Infrastructure
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          Dynamic Runtime
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">Source: {item.source}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                    {!item.isMutable && item.immutableReason && (
                      <p className="text-[11px] text-amber-400/90">
                        Why immutable: {item.immutableReason}
                      </p>
                    )}
                  </div>

                  <div className="w-full lg:w-96 shrink-0">
                    {!item.isMutable ? (
                      <div className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 flex items-center justify-between">
                        <span>
                          {item.isSecret
                            ? item.secretStatus?.configured
                              ? '•••••••• (Protected Bootstrap Secret)'
                              : 'Not Configured'
                            : item.value || '(default)'}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ) : item.isSecret ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={item.secretStatus?.configured ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                            {item.secretStatus?.configured ? `Configured (${item.secretStatus.masked})` : 'Unconfigured'}
                          </span>
                          <span className="text-slate-500">Leave blank to keep existing secret</span>
                        </div>
                        <input
                          type="password"
                          value={envEdits[item.key] || ''}
                          onChange={e => setEnvEdits(prev => ({ ...prev, [item.key]: e.target.value }))}
                          placeholder={item.secretStatus?.configured ? 'Enter new secret to rotate/replace...' : 'Enter new secret value...'}
                          className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#F15A24]"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={envEdits[item.key] ?? item.value ?? ''}
                        onChange={e => setEnvEdits(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#F15A24]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Changes to mutable runtime settings are validated, snapshotted, and applied atomically.
              </span>
              <Button
                type="submit"
                disabled={isSavingEnv}
                className="bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold px-5 py-2 flex items-center gap-1.5"
              >
                {isSavingEnv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save & Apply Runtime Variables
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 3: CODEBASE VS DATABASE VS RUNTIME RECONCILIATION
         ===================================================================== */}
      {activeTab === 'reconciliation' && reconciliation && (
        <div className="space-y-5">
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>3-Way Integration Reconciliation Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Compares (1) Providers discovered in repository code, (2) Records registered in the database, and (3) Active runtime consumers.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleRunReconciliation}
              disabled={isReconciling}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReconciling ? 'animate-spin' : ''}`} />
              Run Auto-Discovery & Repair Now
            </Button>
          </div>

          {reconciliation.unresolvedVariables.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/70 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Enabled Integrations with Missing Required Fields ({reconciliation.unresolvedVariables.length})</span>
              </div>
              <div className="space-y-1">
                {reconciliation.unresolvedVariables.map(u => (
                  <div key={u.integrationId} className="text-xs text-amber-200/90 font-mono">
                    • {u.integrationName} ({u.integrationId}): Missing [{u.missingFields.join(', ')}]
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-white">
              Discovered Codebase Integrations & Runtime Consumer Mapping ({reconciliation.registeredAndSynced.length})
            </div>
            <div className="divide-y divide-slate-800/80">
              {reconciliation.registeredAndSynced.map(row => (
                <div key={row.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{row.name}</span>
                      <code className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">{row.id}</code>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {row.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Consumers: {row.consumers.join(' · ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {row.isConfigured ? (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered & Configured
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        Registered (Awaiting Credentials: {row.missingFields.join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: SNAPSHOTS & ATOMIC ROLLBACK
         ===================================================================== */}
      {activeTab === 'snapshots' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Last-Known-Good Configuration Snapshots</h3>
              <p className="text-xs text-slate-400">
                Every edit, toggle, or secret rotation automatically creates an encrypted recovery snapshot before applying changes.
              </p>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No configuration snapshots recorded yet. Snapshots are created automatically when you edit or toggle any integration.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {snapshots.map(snap => (
                <div key={snap.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
                        {snap.id}
                      </code>
                      <span className="text-xs font-bold text-white">{snap.reason}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Created by <strong>{snap.createdBy}</strong> on {new Date(snap.createdAt).toLocaleString()} ·{' '}
                      {snap.integrationCount} integrations · {snap.configCount} runtime vars
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRollbackTarget(snap)}
                    className="border-purple-700/60 text-purple-300 hover:bg-purple-950/50 text-xs shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Rollback to Snapshot
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          INTEGRATION DETAIL & CREDENTIAL EDITOR MODAL
         ===================================================================== */}
      {selectedIntegration && (
        <Modal
          isOpen={Boolean(selectedIntegration)}
          onClose={() => setSelectedIntegration(null)}
          title={`Configure Integration — ${selectedIntegration.name}`}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveIntegration} className="space-y-5 text-slate-900">
            {/* Top Status Summary */}
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>Provider ID:</span>
                  <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300">{selectedIntegration.id}</code>
                  {selectedIntegration.isCritical && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                      Critical Service
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{selectedIntegration.description}</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                <input
                  type="checkbox"
                  checked={editEnabled}
                  onChange={e => setEditEnabled(e.target.checked)}
                  className="rounded text-[#F15A24] w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  {editEnabled ? 'Integration Enabled' : 'Integration Disabled'}
                </span>
              </label>
            </div>

            {integrationFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  integrationFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {integrationFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{integrationFeedback.message}</span>
              </div>
            )}

            {/* Dynamic Configuration & Write-Only Secret Fields */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Credentials & Runtime Parameters
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {selectedIntegration.fields.map(field => {
                  const isSec = Boolean(field.secret);
                  const secMeta = selectedIntegration.secretStatus?.[field.key];

                  if (field.type === 'boolean') {
                    return (
                      <div key={field.key} className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editConfig[field.key] ?? field.defaultValue)}
                            onChange={e => setEditConfig(prev => ({ ...prev, [field.key]: e.target.checked }))}
                            className="rounded text-[#F15A24] w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">{field.label}</span>
                        </label>
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className={field.type === 'url' ? 'md:col-span-2' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-rose-500">*</span>}
                          {field.envKey && (
                            <code className="text-[10px] font-mono text-slate-400 ml-1">({field.envKey})</code>
                          )}
                        </label>
                        {isSec && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              secMeta?.configured
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {secMeta?.configured ? `Configured (${secMeta.masked})` : 'Not Set'}
                          </span>
                        )}
                      </div>

                      {isSec ? (
                        <input
                          type="password"
                          value={editSecrets[field.key] || ''}
                          onChange={e => setEditSecrets(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={
                            secMeta?.configured
                              ? 'Leave blank to keep existing encrypted secret, or enter new value to rotate...'
                              : field.placeholder || `Enter ${field.label}...`
                          }
                          className="w-full bg-white border border-slate-300 text-slate-900 p-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#F15A24]"
                        />
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={editConfig[field.key] ?? field.defaultValue ?? ''}
                          onChange={e =>
                            setEditConfig(prev => ({
                              ...prev,
                              [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value
                            }))
                          }
                          placeholder={field.placeholder || ''}
                          className="w-full bg-white border border-slate-300 text-slate-900 p-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#F15A24]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dependent Features & Code Consumers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5">Dependent Storefront Features & Routes</div>
                <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                  {selectedIntegration.dependentFeatures.map((df, idx) => (
                    <li key={idx}>• {df}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5">Repository Code Consumers</div>
                <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                  {selectedIntegration.codeConsumers.map((cc, idx) => (
                    <li key={idx}>• {cc}</li>
                  ))}
                </ul>
                {selectedIntegration.website && (
                  <a
                    href={selectedIntegration.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F15A24] hover:underline mt-2"
                  >
                    <span>Open Provider Developer Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTarget(selectedIntegration)}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {selectedIntegration.isCustom ? 'Delete Integration' : 'Purge Credentials'}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection(selectedIntegration, true)}
                  disabled={testingId === selectedIntegration.id}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                >
                  {testingId === selectedIntegration.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  )}
                  Test Connection
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIntegration(null)}>
                  Close
                </Button>
                <Button type="submit" size="sm" disabled={isSavingIntegration} className="bg-[#F15A24] text-white font-bold">
                  {isSavingIntegration ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save & Apply Runtime
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================================
          ADD CUSTOM INTEGRATION MODAL
         ===================================================================== */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Register External API / Custom Integration"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateCustomIntegration} className="space-y-4 text-slate-900">
            {createIntError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createIntError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Integration Display Name *</label>
              <input
                type="text"
                required
                value={newIntName}
                onChange={e => setNewIntName(e.target.value)}
                placeholder="e.g. ERPNext Inventory Sync / SSLCommerz Gateway"
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Provider Slug *</label>
                <input
                  type="text"
                  required
                  value={newIntProvider}
                  onChange={e => setNewIntProvider(e.target.value)}
                  placeholder="e.g. erpnext"
                  className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newIntCategory}
                  onChange={e => setNewIntCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs"
                >
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">API Endpoint URL (SSRF Validated) *</label>
              <input
                type="url"
                required
                value={newIntEndpointUrl}
                onChange={e => setNewIntEndpointUrl(e.target.value)}
                placeholder="https://api.partner-service.com/v1/sync"
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">API Secret / Bearer Token (Encrypted at Rest)</label>
              <input
                type="password"
                value={newIntApiKey}
                onChange={e => setNewIntApiKey(e.target.value)}
                placeholder="Secret token or API key..."
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                rows={2}
                value={newIntDescription}
                onChange={e => setNewIntDescription(e.target.value)}
                placeholder="Purpose and dependent workflows..."
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreatingInt} className="bg-[#F15A24] text-white font-bold">
                {isCreatingInt ? 'Registering...' : 'Register Integration'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM CRITICAL DISABLE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(criticalToggleTarget)}
        title={`Disable Critical Service: ${criticalToggleTarget?.item.name}?`}
        message={`WARNING: "${criticalToggleTarget?.item.name}" is marked as a critical production service. Disabling it will immediately deactivate its dependent storefront features (${criticalToggleTarget?.item.dependentFeatures.slice(0, 2).join(', ')}) at runtime.`}
        confirmLabel="Disable Service Now"
        variant="danger"
        isLoading={isToggling}
        onConfirm={() => {
          if (criticalToggleTarget) {
            executeToggle(criticalToggleTarget.item, false, true);
          }
        }}
        onCancel={() => setCriticalToggleTarget(null)}
      />

      {/* CONFIRM DELETE / PURGE CREDENTIALS DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.isCustom
            ? `Delete Custom Integration "${deleteTarget?.name}"?`
            : `Purge Stored Credentials for "${deleteTarget?.name}"?`
        }
        message={
          deleteTarget?.isCustom
            ? `This will permanently remove custom integration "${deleteTarget?.name}" and its encrypted secrets from the registry.`
            : `This will securely wipe all encrypted secrets for "${deleteTarget?.name}" and disable it at runtime. The integration definition will remain in the registry so you can re-enter credentials at any time.`
        }
        confirmLabel={deleteTarget?.isCustom ? 'Delete Integration' : 'Purge Credentials & Disable'}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* CONFIRM SNAPSHOT ROLLBACK DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(rollbackTarget)}
        title={`Rollback to Snapshot ${rollbackTarget?.id}?`}
        message={`This will atomically restore all integrations and runtime configuration variables to the state captured on ${
          rollbackTarget ? new Date(rollbackTarget.createdAt).toLocaleString() : ''
        } (${rollbackTarget?.reason}). A backup snapshot of your current state will be saved automatically before rolling back.`}
        confirmLabel="Execute Atomic Rollback"
        variant="warning"
        isLoading={isRollingBack}
        onConfirm={handleExecuteRollback}
        onCancel={() => setRollbackTarget(null)}
      />
    </div>
  );
};
