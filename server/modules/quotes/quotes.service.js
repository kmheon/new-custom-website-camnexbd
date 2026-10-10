const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

function generateNumber(prefix = 'CNX-QTE') {
  const d = new Date();
  const dateStr = d.getFullYear().toString().slice(-2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

class QuotesService {
  listQuotes() {
    const rows = db.prepare('SELECT data_json FROM quotes ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  createQuote(data, actor = null) {
    const id = `qte-${Date.now()}`;
    const referenceNumber = generateNumber('CNX-QTE');
    const createdAt = new Date().toISOString();

    const fullQuote = {
      ...data,
      id,
      referenceNumber,
      createdAt,
      status: 'pending'
    };

    db.prepare(`
      INSERT INTO quotes (id, reference_number, customer_name, phone, service_type, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, referenceNumber, fullQuote.customerName || '', fullQuote.phone || '',
      fullQuote.serviceType || '', fullQuote.status, JSON.stringify(fullQuote), createdAt
    );

    logAudit({
      entity: 'quote',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name || fullQuote.customerName,
      after: { referenceNumber, customerName: fullQuote.customerName, serviceType: fullQuote.serviceType }
    });

    emitDomainEvent('quote.requested', { quoteId: id, referenceNumber });
    return fullQuote;
  }

  updateStatus(id, status, actor = null) {
    const row = db.prepare('SELECT data_json FROM quotes WHERE id = ? OR reference_number = ?').get(id, id);
    if (!row) return null;

    const quote = JSON.parse(row.data_json);
    const prevStatus = quote.status;
    quote.status = status;

    db.prepare(`
      UPDATE quotes SET status = ?, data_json = ? WHERE id = ? OR reference_number = ?
    `).run(status, JSON.stringify(quote), id, id);

    logAudit({
      entity: 'quote',
      entityId: id,
      action: 'status_update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: { status: prevStatus },
      after: { status }
    });

    return quote;
  }
}

module.exports = new QuotesService();

