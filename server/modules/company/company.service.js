const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class CompanyService {
  getDefaultProfile() {
    return {
      legal_name: 'CamneX Bangladesh',
      trade_name: 'CamneX',
      slogan: 'Eyes On, Worries Gone.',
      website: 'https://camnexbd.com',
      tagline: 'Eyes On, Worries Gone. CamneX Bangladesh provides security, networking, and IT solutions to help homes, businesses, and organizations build safer, more connected environments.',
      mission: 'To provide dependable security, surveillance, networking, and IT solutions tailored to each customer\'s practical requirements.',
      mission_is_proposed: true,
      vision: 'To be a trusted partner in Bangladesh for practical, well-supported security, connectivity, and technology infrastructure.',
      vision_is_proposed: true,
      founded_year: null,
      registration_number: null,
      bin: null,
      tin: null,
      trade_license_number: null,
      tax_circle: null,
      vat_reg_number: null,
      contact_email: 'contact@camnexbd.com',
      sales_email: 'contact@camnexbd.com',
      support_email: 'contact@camnexbd.com',
      primary_phone: '+880 1540-535150',
      secondary_phone: '+880 1410-085848',
      hotline: null,
      emergency_support_phone: '+880 1540-535150',
      whatsapp: '8801540535150',
      maps_url: 'https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA',
      google_maps_url: 'https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA',
      registered_address: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207, Bangladesh',
      corporate_office: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207, Bangladesh',
      warehouse_address: null,
      experience_summary: 'CamneX Bangladesh provides CCTV and video surveillance installation, Wi-Fi camera solutions, networking and connectivity infrastructure, access control systems, and IT support and maintenance for residential, commercial, and organizational environments.',
      team_size_band: null,
      active_client_count: null,
      completed_project_count: null,
      warranty_policy_summary: 'Manufacturer and distributor warranties apply to eligible products according to official product and supplier terms. Installation and workmanship terms apply where installation services are included.',
      service_sla_summary: 'Consultation, product recommendation, installation planning, system configuration, and ongoing support based on customer requirements and service scope.',
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      bank_branch: null,
      routing_number: null,
      certifications: [
        // 6 Individual Professional Certifications (Holder: MD. Eyaheya Khondoker)
        {
          id: 'cert-hik-cgsa-cctv',
          type: 'individual',
          title: 'CGSA-CCTV',
          fullTitle: 'Certified General Security Associate - CCTV',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'CGSA-022026-0880-04-2097',
          validUntil: 'February 2031',
          status: 'Verified Professional Credential',
          description: 'Certified General Security Associate for CCTV video surveillance engineering, system installation, and configuration.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-cgsa-cctv.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        {
          id: 'cert-hik-cgsa-ac',
          type: 'individual',
          title: 'CGSA-Access Control',
          fullTitle: 'Certified General Security Associate - Access Control',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'CGSA-032026-0880-04-1434',
          validUntil: 'March 2031',
          status: 'Verified Professional Credential',
          description: 'Certified General Security Associate for access control, biometric verification, and terminal deployment.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-cgsa-access-control.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        {
          id: 'cert-hik-cgsp-cctv',
          type: 'individual',
          title: 'CGSP-CCTV',
          fullTitle: 'Certified General Security Professional - CCTV',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'CGSP-022026-0880-04-1118',
          validUntil: 'February 2031',
          status: 'Verified Professional Credential',
          description: 'Certified General Security Professional for advanced CCTV system design, commissioning, and operational troubleshooting.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-cgsp-cctv.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        {
          id: 'cert-hik-hcsa-cctv',
          type: 'individual',
          title: 'HCSA-CCTV',
          fullTitle: 'Hikvision Certified Security Associate - CCTV',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'HCSA-012026-BD-04-2014',
          validUntil: 'January 2030',
          status: 'Verified Professional Credential',
          description: 'Hikvision Certified Security Associate for camera selection, IP networking, NVR setup, and remote view architecture.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-hcsa-cctv.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        {
          id: 'cert-hik-hcsa-hnet',
          type: 'individual',
          title: 'HCSA-HNET',
          fullTitle: 'Hikvision Certified Security Associate - Hikvision Network (HNET)',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'HCSA-012026-0880-04-2515',
          validUntil: 'January 2028',
          status: 'Verified Professional Credential',
          description: 'Hikvision Certified Security Associate for security network topology, VLAN configuration, bandwidth planning, and PoE distribution.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-hcsa-hnet.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        {
          id: 'cert-hik-hcsa-maint',
          type: 'individual',
          title: 'HCSA-Maintenance',
          fullTitle: 'Hikvision Certified Security Associate - Maintenance',
          issuer: 'Hikvision',
          holder: 'MD. Eyaheya Khondoker (CamneX Bangladesh)',
          certificateNumber: 'HCSA-012026-0880-04-2369',
          validUntil: 'January 2028',
          status: 'Verified Professional Credential',
          description: 'Hikvision Certified Security Associate for preventative system maintenance, diagnostics, firmware management, and recovery.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: '/documents/certificates/hikvision-hcsa-maintenance.pdf',
          documentStatus: 'Verified Original Certificate PDF available'
        },
        // 2 Corporate Brand Authorizations
        {
          id: 'cred-hikvision',
          type: 'corporate',
          title: 'Hikvision Authorized Partner',
          issuer: 'Hikvision',
          status: 'Verified Brand Credential',
          description: 'Authorized partner for Hikvision surveillance cameras, NVR/DVR recording systems, and security hardware.',
          logoUrl: '/images/brands/hikvision.svg',
          documentUrl: null,
          documentStatus: 'Company-level brand partnership'
        },
        {
          id: 'cred-zkteco',
          type: 'corporate',
          title: 'ZKTeco Authorized Installer',
          issuer: 'ZKTeco',
          status: 'Verified Brand Credential',
          description: 'Authorized installer for ZKTeco biometric time attendance, access control terminals, and entrance control systems.',
          logoUrl: '/images/brands/zkteco.svg',
          documentUrl: null,
          documentStatus: 'Company-level installer authorization'
        }
      ],
      founders: [
        {
          id: 'founder-heon-khondokar',
          roleType: 'founder',
          name: 'Heon Khondokar',
          officialName: 'MD. Eyaheya Khondoker',
          role: 'Founder & Engineer, CamneX Bangladesh',
          bio: 'Heon Khondokar leads technical delivery at CamneX Bangladesh, bringing practical engineering experience across IT support, networking, CCTV deployment, IT infrastructure, and system troubleshooting. He works directly with residential, commercial, and organizational clients to plan, configure, and support reliable security, networking, and IT solutions.',
          expertise: [
            'IT Support',
            'Networking',
            'CCTV Deployment',
            'IT Infrastructure',
            'Troubleshooting'
          ],
          responsibilities: 'Managing technical delivery and helping customers implement security, networking, and IT solutions.',
          photoUrl: '/images/founders/heon-khondokar.jpg',
          photoPlaceholderNote: null,
          order: 1,
          socialLinks: {
            linkedin: '',
            facebook: '',
            email: 'contact@camnexbd.com'
          },
          isVerified: true,
          awaitingConfirmation: false,
          missingFields: []
        },
        {
          id: 'cofounder-ti-rafi',
          roleType: 'cofounder',
          name: 'TI Rafi',
          role: 'Co-Founder, CamneX Bangladesh',
          bio: 'TI Rafi serves as Co-Founder of CamneX Bangladesh, overseeing business planning, accounts and finance administration, corporate coordination, and business operations to maintain structured service delivery and operational continuity.',
          expertise: [
            'Business Planning',
            'Accounts & Finance Administration',
            'Corporate Coordination',
            'Business Operations'
          ],
          responsibilities: 'Business planning, accounts and finance administration, corporate coordination, and business operations.',
          photoUrl: '',
          photoPlaceholderNote: 'Co-Founder portrait pending photography upload in Website Manager',
          order: 2,
          socialLinks: {
            linkedin: '',
            facebook: '',
            email: 'contact@camnexbd.com'
          },
          isVerified: true,
          awaitingConfirmation: false,
          missingFields: ['Profile Photograph']
        }
      ],
      brands_distributed: ['Hikvision', 'Dahua', 'ZKTeco', 'Ruijie Reyee', 'Western Digital Purple', 'Seagate SkyHawk', 'Cisco', 'MikroTik', 'TP-Link', 'Imou', 'EZVIZ', 'D-Link'],
      industry_memberships: [],
      social_links: {
        facebook: 'https://facebook.com/camnexbd',
        whatsapp: 'https://wa.me/8801540535150'
      },
      pdf_profile_media_id: null,
      pdf_url: null
    };
  }

  sanitizeProfileData(raw) {
    const defaults = this.getDefaultProfile();
    const merged = { ...defaults, ...raw };

    // Remove legacy unverified demo values if they match the old template defaults
    if (merged.founded_year === 2020 && merged.active_client_count === 350 && merged.completed_project_count === 520) {
      merged.founded_year = null;
      merged.active_client_count = null;
      merged.completed_project_count = null;
      merged.team_size_band = null;
    }
    if (merged.hotline === '16000') {
      merged.hotline = null;
    }
    if (!Array.isArray(merged.certifications) || merged.certifications.length === 0) {
      merged.certifications = defaults.certifications;
    }
    if (Array.isArray(merged.industry_memberships) && merged.industry_memberships.includes('BASIS Associate Member Network')) {
      merged.industry_memberships = [];
    }
    if (!Array.isArray(merged.founders) || merged.founders.length === 0) {
      merged.founders = defaults.founders;
    } else {
      // Ensure both founder and co-founder entries exist and compute missingFields accurately
      merged.founders = merged.founders.map((f, idx) => {
        const missing = [];
        if (!f.name || !String(f.name).trim()) missing.push('Full Name');
        if (!f.role || !String(f.role).trim()) missing.push('Role Title');
        if (!f.bio || !String(f.bio).trim()) missing.push('Biography');
        if (!f.photoUrl || !String(f.photoUrl).trim()) missing.push('Profile Photograph');
        return {
          ...f,
          order: f.order || idx + 1,
          missingFields: missing,
          awaitingConfirmation: missing.includes('Full Name') || missing.includes('Biography')
        };
      });
    }
    return merged;
  }

  getProfile() {
    try {
      const row = db.prepare("SELECT data_json, updated_at FROM company_profile WHERE id = 'default' OR id = '1' LIMIT 1").get();
      if (!row || !row.data_json) {
        return this.getDefaultProfile();
      }
      const data = JSON.parse(row.data_json);
      return { ...this.sanitizeProfileData(data), updated_at: row.updated_at };
    } catch (_) {
      return this.getDefaultProfile();
    }
  }

  getFullPublicProfile() {
    const profile = this.getProfile();

    // Pull authorized partner brands
    const brands = db.prepare("SELECT * FROM brands WHERE (is_archived IS NULL OR is_archived = 0) ORDER BY name ASC").all();

    // Pull services
    const services = db.prepare("SELECT * FROM services WHERE enabled = 1 ORDER BY display_order ASC").all();

    // Pull featured projects
    const projects = db.prepare("SELECT data_json FROM projects WHERE (is_archived IS NULL OR is_archived = 0) LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Pull testimonials
    const testimonials = db.prepare("SELECT data_json FROM testimonials WHERE (is_archived IS NULL OR is_archived = 0) LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Build Schema.org Organization + Corporation JSON-LD using only verified data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": ["Organization", "LocalBusiness"],
      "name": profile.legal_name || "CamneX Bangladesh",
      "legalName": profile.legal_name || "CamneX Bangladesh",
      "description": profile.tagline || "CamneX Bangladesh provides security, networking, and IT solutions to help homes, businesses, and organizations build safer, more connected environments.",
      "url": "https://camnexbd.com",
      "telephone": profile.primary_phone || "+880 1540-535150",
      "email": profile.contact_email || "contact@camnexbd.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": profile.registered_address || "Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207, Bangladesh",
        "addressLocality": "Dhaka",
        "postalCode": "1207",
        "addressCountry": "BD"
      },
      "founder": {
        "@type": "Person",
        "name": "Heon Khondokar",
        "jobTitle": "Founder & Engineer, CamneX Bangladesh"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": profile.primary_phone || "+880 1540-535150",
          "contactType": "customer service",
          "email": profile.contact_email || "contact@camnexbd.com",
          "areaServed": "BD",
          "availableLanguage": ["en", "bn"]
        }
      ],
      "sameAs": Object.values(profile.social_links || {}).filter(Boolean)
    };

    if (profile.founded_year) jsonLd.foundingDate = String(profile.founded_year);
    if (profile.bin) jsonLd.taxID = profile.bin;
    if (profile.tin) jsonLd.vatID = profile.tin;

    return {
      profile,
      partners: brands,
      services,
      projects,
      testimonials,
      jsonLd
    };
  }

  updateProfile(data, actor = null) {
    const existing = this.getProfile();
    const updated = { ...existing, ...data };

    db.prepare(`
      INSERT INTO company_profile (id, data_json, updated_at)
      VALUES ('default', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(updated));

    logAudit({
      entity: 'company_profile',
      entityId: 'default',
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing,
      after: updated
    });

    emitDomainEvent('company.profile_updated', {});
    return this.getProfile();
  }
}

module.exports = new CompanyService();
