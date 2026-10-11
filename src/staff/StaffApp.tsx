import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Key, FileText, ShoppingCart, Wrench, FileQuestion,
  AlertTriangle, Lock, LogOut, ExternalLink, ChevronRight, Check, X,
  Clock, RefreshCw, Eye, UserCheck, ShieldAlert, BarChart3, Box, Receipt
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '../shared/components';
import { apiClient } from '../shared/apiClient';
import { PERMISSIONS } from '../shared/permissions';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  must_change_password?: boolean;
  branch_id?: string | null;
  warehouse_id?: string | null;
  last_login?: string | null;
  created_at?: string;
  roles?: Array<{ id: string; name: string }>;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  is_system?: boolean;
  permissions: string[];
}

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  before?: any;
  after?: any;
  diff?: any;
}

export const StaffApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Change password modal
  const [mustChangePassModal, setMustChangePassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'audit' | 'profile'>('dashboard');

  // Operational metrics
  const [metrics, setMetrics] = useState({
    pendingOrders: 0,
    openServices: 0,
    pendingQuotes: 0,
    lowStockCount: 0
  });

  // Staff & Roles state
  const [staffTab, setStaffTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Array<{ key: string; label: string }>>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // User form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);

  // Role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilterEntity, setAuditFilterEntity] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // Load session
  useEffect(() => {
    checkStaffSession();
  }, []);

  const checkStaffSession = async () => {
    setLoadingUser(true);
    try {
      const res = await apiClient.get<any>('/auth/me');
      if (res && res.authenticated && res.user) {
        const u = res.user;
        const hasAccess = u.role === 'admin' || u.role === 'super-admin' || u.role === 'staff' || (Array.isArray(u.permissions) && (u.permissions.includes('staff.access') || u.permissions.includes('*')));
        if (hasAccess) {
          setCurrentUser(u);
          if (u.must_change_password) {
            setMustChangePassModal(true);
          }
          loadDashboardData();
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (_) {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await apiClient.post<any>('/auth/staff/login', {
        email: emailInput,
        password: passwordInput
      });
      if (res.success && res.user) {
        const u = res.user;
        const hasAccess = u.role === 'admin' || u.role === 'super-admin' || u.role === 'staff' || (Array.isArray(u.permissions) && (u.permissions.includes('staff.access') || u.permissions.includes('*')));
        if (hasAccess) {
          setCurrentUser(u);
          if (u.must_change_password) {
            setMustChangePassModal(true);
          }
          loadDashboardData();
        } else {
          setLoginError('Account does not have permission to access the staff portal.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}
    setCurrentUser(null);
    window.location.reload();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangingPass(true);
    try {
      await apiClient.post('/staff/change-password', {
        currentPassword: currentPass,
        newPassword: newPass
      });
      setMustChangePassModal(false);
      setCurrentPass('');
      setNewPass('');
      alert('Password updated successfully.');
    } catch (err: any) {
      setChangePassError(err.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [ordersRes, svcsRes, quotesRes, prodsRes] = await Promise.all([
        apiClient.get<any[]>('/orders').catch(() => []),
        apiClient.get<any[]>('/service-requests').catch(() => []),
        apiClient.get<any[]>('/quotes').catch(() => []),
        apiClient.get<any>('/products?limit=100').catch(() => ({ items: [] }))
      ]);

      const pendingOrders = Array.isArray(ordersRes) ? ordersRes.filter(o => o.status === 'pending').length : 0;
      const openServices = Array.isArray(svcsRes) ? svcsRes.filter(s => s.status === 'pending').length : 0;
      const pendingQuotes = Array.isArray(quotesRes) ? quotesRes.filter(q => q.status === 'pending').length : 0;
      const prodsList = prodsRes.items || [];
      const lowStockCount = prodsList.filter((p: any) => (p.inventory?.available || p.stock_quantity || 0) < 5).length;

      setMetrics({ pendingOrders, openServices, pendingQuotes, lowStockCount });
    } catch (_) {}
  };

  const loadStaffData = async () => {
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        apiClient.get<StaffUser[]>('/staff/users').catch(() => []),
        apiClient.get<RoleItem[]>('/staff/roles').catch(() => []),
        apiClient.get<any[]>('/staff/permissions').catch(() => [])
      ]);
      setUsers(usersRes || []);
      setRoles(rolesRes || []);
      setAvailablePermissions(permsRes || []);
    } catch (_) {}
  };

  const loadAuditData = async () => {
    try {
      const q = auditFilterEntity ? `?entity=${encodeURIComponent(auditFilterEntity)}` : '';
      const res = await apiClient.get<any>(`/audit-logs${q}`);
      setAuditLogs(res?.items || []);
    } catch (_) {}
  };

  useEffect(() => {
    if (activeTab === 'staff') loadStaffData();
    if (activeTab === 'audit') loadAuditData();
  }, [activeTab, auditFilterEntity]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/staff/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        roleIds: newUserRoles
      });
      setUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRoles([]);
      loadStaffData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await apiClient.put(`/staff/roles/${editingRoleId}`, {
          name: newRoleName,
          description: newRoleDesc,
          permissions: newRolePerms
        });
      } else {
        await apiClient.post('/staff/roles', {
          name: newRoleName,
          description: newRoleDesc,
          permissions: newRolePerms
        });
      }
      setRoleModalOpen(false);
      setEditingRoleId(null);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      loadStaffData();
    } catch (err: any) {
      alert(err.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom role?')) return;
    try {
      await apiClient.delete(`/staff/roles/${roleId}`);
      loadStaffData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in -> Staff Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl border-slate-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#F15A24] text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">CamneX Staff Portal</h1>
            <p className="text-xs text-slate-500 mt-1">Enterprise Operations, POS & ERP Management</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="operator@camnexbd.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-2" disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Sign In to Staff App'}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-400">
            Authorized personnel only. Sessions and access attempts are monitored and logged.
          </div>
        </Card>
      </div>
    );
  }

  const hasWebsiteAccess = currentUser.role === 'admin' || currentUser.role === 'super-admin' || currentUser.permissions?.includes('website.access');
  const hasStaffManage = currentUser.role === 'admin' || currentUser.role === 'super-admin' || currentUser.permissions?.includes('staff.manage') || currentUser.permissions?.includes('roles.manage');
  const hasAuditRead = currentUser.role === 'admin' || currentUser.role === 'super-admin' || currentUser.permissions?.includes('audit.read');

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F15A24] text-white rounded-lg flex items-center justify-center font-black">
            C
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">CamneX Staff</div>
            <div className="text-[10px] text-slate-500 font-medium">Enterprise Management Surface</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasWebsiteAccess && (
            <a
              href="/admin"
              className="text-xs font-semibold text-slate-600 hover:text-[#F15A24] flex items-center gap-1 bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <span>Website Manager</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{currentUser.role}</div>
            </div>
            <Button size="sm" variant="outline" onClick={handleLogout} className="text-xs py-1 px-2.5">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1">
        {/* Left Nav */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Core Operations</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'dashboard' ? 'bg-[#F15A24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Operations Dashboard</span>
            </button>

            {hasStaffManage && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'staff' ? 'bg-[#F15A24] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Staff & Roles</span>
              </button>
            )}

            {hasAuditRead && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'audit' ? 'bg-[#F15A24] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Audit Logs</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'profile' ? 'bg-[#F15A24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>My Profile & Security</span>
            </button>
          </div>

          {/* Phase 2 Modules (Honest, disabled placeholders) */}
          <div className="space-y-1 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Phase 2 Modules</div>
            {[
              { label: 'POS / Counter Register', icon: Receipt },
              { label: 'Inventory & Stockrooms', icon: Box },
              { label: 'Purchasing & POs', icon: ShoppingCart },
              { label: 'Accounting & Invoices', icon: FileText },
              { label: 'Business Reports', icon: BarChart3 }
            ].map(m => (
              <div
                key={m.label}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed bg-slate-50/50"
              >
                <div className="flex items-center gap-2.5">
                  <m.icon className="w-4 h-4 opacity-50" />
                  <span>{m.label}</span>
                </div>
                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">Phase 2</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Operational Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live store activity connected to unified Business API</p>
              </div>

              {/* Live Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Pending Web Orders</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{metrics.pendingOrders}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Requires confirmation or dispatch</div>
                </Card>
                <Card className="p-4 border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Open Service Requests</div>
                  <div className="text-2xl font-black text-orange-600 mt-2">{metrics.openServices}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Field technician dispatch pending</div>
                </Card>
                <Card className="p-4 border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Pending Quotations</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{metrics.pendingQuotes}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Commercial proposals awaiting pricing</div>
                </Card>
                <Card className="p-4 border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Low Stock Products</div>
                  <div className="text-2xl font-black text-red-600 mt-2">{metrics.lowStockCount}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Under 5 units available</div>
                </Card>
              </div>

              {/* Honest Phase 2 Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">POS and Inventory modules activate in Phase 2</h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    The platform foundation is live: unified identity, server-side RBAC permissions, audit logging,
                    and stock movements ledger are fully active. Counter POS registers, barcode scanning, purchase orders,
                    and general ledger accounting screens will unlock in Phase 2.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff & Roles Management</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage user access privileges, credentials, and custom roles</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStaffTab('users')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${staffTab === 'users' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}
                  >
                    Users ({users.length})
                  </button>
                  <button
                    onClick={() => setStaffTab('roles')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${staffTab === 'roles' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}
                  >
                    Roles ({roles.length})
                  </button>
                </div>
              </div>

              {staffTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setUserModalOpen(true)}>
                      + Create Staff User
                    </Button>
                  </div>
                  <Card className="overflow-hidden border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Name & Email</th>
                          <th className="p-3">Assigned Roles</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Must Change Password</th>
                          <th className="p-3">Last Login</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-900">
                              <div>{u.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono font-normal">{u.email}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(u.roles && u.roles.length > 0) ? u.roles.map(r => (
                                  <Badge key={r.id} variant="neutral">{r.name}</Badge>
                                )) : (
                                  <Badge variant="neutral">{u.role}</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                            </td>
                            <td className="p-3 text-slate-500">
                              {u.must_change_password ? 'Yes' : 'No'}
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">
                              {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {staffTab === 'roles' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => {
                      setEditingRoleId(null);
                      setNewRoleName('');
                      setNewRoleDesc('');
                      setNewRolePerms([]);
                      setRoleModalOpen(true);
                    }}>
                      + Create Custom Role
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(r => (
                      <Card key={r.id} className="p-5 border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">{r.name}</h3>
                            {r.is_system ? (
                              <Badge variant="info">System</Badge>
                            ) : (
                              <Badge variant="neutral">Custom</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description || 'No description'}</p>
                          <div className="text-[11px] font-semibold text-slate-400 mt-4">
                            {r.permissions.length} Permissions Granted
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRoleId(r.id);
                              setNewRoleName(r.name);
                              setNewRoleDesc(r.description || '');
                              setNewRolePerms(r.permissions || []);
                              setRoleModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          {!r.is_system && (
                            <Button size="sm" variant="danger" onClick={() => handleDeleteRole(r.id)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Trail</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Immutable record of all state mutations across catalog, orders, and staff</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={auditFilterEntity}
                    onChange={(e) => setAuditFilterEntity(e.target.value)}
                    className="text-xs border rounded-lg px-3 py-1.5 bg-white text-slate-700"
                  >
                    <option value="">All Entities</option>
                    <option value="product">Products</option>
                    <option value="order">Orders</option>
                    <option value="inventory">Inventory</option>
                    <option value="user">Staff Users</option>
                    <option value="settings">Settings</option>
                  </select>
                  <Button size="sm" variant="outline" disabled className="opacity-50 cursor-not-allowed text-xs" title="Audit CSV export is reserved for Phase 2">
                    Export (Phase 2)
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          <span className="capitalize">{log.entity}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{log.entityId}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="neutral">{log.action}</Badge>
                        </td>
                        <td className="p-3 text-slate-600">
                          {log.actorName || log.actorId || 'System'}
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedAuditLog(log)}>
                            View Diff
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">My Profile & Security</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage operator credentials and session security</p>
              </div>

              <Card className="p-6 border-slate-200 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Operator Name</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{currentUser.name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Email Address</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{currentUser.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Assigned Surface Role</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{currentUser.role}</div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button size="sm" onClick={() => setMustChangePassModal(true)}>
                    Change Password
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Audit Log Diff Modal */}
      <Modal isOpen={!!selectedAuditLog} onClose={() => setSelectedAuditLog(null)} title="Audit Event Mutation Diff">
        {selectedAuditLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="neutral">{selectedAuditLog.entity}</Badge>
              <span className="font-bold">{selectedAuditLog.action}</span>
              <span className="text-slate-400">by {selectedAuditLog.actorName || 'System'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500 mb-1">Before State</div>
                <pre className="bg-slate-50 p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-60 border border-slate-200">
                  {selectedAuditLog.before ? JSON.stringify(selectedAuditLog.before, null, 2) : 'None (Created)'}
                </pre>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 mb-1">After State</div>
                <pre className="bg-slate-50 p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-60 border border-slate-200">
                  {selectedAuditLog.after ? JSON.stringify(selectedAuditLog.after, null, 2) : 'None (Deleted)'}
                </pre>
              </div>
            </div>

            {selectedAuditLog.diff && Object.keys(selectedAuditLog.diff).length > 0 && (
              <div>
                <div className="text-xs font-bold text-amber-700 mb-1">Field Mutation Diff ({'{ old, new }'})</div>
                <pre className="bg-amber-50/60 p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-40 border border-amber-200 text-amber-900">
                  {JSON.stringify(selectedAuditLog.diff, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={mustChangePassModal} onClose={() => setMustChangePassModal(false)} title="Update Account Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {changePassError && (
            <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {changePassError}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            required
          />
          <Input
            label="New Password (min 8 characters)"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setMustChangePassModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={changingPass}>
              {changingPass ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title="Create Staff Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            required
          />
          <Input
            label="Temporary Password"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Roles</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border p-2 rounded">
              {roles.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={newUserRoles.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) setNewUserRoles([...newUserRoles, r.id]);
                      else setNewUserRoles(newUserRoles.filter(id => id !== r.id));
                    }}
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Staff User</Button>
          </div>
        </form>
      </Modal>

      {/* Role Editor Modal */}
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title={editingRoleId ? 'Edit Role' : 'Create Custom Role'}>
        <form onSubmit={handleSaveRole} className="space-y-4">
          <Input
            label="Role Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded text-xs">
              {availablePermissions.map(p => (
                <label key={p.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRolePerms.includes(p.key)}
                    onChange={(e) => {
                      if (e.target.checked) setNewRolePerms([...newRolePerms, p.key]);
                      else setNewRolePerms(newRolePerms.filter(k => k !== p.key));
                    }}
                  />
                  <span className="font-mono text-[11px]">{p.key}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Role</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

