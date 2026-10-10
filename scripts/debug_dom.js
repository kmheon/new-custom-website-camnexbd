const cp = require('child_process');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const p = cp.spawn(EDGE_PATH, ['--headless=new', '--remote-debugging-port=9913', 'about:blank'], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9913/json').then(r => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Page.navigate', params: { url: 'http://127.0.0.1:3000/' } }));
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.method === 'Console.messageAdded' || m.method === 'Runtime.exceptionThrown') {
        console.log('CONSOLE LOG/ERR:', JSON.stringify(m));
      }
      if (m.method === 'Page.loadEventFired') {
        setTimeout(() => {
          ws.send(JSON.stringify({ id: 10, method: 'Runtime.evaluate', params: { expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML.substring(0, 500) : "no root"' } }));
        }, 1500);
      }
      if (m.id === 10) {
        console.log('ROOT DOM:', m.result.result.value);
        p.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Err:', err);
    p.kill();
    process.exit(1);
  }
}, 1500);
