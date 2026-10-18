// scripts/debug_solutions_mobile.js
const cp = require('child_process');
const fs = require('fs');

async function check() {
  const edgeProc = cp.spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9955',
    '--user-data-dir=C:\\Windows\\Temp\\edge_diag_sol',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  const list = await fetch('http://127.0.0.1:9955/json').then(r => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  
  let id = 1;
  const send = (m, p={}) => new Promise(res => {
    const cur = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await new Promise(r => setTimeout(r, 3500));

  const sections = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('section')).map(s => ({
        id: s.id,
        ariaLabel: s.getAttribute('aria-label'),
        title: s.querySelector('h2, [class*="SectionHeader"] h2, h3')?.innerText
      }));
    })()`,
    returnByValue: true
  });
  console.log('Homepage Sections found:');
  console.log(JSON.stringify(sections.result.value, null, 2));

  const widths = [320, 360, 375, 390];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 812, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 800));

    const diag = await send('Runtime.evaluate', {
      expression: `(() => {
        const section = document.querySelector('#solutions') || Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('Our Solutions') || s.getAttribute('aria-label')?.includes('Solutions'));
        if (!section) return { error: 'No Solutions section found' };
        const grid = section.querySelector('.grid');
        const cards = Array.from(section.querySelectorAll('[data-solution-id]'));
        return {
          viewportWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          sectionId: section.id,
          sectionScrollWidth: section.scrollWidth,
          sectionClientWidth: section.clientWidth,
          gridScrollWidth: grid ? grid.scrollWidth : null,
          gridClientWidth: grid ? grid.clientWidth : null,
          cards: cards.map(c => ({
            id: c.getAttribute('data-solution-id'),
            inlineGridColumn: c.style.gridColumn,
            offsetWidth: c.offsetWidth,
            clientWidth: c.clientWidth,
            scrollWidth: c.scrollWidth
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log(`\n=== Width ${w}px ===`);
    console.log(JSON.stringify(diag.result.value, null, 2));

    // Scroll to solutions section
    await send('Runtime.evaluate', {
      expression: `(() => {
        const s = document.querySelector('#solutions') || Array.from(document.querySelectorAll('section')).find(sec => sec.innerText.includes('Our Solutions'));
        if (s) s.scrollIntoView();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b\\solutions_broken_${w}px.png`, Buffer.from(ss.data, 'base64'));
    console.log(`Saved solutions_broken_${w}px.png`);
  }

  ws.close();
  edgeProc.kill('SIGTERM');
}
check().catch(console.error);

