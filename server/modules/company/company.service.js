const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class CompanyService {
  getProfile() {
    const row = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
    if (!row) {
      return {
        id: 1,
        brand_name: 'CamneX',
        tagline: 'Commercial Security & Networking Hardware',
        show_statistics: 0,
        show_corporate_payment: 0
      };
    }
    return {
      ...row,
      show_statistics: Boolean(row.show_statistics),
      show_corporate_payment: Boolean(row.show_corporate_payment),
      leadership: row.leadership_json ? JSON.parse(row.leadership_json) : []
    };
  }

  getFullPublicProfile() {
    const profile = this.getProfile();

    // Pull authorized partner brands
    const brands = db.prepare("SELECT * FROM brands WHERE is_archived = 0 ORDER BY name ASC").all();

    // Pull services
    const services = db.prepare("SELECT * FROM service_offerings WHERE enabled = 1 ORDER BY sort_order ASC").all();

    // Pull featured projects
    const projects = db.prepare("SELECT data_json FROM projects ORDER BY created_at DESC LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Pull testimonials
    const testimonials = db.prepare("SELECT data_json FROM testimonials WHERE is_featured = 1 ORDER BY created_at DESC LIMIT 6").all().map(r => JSON.parse(r.data_json));

    // Build JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": ["Organization", "LocalBusiness"],
      "name": profile.brand_name || "CamneX",
      "legalName": profile.legal_name || "CamneX Bangladesh",
      "description": profile.short_bio || profile.tagline || "Commercial Security & Networking Hardware Solutions",
      "url": "https://camnexbd.com",
      "telephone": profile.hotline || profile.official_phone || "+8801700000000",
      "email": profile.official_email || "contact@camnexbd.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": profile.operational_address || profile.registered_address || "Dhaka, Bangladesh",
        "addressLocality": "Dhaka",
        "addressCountry": "BD"
      }
    };
    if (profile.bin_no) jsonLd.taxID = profile.bin_no;

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
      INSERT INTO company_profile (
        id, legal_name, brand_name, tagline, short_bio, year_established, business_type,
        trade_license_no, tin_no, bin_no, registered_address, operational_address,
        official_email, official_phone, hotline, whatsapp,
        show_statistics, projects_completed, active_clients, corporate_clients, years_in_business,
        show_corporate_payment, bank_name, bank_branch, bank_account_name, bank_account_number, bank_routing_number,
        leadership_json, pdf_url, pdf_size_bytes, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        legal_name = excluded.legal_name,
        brand_name = excluded.brand_name,
        tagline = excluded.tagline,
        short_bio = excluded.short_bio,
        year_established = excluded.year_established,
        business_type = excluded.business_type,
        trade_license_no = excluded.trade_license_no,
        tin_no = excluded.tin_no,
        bin_no = excluded.bin_no,
        registered_address = excluded.registered_address,
        operational_address = excluded.operational_address,
        official_email = excluded.official_email,
        official_phone = excluded.official_phone,
        hotline = excluded.hotline,
        whatsapp = excluded.whatsapp,
        show_statistics = excluded.show_statistics,
        projects_completed = excluded.projects_completed,
        active_clients = excluded.active_clients,
        corporate_clients = excluded.corporate_clients,
        years_in_business = excluded.years_in_business,
        show_corporate_payment = excluded.show_corporate_payment,
        bank_name = excluded.bank_name,
        bank_branch = excluded.bank_branch,
        bank_account_name = excluded.bank_account_name,
        bank_account_number = excluded.bank_account_number,
        bank_routing_number = excluded.bank_routing_number,
        leadership_json = excluded.leadership_json,
        pdf_url = excluded.pdf_url,
        pdf_size_bytes = excluded.pdf_size_bytes,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      updated.legal_name || null,
      updated.brand_name || 'CamneX',
      updated.tagline || null,
      updated.short_bio || null,
      updated.year_established || null,
      updated.business_type || null,
      updated.trade_license_no || null,
      updated.tin_no || null,
      updated.bin_no || null,
      updated.registered_address || null,
      updated.operational_address || null,
      updated.official_email || null,
      updated.official_phone || null,
      updated.hotline || null,
      updated.whatsapp || null,
      updated.show_statistics ? 1 : 0,
      updated.projects_completed || null,
      updated.active_clients || null,
      updated.corporate_clients || null,
      updated.years_in_business || null,
      updated.show_corporate_payment ? 1 : 0,
      updated.bank_name || null,
      updated.bank_branch || null,
      updated.bank_account_name || null,
      updated.bank_account_number || null,
      updated.bank_routing_number || null,
      updated.leadership_json ? JSON.stringify(updated.leadership_json) : null,
      updated.pdf_url || null,
      updated.pdf_size_bytes || null
    );

    logAudit({
      entity: 'company_profile',
      entityId: '1',
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

