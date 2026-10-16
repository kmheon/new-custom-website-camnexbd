#!/usr/bin/env node
/**
 * End-to-End Acceptance Test Suite for CamneX Bangladesh Company Pages:
 * 1. Company Profile (/company-profile, /about) + Meet Our Founders (Founder & Co-Founder)
 * 2. Projects & Portfolio (/projects)
 * 3. Why Choose Us (/why-choose-us)
 * 4. Certifications & Compliance (/certifications & /company-profile#certifications)
 * 5. Contact (/contact + POST /api/contact)
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.COMPANY_CDP_PORT || '9792', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_company_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, label, detail = '') {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${label}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    }
  }

  console.log('=== CamneX Company Section Acceptance Suite ===\n');

  // 1. API & Direct Route HTTP 200 Verification
  console.log('1. Checking /api/company-profile, /api/contact, and SSR HTTP 200 routes');
  const apiRes = await fetch(`${BASE_URL}/api/company-profile`);
  assert(apiRes.status === 200, 'GET /api/company-profile returns HTTP 200');
  const apiJson = await apiRes.json();
  const profile = apiJson.profile || apiJson.data || apiJson;
  assert(Array.isArray(profile.founders) && profile.founders.length === 2, 'API returns 2 structured founder entries (Founder & Co-Founder)');
  assert(profile.founders[0].name === 'Heon Khondokar', 'Founder name is Heon Khondokar');
  assert(profile.founders[0].role === 'Founder & Engineer, CamneX Bangladesh', 'Founder role is Founder & Engineer, CamneX Bangladesh');
  assert(profile.founders[0].photoUrl === '/images/founders/heon-khondokar.jpg', 'Founder has photoUrl set to /images/founders/heon-khondokar.jpg');
  assert(profile.founders[1].name === 'TI Rafi', 'Co-Founder name is TI Rafi');
  assert(profile.founders[1].role === 'Co-Founder, CamneX Bangladesh', 'Co-Founder role is Co-Founder, CamneX Bangladesh');
  assert(profile.founders[1].roleType === 'cofounder', 'Second card is structured Co-Founder entry');
  assert(!profile.founded_year, 'No invented founded_year (2020) in company profile API');
  assert(Array.isArray(profile.certifications) && profile.certifications.length === 8, 'API returns 8 credentials (6 individual Hikvision engineering certs + 2 corporate brand authorizations)');
  assert(profile.secondary_phone === '+880 1410-085848', 'Secondary phone is +880 1410-085848');
  assert(profile.slogan === 'Eyes On, Worries Gone.', 'Slogan is Eyes On, Worries Gone.');

  const routesToVerify = [
    { route: '/company-profile', expectedTitlePart: 'About CamneX Bangladesh' },
    { route: '/about', expectedTitlePart: 'About CamneX Bangladesh' },
    { route: '/projects', expectedTitlePart: 'Projects & Portfolio' },
    { route: '/why-choose-us', expectedTitlePart: 'Why Choose CamneX Bangladesh' },
    { route: '/certifications', expectedTitlePart: 'Certifications & Compliance' },
    { route: '/contact', expectedTitlePart: 'Contact Us' },
  ];

  for (const r of routesToVerify) {
    const res = await fetch(`${BASE_URL}${r.route}`);
    const html = (await res.text()).replace(/&amp;/g, '&');
    assert(res.status === 200, `Direct GET ${r.route} returns HTTP 200 (got ${res.status})`);
    assert(html.includes(r.expectedTitlePart), `SSR metadata for ${r.route} includes '${r.expectedTitlePart}'`);
  }

  // 2. Launch Headless Edge for E2E UI & Responsive Verification
  console.log('\n2. Launching Headless Browser for E2E UI, Navigation & Responsive Verification');
  const edgeProc = cp.spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1280,800',
      `${BASE_URL}/company-profile`
    ],
    { stdio: 'ignore' }
  );

  let ws;
  try {
    let targetWsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const pages = await res.json();
        const page = pages.find((p) => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          targetWsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await sleep(300);
    }
    if (!targetWsUrl) throw new Error('Could not connect to Edge CDP');

    ws = new WebSocket(targetWsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const errText = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        if (!errText.includes('favicon')) consoleErrors.push(errText);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails?.text || 'Uncaught exception');
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const evalJs = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    };

    const saveScreenshot = async (filename) => {
      try {
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot && shot.data && fs.existsSync(ARTIFACT_DIR)) {
          fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(shot.data, 'base64'));
        }
      } catch (_) {}
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sleep(1500);

    // --- PAGE 1: COMPANY PROFILE (/company-profile) ---
    console.log('\n3. Verifying Page 1: Company Profile (/company-profile) & Meet Our Founders');
    const cpReport = await evalJs(`(() => {
      const h1 = document.querySelector('[data-testid="company-profile-hero"] h1')?.textContent?.trim() || '';
      const overview = Boolean(document.querySelector('[data-testid="company-overview-section"]'));
      const missionVision = Boolean(document.querySelector('[data-testid="company-mission-vision-section"]'));
      const approachSection = document.querySelector('[data-testid="company-approach-section"]')?.innerText || '';
      const foundersHeading = document.querySelector('[data-testid="founders-section"] h2')?.textContent?.trim() || '';
      const founderCard = document.querySelector('[data-testid="founder-profile-card"]')?.innerText || '';
      const coFounderCard = document.querySelector('[data-testid="cofounder-profile-card"]')?.innerText || '';
      const founderImgSrc = document.querySelector('[data-testid="founder-profile-card"] img')?.getAttribute('src') || '';
      const coFounderPhotoPlaceholder = Boolean(document.querySelector('[data-testid="cofounder-photo-placeholder"]'));
      const bodyText = document.body.innerText;
      return {
        h1,
        overview,
        missionVision,
        hasAllApproachSteps: approachSection.includes('01') && approachSection.includes('05'),
        foundersHeading,
        founderCard,
        coFounderCard,
        founderImgSrc,
        coFounderPhotoPlaceholder,
        hasFakeStats: bodyText.includes('350+') || bodyText.includes('520+') || bodyText.includes('Est. 2020') || bodyText.includes('BASIS Member')
      };
    })()`);

    assert(cpReport.h1 === 'About CamneX Bangladesh', `Company Profile H1 is 'About CamneX Bangladesh' (got '${cpReport.h1}')`);
    assert(cpReport.overview, 'Company Overview section renders');
    assert(cpReport.missionVision, 'Mission & Vision section renders with Proposed badges');
    assert(cpReport.hasAllApproachSteps, 'Our Approach displays 5 structured lifecycle steps (01 to 05)');
    assert(cpReport.foundersHeading === 'Meet Our Founders', `Founders section heading is 'Meet Our Founders' (got '${cpReport.foundersHeading}')`);
    assert(
      cpReport.founderCard.includes('Heon Khondokar') &&
        cpReport.founderCard.includes('Founder & Engineer, CamneX Bangladesh') &&
        cpReport.founderCard.includes('IT Support') &&
        cpReport.founderCard.includes('CCTV Deployment'),
      'Founder card displays Heon Khondokar, Founder & Engineer role, and verified engineering background'
    );
    assert(cpReport.founderImgSrc === '/images/founders/heon-khondokar.jpg', `Founder card renders verified portrait (/images/founders/heon-khondokar.jpg) (got '${cpReport.founderImgSrc}')`);
    assert(
      cpReport.coFounderCard.includes('TI Rafi') &&
        cpReport.coFounderCard.includes('Co-Founder') &&
        cpReport.coFounderCard.includes('Business Planning') &&
        cpReport.coFounderCard.includes('Business Operations') &&
        cpReport.coFounderPhotoPlaceholder,
      'Co-Founder card displays TI Rafi with verified business planning and operations profile and placeholder for missing portrait'
    );
    assert(!cpReport.hasFakeStats, 'Company Profile contains zero invented stats (350+, 520+, Est. 2020, BASIS)');

    await saveScreenshot('company_profile_1280x800.png');

    // Scroll to Founders section & capture screenshot
    await evalJs(`document.querySelector('[data-testid="founders-section"]')?.scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(400);
    await saveScreenshot('company_founders_1280x800.png');

    // --- PAGE 2: PROJECTS & PORTFOLIO (/projects) ---
    console.log('\n4. Verifying Page 2: Projects & Portfolio (/projects)');
    await evalJs(`document.querySelector('[data-testid="company-subnav-projects"]').click()`);
    await sleep(1000);

    const projReport = await evalJs(`(() => {
      const workTypesText = document.querySelector('[data-testid="projects-work-types"]')?.innerText || '';
      return {
        path: window.location.pathname,
        h1: document.querySelector('[data-testid="projects-hero"] h1')?.textContent?.trim() || '',
        hasWorkTypes: workTypesText.includes('CCTV & IP Video Surveillance') && workTypesText.includes('IT Support & System Maintenance'),
        hasHonestEmptyOrGrid: Boolean(document.querySelector('[data-testid="projects-empty-state"]') || document.querySelector('[data-testid="project-card"]')),
        hasCta: Boolean(document.querySelector('[data-testid="projects-cta-section"]'))
      };
    })()`);

    assert(projReport.path === '/projects', `Sub-navigation navigated to /projects (got ${projReport.path})`);
    assert(projReport.h1 === 'Projects & Portfolio', `Projects H1 is 'Projects & Portfolio' (got '${projReport.h1}')`);
    assert(projReport.hasWorkTypes, 'Types of work section renders all 5 solution categories');
    assert(projReport.hasHonestEmptyOrGrid, 'Projects section renders honest empty state or verified project cards');
    assert(projReport.hasCta, 'Projects page CTA section renders with Request Quotation and Contact Us buttons');

    await saveScreenshot('company_projects_1280x800.png');

    // --- PAGE 3: WHY CHOOSE US (/why-choose-us) ---
    console.log('\n5. Verifying Page 3: Why Choose Us (/why-choose-us)');
    await evalJs(`document.querySelector('[data-testid="company-subnav-why_choose_us"]').click()`);
    await sleep(1000);

    const whyReport = await evalJs(`(() => {
      const pillarsText = document.querySelector('[data-testid="why-choose-us-pillars"]')?.innerText || '';
      const processText = document.querySelector('[data-testid="why-choose-us-process"]')?.innerText || '';
      const credsText = document.querySelector('[data-testid="why-choose-us-credentials"]')?.innerText || '';
      return {
        path: window.location.pathname,
        h1: document.querySelector('[data-testid="why-choose-us-hero"] h1')?.textContent?.trim() || '',
        hasPillars: pillarsText.includes('Solutions Matched to Customer Requirements') && pillarsText.includes('Genuine Products & Verified Warranty Information'),
        hasProcess: processText.toLowerCase().includes('step 1') && processText.toLowerCase().includes('step 4'),
        hasCreds: credsText.includes('Hikvision Authorized Partner') && credsText.includes('ZKTeco Authorized Installer'),
        bodyText: document.body.innerText
      };
    })()`);

    assert(whyReport.path === '/why-choose-us', `Sub-navigation navigated to /why-choose-us (got ${whyReport.path})`);
    assert(whyReport.h1 === 'Why Choose CamneX Bangladesh', `Why Choose Us H1 is 'Why Choose CamneX Bangladesh' (got '${whyReport.h1}')`);
    assert(whyReport.hasPillars, 'Core value pillars section renders all 6 customer-focused pillars');
    assert(whyReport.hasProcess, 'Customer consultation-to-deployment process section renders Steps 1 to 4');
    assert(whyReport.hasCreds, 'Why Choose Us displays verified Hikvision and ZKTeco brand credentials');
    assert(!whyReport.bodyText.toLowerCase().includes('#1 in bangladesh'), 'Why Choose Us avoids unverifiable superlatives');

    await saveScreenshot('company_why_choose_us_1280x800.png');

    // --- PAGE 4: CERTIFICATIONS & COMPLIANCE (/certifications) ---
    console.log('\n6. Verifying Page 4: Certifications & Compliance (/certifications)');
    await evalJs(`document.querySelector('[data-testid="company-subnav-certifications"]').click()`);
    await sleep(1000);

    const certReport = await evalJs(`(() => {
      const corpCards = Array.from(document.querySelectorAll('[data-testid^="credential-card-"]')).map((el) => el.innerText);
      const indCards = Array.from(document.querySelectorAll('[data-testid^="individual-cert-card-"]')).map((el) => el.innerText);
      const complianceText = document.querySelector('[data-testid="compliance-standards-section"]')?.innerText || '';
      const pdfLinks = Array.from(document.querySelectorAll('[data-testid^="cert-view-pdf-"]')).map((el) => el.getAttribute('href'));
      return {
        path: window.location.pathname,
        h1: document.querySelector('[data-testid="certifications-hero"] h1')?.textContent?.trim() || '',
        corpCardCount: corpCards.length,
        corpCardsText: corpCards.join(' | '),
        indCardCount: indCards.length,
        indCardsText: indCards.join(' | '),
        pdfLinks,
        hasCompliancePillars: complianceText.includes('Manufacturer & Distributor Warranties') && complianceText.includes('Privacy, Security & Data-Handling Practices'),
        bodyText: document.body.innerText
      };
    })()`);

    assert(certReport.path === '/certifications', `Sub-navigation navigated to /certifications (got ${certReport.path})`);
    assert(certReport.h1 === 'Certifications & Compliance', `Certifications H1 is 'Certifications & Compliance' (got '${certReport.h1}')`);
    assert(certReport.corpCardCount === 2, `Displays the 2 verified corporate brand credentials (got ${certReport.corpCardCount})`);
    assert(
      certReport.corpCardsText.includes('Hikvision Authorized Partner') && certReport.corpCardsText.includes('ZKTeco Authorized Installer'),
      'Displays corporate Hikvision Authorized Partner and ZKTeco Authorized Installer'
    );
    assert(certReport.indCardCount === 6, `Displays the 6 individual engineering credentials held by MD. Eyaheya Khondoker (got ${certReport.indCardCount})`);
    assert(
      certReport.indCardsText.includes('CGSA-CCTV') &&
        certReport.indCardsText.includes('CGSA-Access Control') &&
        certReport.indCardsText.includes('CGSP-CCTV') &&
        certReport.indCardsText.includes('HCSA-CCTV') &&
        certReport.indCardsText.includes('HCSA-HNET') &&
        certReport.indCardsText.includes('HCSA-Maintenance'),
      'Displays all 6 verified Hikvision credentials: CGSA-CCTV, CGSA-AC, CGSP-CCTV, HCSA-CCTV, HCSA-HNET, HCSA-Maintenance'
    );
    assert(
      certReport.indCardsText.includes('MD. Eyaheya Khondoker') && certReport.indCardsText.includes('CGSA-022026-0880-04-2097'),
      'Displays credential holder MD. Eyaheya Khondoker and authentic certificate numbers'
    );
    assert(
      certReport.pdfLinks.length === 6 && certReport.pdfLinks[0].includes('hikvision-cgsa-cctv.pdf'),
      'All 6 individual certificates link directly to verified PDF documents'
    );
    assert(
      !certReport.bodyText.includes('RCNP') && !certReport.bodyText.includes('BASIS Member'),
      'Does not display unverified RCNP or BASIS credentials'
    );
    assert(certReport.hasCompliancePillars, 'Compliance & Warranty Alignment section displays warranty, authenticity, installation, and privacy practices');

    await saveScreenshot('company_certifications_1280x800.png');

    // Verify /company-profile#certifications compatibility route
    await send('Page.navigate', { url: `${BASE_URL}/company-profile#certifications` });
    await sleep(1200);
    const hashCertH1 = await evalJs(`document.querySelector('[data-testid="certifications-hero"] h1')?.textContent?.trim() || ''`);
    assert(
      hashCertH1 === 'Certifications & Compliance',
      `Legacy hash route /company-profile#certifications renders Certifications & Compliance view (got '${hashCertH1}')`
    );

    // --- PAGE 5: CONTACT (/contact) & FORM SUBMISSION ---
    console.log('\n7. Verifying Page 5: Contact (/contact) & Form Validation/Submission');
    await evalJs(`document.querySelector('[data-testid="company-subnav-contact"]').click()`);
    await sleep(1000);

    const contactReport = await evalJs(`(() => {
      const cardText = document.querySelector('[data-testid="verified-contact-info-card"]')?.innerText || '';
      const directionsHref = document.querySelector('[data-testid="contact-directions-link"]')?.getAttribute('href') || '';
      return {
        path: window.location.pathname,
        h1: document.querySelector('[data-testid="contact-page-hero"] h1')?.textContent?.trim() || '',
        hasPrimaryPhone: cardText.includes('+880 1540-535150'),
        hasSecondaryPhone: cardText.includes('+880 1410-085848'),
        hasOldPhone: cardText.includes('01688-966983'),
        hasEmail: cardText.includes('contact@camnexbd.com'),
        hasAddress: cardText.includes('Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207'),
        directionsHref,
        hasFacebookLink: Boolean(document.querySelector('[data-testid="contact-facebook-link"]'))
      };
    })()`);

    assert(contactReport.path === '/contact', `Sub-navigation navigated to /contact (got ${contactReport.path})`);
    assert(contactReport.h1 === 'Contact Us', `Contact H1 is 'Contact Us' (got '${contactReport.h1}')`);
    assert(contactReport.hasPrimaryPhone, 'Contact page displays verified primary phone +880 1540-535150');
    assert(contactReport.hasSecondaryPhone, 'Contact page displays verified secondary phone +880 1410-085848');
    assert(!contactReport.hasOldPhone, 'Contact page does NOT display old 01688-966983 phone number');
    assert(contactReport.hasEmail, 'Contact page displays verified email contact@camnexbd.com');
    assert(contactReport.hasAddress, 'Contact page displays verified Chandrima Model Town address');
    assert(
      contactReport.directionsHref === 'https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA',
      `Contact page includes exact Google Maps destination https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA (got '${contactReport.directionsHref}')`
    );
    assert(contactReport.hasFacebookLink, 'Contact page includes working Facebook page link');

    await saveScreenshot('company_contact_1280x800.png');

    // Test empty form validation
    await evalJs(`document.querySelector('[data-testid="contact-submit-btn"]').click()`);
    await sleep(300);
    const hasValidationErrors = await evalJs(`(() => {
      const nameErr = document.querySelector('[data-testid="contact-error-name"]')?.textContent || '';
      const phoneErr = document.querySelector('[data-testid="contact-error-phone"]')?.textContent || '';
      const msgErr = document.querySelector('[data-testid="contact-error-message"]')?.textContent || '';
      return Boolean(nameErr && phoneErr && msgErr);
    })()`);
    assert(hasValidationErrors, 'Contact form validates required Full Name, Mobile Number, and Message fields');

    // Fill and submit valid contact inquiry
    await evalJs(`(() => {
      const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setVal('[data-testid="contact-input-name"]', 'Tanvir Ahmed');
      setVal('[data-testid="contact-input-phone"]', '01712345678');
      setVal('[data-testid="contact-input-email"]', 'tanvir@example.com');
      setVal('[data-testid="contact-input-message"]', 'We need a 16-camera Hikvision IP surveillance setup and Ruijie Wi-Fi 6 coverage for our Dhaka office.');
      document.querySelector('[data-testid="contact-submit-btn"]').click();
    })()`);
    await sleep(1200);

    const submitSuccess = await evalJs(`(() => {
      const box = document.querySelector('[data-testid="contact-form-success"]');
      return {
        exists: Boolean(box),
        text: box ? box.innerText : ''
      };
    })()`);
    assert(
      submitSuccess.exists && submitSuccess.text.includes('Inquiry Received') && submitSuccess.text.includes('CNX-INQ-'),
      'Contact form submits to POST /api/contact and displays CNX-INQ reference confirmation'
    );

    // --- HEADER & FOOTER NAVIGATION + BROWSER HISTORY ---
    console.log('\n8. Verifying Simplified Company Header Button, Footer Links & Browser History');

    // 8a. Desktop direct Company button test
    const desktopCompanyBtn = await evalJs(`(() => {
      const btn = document.querySelector('[data-testid="nav-company-link"]');
      const hasChevron = Boolean(btn?.querySelector('svg'));
      const dropdownExists = Boolean(document.querySelector('[data-testid="nav-company-dropdown"]'));
      return {
        exists: Boolean(btn),
        text: btn?.textContent?.trim() || '',
        hasChevron,
        dropdownExists
      };
    })()`);
    assert(desktopCompanyBtn.exists, 'Desktop header has [data-testid="nav-company-link"] button');
    assert(desktopCompanyBtn.text === 'Company', `Company button text is 'Company' (got '${desktopCompanyBtn.text}')`);
    assert(!desktopCompanyBtn.hasChevron, 'Company navigation button does NOT contain a chevron icon');
    assert(!desktopCompanyBtn.dropdownExists, 'Company navigation button does NOT render a dropdown menu');

    // Click desktop Company button and verify direct navigation to /company-profile
    await evalJs(`document.querySelector('[data-testid="nav-company-link"]').click()`);
    await sleep(600);
    assert((await evalJs(`window.location.pathname`)) === '/company-profile', 'Clicking desktop Company button navigates directly to /company-profile');

    // 8b. Footer links verification
    const footerText = await evalJs(`document.querySelector('#site-footer')?.innerText || ''`);
    assert(
      footerText.includes('Company Profile') &&
        footerText.includes('Projects & Portfolio') &&
        footerText.includes('Why Choose Us') &&
        footerText.includes('Certifications & Compliance') &&
        footerText.includes('Contact'),
      'Footer includes links to Company Profile, Projects & Portfolio, Why Choose Us, Certifications & Compliance, and Contact'
    );

    // Browser Back button
    await evalJs(`window.history.back()`);
    await sleep(800);
    assert((await evalJs(`window.location.pathname`)) === '/contact', 'Browser Back button returns to previous route');

    // Navigate back to /contact and test Browser Refresh
    await send('Page.navigate', { url: `${BASE_URL}/contact` });
    await sleep(1000);
    await send('Page.reload');
    await sleep(1200);
    assert(
      (await evalJs(`document.querySelector('[data-testid="contact-page-hero"] h1')?.textContent?.trim()`)) === 'Contact Us',
      'Browser reload on /contact renders cleanly'
    );

    // --- RESPONSIVE VIEWPORTS & MOBILE NAVIGATION ---
    console.log('\n9. Verifying Responsive Viewports (1440x900, 1280x800, 768x1024, 390x844)');
    await send('Page.navigate', { url: `${BASE_URL}/company-profile` });
    await sleep(1200);

    const viewports = [
      { w: 1440, h: 900, mobile: false },
      { w: 1280, h: 800, mobile: false },
      { w: 768, h: 1024, mobile: true },
      { w: 390, h: 844, mobile: true }
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(500);
      const overflow = await evalJs(`document.documentElement.scrollWidth > window.innerWidth + 1`);
      assert(!overflow, `Zero horizontal overflow on /company-profile at ${vp.w}x${vp.h}`);
      if (vp.w === 390) {
        await saveScreenshot('company_profile_390x844.png');

        // Test mobile menu direct Company button
        await evalJs(`document.querySelector('[data-testid="mobile-menu-trigger"]')?.click()`);
        await sleep(500);
        const mobileCompany = await evalJs(`(() => {
          const btn = document.querySelector('[data-testid="mobile-nav-company-link"]');
          return {
            exists: Boolean(btn),
            text: btn?.textContent?.trim() || '',
            hasChevron: Boolean(btn?.querySelector('svg'))
          };
        })()`);
        assert(mobileCompany.exists, 'Mobile navigation menu includes direct Company button [data-testid="mobile-nav-company-link"]');
        assert(mobileCompany.text === 'Company', `Mobile Company button text is 'Company' (got '${mobileCompany.text}')`);
        assert(!mobileCompany.hasChevron, 'Mobile Company button does NOT contain chevron or accordion toggle');

        // Click mobile Company button and ensure it navigates cleanly
        await evalJs(`document.querySelector('[data-testid="mobile-nav-company-link"]')?.click()`);
        await sleep(600);
        assert((await evalJs(`window.location.pathname`)) === '/company-profile', 'Clicking mobile Company button navigates cleanly to /company-profile');
      }
    }

    assert(consoleErrors.length === 0, `Zero browser console/runtime errors (${consoleErrors.length} errors)`, consoleErrors.join('; '));
  } finally {
    if (ws) {
      try { ws.close(); } catch (_) {}
    }
    try { edgeProc.kill('SIGKILL'); } catch (_) {}
  }

  console.log(`\n=== Summary: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

