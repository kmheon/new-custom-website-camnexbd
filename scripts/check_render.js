const cp = require('child_process');
const fs = require('fs');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const edge = cp.spawn(EDGE_PATH, ['--headless=new', '--remote-debugging-port=9920', 'about:blank'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const list = await fetch('http://127.0.0.1:9920/json').then(r => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    
    await new Promise(r => { ws.onopen = r; });
    
    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.addEventListener('message', (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
      }
      if (data.method === 'Console.messageAdded') {
        console.log('CONSOLE:', data.params.message.text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Console.enable');

    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 4000));

    const htmlRes = await send('Runtime.evaluate', { expression: 'document.body.innerHTML' });
    const html = htmlRes.result.value || '';
    fs.writeFileSync('scratch/rendered_body.html', html);
    console.log('Rendered body length:', html.length);
    console.log('First 300 chars:', html.substring(0, 300));
    ws.close();
  } finally {
    edge.kill('SIGKILL');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
