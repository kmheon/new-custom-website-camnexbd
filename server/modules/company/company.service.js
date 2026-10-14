const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class CompanyService {
  getDefaultProfile() {
    return {
      legal_name: 'CamneX Bangladesh',
      trade_name: 'CamneX',
      tagline: 'Enterprise Security, Surveillance & Networking Solutions',
      mission: 'Delivering genuine security and enterprise networking infrastructure with rigorous Dhaka engineering standards.',
      vision: 'To be Bangladesh\'s most trusted corporate security technology partner.',
      founded_year: 2020,
      registration_number: null,
      bin: null,
      tin: null,
      trade_license_number: null,
      tax_circle: null,
      vat_reg_number: null,
      contact_email: 'contact@camnexbd.com',
      sales_email: 'sales@camnexbd.com',
      support_email: 'support@camnexbd.com',
      primary_phone: '+880 1540-535150',
      secondary_phone: null,
      hotline: '16000',
      emergency_support_phone: '+880 1540-535150',
      whatsapp: '8801540535150',
      registered_address: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207, Bangladesh',
      corporate_office: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207',
      warehouse_address: 'Dhaka Central Hub, Mohammadpur, Dhaka',
      experience_summary: 'Over 6 years of turnkey engineering experience deploying high-reliability IP surveillance, biometric access control, and enterprise fiber/PoE networking.',
      team_size_band: '15-25 engineers & field technicians',
      active_client_count: 350,
      completed_project_count: 520,
      warranty_policy_summary: '1-Year official manufacturer warranty on all cameras and recorders; 2-Year warranty on enterprise switches; onsite Dhaka engineering warranty.',
      service_sla_summary: '24-hour on-site dispatch in Dhaka metropolitan area; dedicated WhatsApp engineering hotline.',
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      bank_branch: null,
      routing_number: null,
      certifications: [
        { title: 'Hikvision Security Associate (HCSA)', issuer: 'Hikvision', year: 2022 },
        { title: 'ZKTeco Authorized Enterprise Solution Partner', issuer: 'ZKTeco', year: 2023 },
        { title: 'Ruijie Network Professional (RCNP)', issuer: 'Ruijie Networks', year: 2024 }
      ],
      brands_distributed: ['Hikvision', 'Dahua', 'ZKTeco', 'Ruijie Reyee', 'Western Digital Purple', 'Seagate SkyHawk', 'Cisco'],
      industry_memberships: ['BASIS Associate Member Network', 'Dhaka Security Hardware Association'],
      social_links: {
        facebook: 'https://facebook.com/camnexbd',
        linkedin: 'https://linkedin.com/company/camnexbd',
        whatsapp: 'https://wa.me/8801540535150'
      },
      pdf_profile_media_id: null,
      pdf_url: null
    };
  }

  getProfile() {
    try {
      const row = db.prepare("SELECT data_json, updated_at FROM company_profile WHERE id = 'default' OR id = '1' LIMIT 1").get();
      if (!row || !row.data_json) {
        return this.getDefaultProfile();
      }
      const data = JSON.parse(row.data_json);
      return { ...this.getDefaultProfile(), ...data, updated_at: row.updated_at };
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
    const projects = db.prepare("SELECT data_json FROM projects LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Pull testimonials
    const testimonials = db.prepare("SELECT data_json FROM testimonials LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Build Schema.org Organization + Corporation JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": ["Organization", "Corporation"],
      "name": profile.trade_name || "CamneX",
      "legalName": profile.legal_name || "CamneX Bangladesh",
      "description": profile.tagline || profile.mission || "Enterprise Security, Surveillance & Networking Solutions",
      "url": "https://camnexbd.com",
      "foundingDate": String(profile.founded_year || "2020"),
      "telephone": profile.hotline || profile.primary_phone || "+880 1540-535150",
      "email": profile.contact_email || "contact@camnexbd.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": profile.corporate_office || profile.registered_address || "Dhaka, Bangladesh",
        "addressLocality": "Dhaka",
        "addressCountry": "BD"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": profile.primary_phone,
          "contactType": "sales",
          "email": profile.sales_email,
          "areaServed": "BD",
          "availableLanguage": ["en", "bn"]
        },
        {
          "@type": "ContactPoint",
          "telephone": profile.emergency_support_phone || profile.hotline,
          "contactType": "customer service",
          "email": profile.support_email,
          "areaServed": "BD",
          "availableLanguage": ["en", "bn"]
        }
      ],
      "sameAs": Object.values(profile.social_links || {}).filter(Boolean)
    };

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
