import React, { useState, useEffect } from 'react';
import { Building2, Save, Check, FileText, Phone, MapPin, Landmark, ShieldCheck, Download, Upload, Users, Award, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../shared/apiClient';
import { MediaPickerModal } from './MediaLibraryModal';

const DEFAULT_FOUNDERS = [
  {
    id: 'founder-heon-khondokar',
    roleType: 'founder',
    name: 'Heon Khondokar',
    role: 'Founder & Engineer, CamneX Bangladesh',
    bio: 'Heon Khondokar leads technical delivery at CamneX Bangladesh, bringing practical engineering experience across IT support, networking, CCTV deployment, IT infrastructure, and system troubleshooting. He works directly with residential, commercial, and organizational clients to plan, configure, and support reliable security, networking, and IT solutions.',
    expertise: ['IT Support', 'Networking', 'CCTV Deployment', 'IT Infrastructure', 'Troubleshooting'],
    responsibilities: 'Managing technical delivery and helping customers implement security, networking, and IT solutions.',
    photoUrl: '',
    order: 1,
    socialLinks: { linkedin: '', facebook: '', email: 'contact@camnexbd.com' }
  },
  {
    id: 'cofounder-camnex',
    roleType: 'cofounder',
    name: '',
    role: 'Co-Founder, CamneX Bangladesh',
    bio: '',
    expertise: [],
    responsibilities: '',
    photoUrl: '',
    order: 2,
    socialLinks: { linkedin: '', facebook: '', email: '' }
  }
];

const DEFAULT_CERTIFICATIONS = [
  {
    id: 'cred-hikvision',
    title: 'Hikvision Authorized Partner',
    issuer: 'Hikvision',
    status: 'Verified Brand Credential',
    description: 'Authorized partner for Hikvision surveillance cameras, NVR/DVR recording systems, and security hardware.',
    logoUrl: '/images/brands/hikvision.svg',
    documentUrl: null,
    documentStatus: 'Supporting certificate document awaiting upload in Website Manager'
  },
  {
    id: 'cred-zkteco',
    title: 'ZKTeco Authorized Installer',
    issuer: 'ZKTeco',
    status: 'Verified Brand Credential',
    description: 'Authorized installer for ZKTeco biometric time attendance, access control terminals, and entrance control systems.',
    logoUrl: '/images/brands/zkteco.svg',
    documentUrl: null,
    documentStatus: 'Supporting certificate document awaiting upload in Website Manager'
  }
];

export const CompanyProfileModule: React.FC = () => {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaTarget, setMediaTarget] = useState<{ type: 'pdf' | 'founder_photo' | 'cert_doc'; index?: number } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any>('/company/profile');
      const loaded = data || {};
      if (!Array.isArray(loaded.founders) || loaded.founders.length === 0) {
        loaded.founders = DEFAULT_FOUNDERS;
      }
      if (!Array.isArray(loaded.certifications) || loaded.certifications.length === 0) {
        loaded.certifications = DEFAULT_CERTIFICATIONS;
      }
      setProfile(loaded);
    } catch (err: any) {
      setError(err.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFounderChange = (index: number, field: string, value: any) => {
    setProfile((prev: any) => {
      const founders = [...(prev.founders || DEFAULT_FOUNDERS)];
      founders[index] = { ...founders[index], [field]: value };
      return { ...prev, founders };
    });
  };

  const handleFounderSocialChange = (index: number, key: string, value: string) => {
    setProfile((prev: any) => {
      const founders = [...(prev.founders || DEFAULT_FOUNDERS)];
      const socialLinks = { ...(founders[index]?.socialLinks || {}), [key]: value };
      founders[index] = { ...founders[index], socialLinks };
      return { ...prev, founders };
    });
  };

  const handleCertChange = (index: number, field: string, value: any) => {
    setProfile((prev: any) => {
      const certs = [...(prev.certifications || DEFAULT_CERTIFICATIONS)];
      certs[index] = { ...certs[index], [field]: value };
      return { ...prev, certifications: certs };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.put<any>('/company/profile', profile);
      setProfile(updated || profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading company profile...</span>
      </div>
    );
  }

  const foundersList: any[] = Array.isArray(profile.founders) && profile.founders.length > 0 ? profile.founders : DEFAULT_FOUNDERS;
  const certsList: any[] = Array.isArray(profile.certifications) && profile.certifications.length > 0 ? profile.certifications : DEFAULT_CERTIFICATIONS;

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#F15A24]" />
            <span>Company Profile, Founders & Institutional Credentials</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Canonical corporate record serving /company-profile, /why-choose-us, /certifications, and /contact.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>Saved successfully!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* SECTION 1: Core Identity & Mission/Vision */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building2 className="w-4 h-4 text-[#F15A24]" />
          <span>1. Core Identity, Overview & Mission / Vision</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Registered Name</label>
            <input
              type="text"
              value={profile.legal_name || ''}
              onChange={(e) => handleFieldChange('legal_name', e.target.value)}
              placeholder="CamneX Bangladesh"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Commercial Trade Name</label>
            <input
              type="text"
              value={profile.trade_name || ''}
              onChange={(e) => handleFieldChange('trade_name', e.target.value)}
              placeholder="CamneX"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Introduction / Tagline</label>
            <input
              type="text"
              value={profile.tagline || ''}
              onChange={(e) => handleFieldChange('tagline', e.target.value)}
              placeholder="CamneX Bangladesh provides security, networking, and IT solutions..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Company Overview Summary</label>
            <textarea
              rows={2}
              value={profile.experience_summary || ''}
              onChange={(e) => handleFieldChange('experience_summary', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Mission Statement</label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                {profile.mission_is_proposed !== false ? 'Proposed (Editable)' : 'Reviewed'}
              </span>
            </div>
            <textarea
              rows={2}
              value={profile.mission || ''}
              onChange={(e) => {
                handleFieldChange('mission', e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Vision Statement</label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                {profile.vision_is_proposed !== false ? 'Proposed (Editable)' : 'Reviewed'}
              </span>
            </div>
            <textarea
              rows={2}
              value={profile.vision || ''}
              onChange={(e) => {
                handleFieldChange('vision', e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Founders & Leadership (Founder & Co-Founder) */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F15A24]" />
            <span>2. Meet Our Founders — Founder & Co-Founder Profiles</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Displayed on the Company Profile page (/company-profile)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {foundersList.map((f: any, idx: number) => {
            const isCoFounder = f.roleType === 'cofounder' || idx === 1;
            const missingFields: string[] = [];
            if (!f.name || !String(f.name).trim()) missingFields.push('Full Name');
            if (!f.role || !String(f.role).trim()) missingFields.push('Role Title');
            if (!f.bio || !String(f.bio).trim()) missingFields.push('Biography');
            if (!f.photoUrl || !String(f.photoUrl).trim()) missingFields.push('Profile Photograph');

            return (
              <div key={f.id || idx} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                    {isCoFounder ? 'Card 2: Co-Founder Profile' : 'Card 1: Founder Profile'}
                  </span>
                  {missingFields.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                      <AlertCircle className="w-3 h-3" />
                      <span>Missing: {missingFields.join(', ')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      <span>Complete</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={f.name || ''}
                      onChange={(e) => handleFounderChange(idx, 'name', e.target.value)}
                      placeholder={isCoFounder ? 'Enter Co-Founder full name' : 'Heon Khondokar'}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={f.order || idx + 1}
                      onChange={(e) => handleFounderChange(idx, 'order', parseInt(e.target.value) || idx + 1)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={f.role || ''}
                    onChange={(e) => handleFounderChange(idx, 'role', e.target.value)}
                    placeholder={isCoFounder ? 'Co-Founder, CamneX Bangladesh' : 'Founder & Engineer, CamneX Bangladesh'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Biography</label>
                  <textarea
                    rows={4}
                    value={f.bio || ''}
                    onChange={(e) => handleFounderChange(idx, 'bio', e.target.value)}
                    placeholder={isCoFounder ? 'Enter verified biography and responsibilities for the Co-Founder...' : 'Founder biography...'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Core Responsibilities</label>
                  <input
                    type="text"
                    value={f.responsibilities || ''}
                    onChange={(e) => handleFounderChange(idx, 'responsibilities', e.target.value)}
                    placeholder="Managing technical delivery and helping customers implement solutions..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Photograph URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={f.photoUrl || ''}
                      onChange={(e) => handleFounderChange(idx, 'photoUrl', e.target.value)}
                      placeholder="Upload or select portrait photograph from Media Library"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaTarget({ type: 'founder_photo', index: idx })}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select Photo</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">LinkedIn Profile URL (Optional)</label>
                    <input
                      type="text"
                      value={f.socialLinks?.linkedin || ''}
                      onChange={(e) => handleFounderSocialChange(idx, 'linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contact Email (Optional)</label>
                    <input
                      type="email"
                      value={f.socialLinks?.email || ''}
                      onChange={(e) => handleFounderSocialChange(idx, 'email', e.target.value)}
                      placeholder="contact@camnexbd.com"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Verified Brand Credentials & Supporting Certificate Documents */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F15A24]" />
            <span>3. Verified Brand Credentials & Supporting Documents</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Displayed on /certifications and /why-choose-us
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certsList.map((cert: any, idx: number) => (
            <div key={cert.id || idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Credential Title</label>
                <input
                  type="text"
                  value={cert.title || ''}
                  onChange={(e) => handleCertChange(idx, 'title', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issuing Brand / Organization</label>
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => handleCertChange(idx, 'issuer', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scope / Description</label>
                <textarea
                  rows={2}
                  value={cert.description || ''}
                  onChange={(e) => handleCertChange(idx, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Supporting Certificate Document URL (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cert.documentUrl || ''}
                    onChange={(e) => handleCertChange(idx, 'documentUrl', e.target.value || null)}
                    placeholder="Leave blank until official certificate document is uploaded"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaTarget({ type: 'cert_doc', index: idx })}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Official Contact & Communications */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Phone className="w-4 h-4 text-[#F15A24]" />
          <span>4. Official Contact & Communications</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Official Phone</label>
            <input
              type="text"
              value={profile.primary_phone || ''}
              onChange={(e) => handleFieldChange('primary_phone', e.target.value)}
              placeholder="+880 1540-535150"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">General Contact Email</label>
            <input
              type="email"
              value={profile.contact_email || ''}
              onChange={(e) => handleFieldChange('contact_email', e.target.value)}
              placeholder="contact@camnexbd.com"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Business</label>
            <input
              type="text"
              value={profile.whatsapp || ''}
              onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
              placeholder="8801540535150"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Physical Addresses */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <MapPin className="w-4 h-4 text-[#F15A24]" />
          <span>5. Physical Address</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Verified Office & Shop Address</label>
            <textarea
              rows={2}
              value={profile.registered_address || ''}
              onChange={(e) => {
                handleFieldChange('registered_address', e.target.value);
                handleFieldChange('corporate_office', e.target.value);
              }}
              placeholder="Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207, Bangladesh"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: Downloadable PDF Brochure */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Download className="w-4 h-4 text-[#F15A24]" />
          <span>6. Downloadable PDF Brochure (Optional)</span>
        </h3>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Company Profile PDF URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={profile.pdf_url || ''}
              onChange={(e) => handleFieldChange('pdf_url', e.target.value || null)}
              placeholder="e.g. /uploads/CamneX_Corporate_Profile.pdf"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#F15A24]"
            />
            <button
              type="button"
              onClick={() => setMediaTarget({ type: 'pdf' })}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Media</span>
            </button>
            {profile.pdf_url && (
              <button
                type="button"
                onClick={() => handleFieldChange('pdf_url', null)}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-sm font-bold transition-all shadow-lg disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Corporate Profile'}</span>
        </button>
      </div>

      {mediaTarget && (
        <MediaPickerModal
          isOpen={Boolean(mediaTarget)}
          onSelect={(url) => {
            if (mediaTarget.type === 'pdf') {
              handleFieldChange('pdf_url', url);
            } else if (mediaTarget.type === 'founder_photo' && typeof mediaTarget.index === 'number') {
              handleFounderChange(mediaTarget.index, 'photoUrl', url);
            } else if (mediaTarget.type === 'cert_doc' && typeof mediaTarget.index === 'number') {
              handleCertChange(mediaTarget.index, 'documentUrl', url);
            }
            setMediaTarget(null);
          }}
          onClose={() => setMediaTarget(null)}
        />
      )}
    </form>
  );
};
