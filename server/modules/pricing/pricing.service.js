const db = require('../../../database');

class PricingService {
  calculateDynamicPackagePrice(packageId, cameraCount = 4, formFactor = 'bullet') {
    const count = parseInt(cameraCount, 10) || 4;
    const ff = (formFactor || 'bullet').toLowerCase();
    const pkgId = (packageId || '').toLowerCase();
    const isColorPackage = pkgId.includes('color');

    let camSku = (ff === 'dome' || ff === 'turret') ? 'prod-hik-dome-2mp' : 'prod-hik-irpf-2mp';
    if (isColorPackage) {
      camSku = (ff === 'dome' || ff === 'turret') ? 'prod-hik-color-dome-2mp' : 'prod-hik-color-2mp';
    }

    let dvrSku;
    if (count <= 4) dvrSku = 'prod-hik-dvr-4ch';
    else if (count <= 8) dvrSku = 'prod-hik-dvr-8ch';
    else dvrSku = 'prod-hik-dvr-16ch';

    let hddSku;
    if (count <= 4) hddSku = 'prod-wd-purple-500gb';
    else if (count <= 8) hddSku = 'prod-wd-purple-1tb';
    else hddSku = 'prod-wd-purple-2tb';

    const cableSku = 'cable-cat6';
    const cableMeters = count * 10;

    const powerSku = count > 8 ? 'acc-power-16ch' : 'acc-power';
    const powerQty = 1;

    const balunSku = 'acc-balun';
    const balunQty = count;

    const bomSpec = [
      { role: 'camera', sku: camSku, qty: count, fallbackName: `Hikvision 2MP ${ff.toUpperCase()} Camera` },
      { role: 'recorder', sku: dvrSku, qty: 1, fallbackName: `Hikvision Turbo HD DVR (${count > 8 ? '16-Ch' : count > 4 ? '8-Ch' : '4-Ch'})` },
      { role: 'storage', sku: hddSku, qty: 1, fallbackName: `Western Digital Purple Surveillance HDD (${count >= 16 ? '2TB' : count >= 8 ? '1TB' : '500GB'})` },
      { role: 'cable', sku: cableSku, qty: cableMeters, fallbackName: `Cat6 UTP Cable (${cableMeters}m)` },
      { role: 'power', sku: powerSku, qty: powerQty, fallbackName: 'Centralized 12V Regulated DC Power Supply Unit' },
      { role: 'connectors', sku: balunSku, qty: balunQty, fallbackName: `HD Video Baluns & DC Connectors (${balunQty} Sets)` }
    ];

    let quotationRequired = false;
    const missingComponents = [];
    let totalPrice = 0;

    const components = bomSpec.map(item => {
      const row = db.prepare('SELECT id, name, model_number, sku, price, data_json FROM products WHERE id = ? OR sku = ?').get(item.sku, item.sku);
      let name = item.fallbackName;
      let model = item.sku;
      let unitPrice = null;

      if (row) {
        name = row.name || name;
        model = row.model_number || row.sku || model;
        if (row.price !== null && row.price !== undefined && row.price > 0) {
          unitPrice = row.price;
        } else {
          try {
            const data = JSON.parse(row.data_json || '{}');
            if (data.pricing?.regularPrice && data.pricing.regularPrice > 0) {
              unitPrice = data.pricing.regularPrice;
            }
          } catch (_) {}
        }
      }

      if (unitPrice === null || unitPrice === undefined) {
        quotationRequired = true;
        missingComponents.push(name);
        return {
          role: item.role,
          sku: item.sku,
          name,
          model,
          qty: item.qty,
          unitPrice: null,
          lineTotal: null
        };
      } else {
        const lineTotal = unitPrice * item.qty;
        totalPrice += lineTotal;
        return {
          role: item.role,
          sku: item.sku,
          name,
          model,
          qty: item.qty,
          unitPrice,
          lineTotal
        };
      }
    });

    return {
      totalPrice: quotationRequired ? null : totalPrice,
      quotationRequired,
      quotationReason: quotationRequired
        ? `One or more components (${missingComponents.join(', ')}) do not have standard published pricing and require an engineering quotation.`
        : null,
      components
    };
  }
}

module.exports = new PricingService();

