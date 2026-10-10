const cp = require('child_process');
const fs = require('fs');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const edge = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9931',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2500));

  try {
    const list = await fetch('http://127.0.0.1:9931/json').then(r => r.json());
    const pageTarget = list.find(t => t.type === 'page');
    console.log('Target found:', pageTarget.title, pageTarget.url);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.addEventListener('message', (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('PAGE RUNTIME EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
      }
      if (data.method === 'Console.messageAdded') {
        console.log('PAGE CONSOLE:', data.params.message.text);
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    
    console.log('Navigating to http://127.0.0.1:3000/...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    // Wait for React to render
    await new Promise(r => setTimeout(r, 4500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        ({
          title: document.title,
          h1: document.querySelector('h1')?.innerText,
          sections: document.querySelectorAll('section').length,
          productCards: document.querySelectorAll('.group').length,
          specialOfferTitle: document.querySelector('.bg-\\\\[#FAF7F2\\\\] h2')?.innerText,
          bodyHeight: document.body.scrollHeight
        })
      `,
      returnByValue: true
    });
    console.log('Eval results:', evalRes.result.value);

    // Save full desktop screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/desktop-live-1280.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved scratch/shots/desktop-live-1280.png');

    // Scroll to middle
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1000)' });
    await new Promise(r => setTimeout(r, 1000));
    const shotMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/desktop-live-1280-mid.png', Buffer.from(shotMid.data, 'base64'));
    console.log('Saved scratch/shots/desktop-live-1280-mid.png');

    // Scroll to Packages & Solutions (y = 3200)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3200)' });
    await new Promise(r => setTimeout(r, 1000));
    const shotPkgSol = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/desktop-live-packages-solutions.png', Buffer.from(shotPkgSol.data, 'base64'));

    // Scroll to Services & Trending (y = 4800)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 4800)' });
    await new Promise(r => setTimeout(r, 1000));
    const shotServices = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/desktop-live-services-trending.png', Buffer.from(shotServices.data, 'base64'));

    // Scroll to Category Rows & Testimonials (y = 6400)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 6400)' });
    await new Promise(r => setTimeout(r, 1000));
    const shotCategoryRows = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/desktop-live-category-rows.png', Buffer.from(shotCategoryRows.data, 'base64'));

    // Switch to Mobile 375
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await new Promise(r => setTimeout(r, 1500));
    const shotMobTop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/mobile-live-375-top.png', Buffer.from(shotMobTop.data, 'base64'));
    console.log('Saved scratch/shots/mobile-live-375-top.png');

    // Scroll to mobile solutions
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1800)' });
    await new Promise(r => setTimeout(r, 1000));
    const shotMobMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shots/mobile-live-375-mid.png', Buffer.from(shotMobMid.data, 'base64'));
    console.log('Saved scratch/shots/mobile-live-375-mid.png');

    ws.close();
  } finally {
    edge.kill('SIGKILL');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
