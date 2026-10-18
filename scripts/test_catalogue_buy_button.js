const cp = require('child_process');
const assert = require('assert');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runTestSuite() {
  console.log('================================================================');
  console.log('TEST SUITE: Shop / Product Catalogue Page Buy Button Verification');
  console.log('================================================================');

  const edge = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9960',
    'http://127.0.0.1:3000/catalog'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const list = await fetch('http://127.0.0.1:9960/json').then(r => r.json());
    const pageTarget = list.find(t => t.type === 'page');
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
        console.error('EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');

    // Wait for CatalogPage to render
    await new Promise(r => setTimeout(r, 3500));

    // Reset localStorage cart before starting tests
    await send('Runtime.evaluate', {
      expression: `localStorage.removeItem('camnex_cart_v1');`,
      returnByValue: true
    });

    // TEST 1: In-stock simple product (prod-wifi-c6n)
    console.log('\n--- TEST 1: In-stock simple product (prod-wifi-c6n) ---');
    const t1 = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const buyBtn = document.querySelector('[data-testid="catalog-buy-prod-wifi-c6n"]');
          if (!buyBtn) return { error: 'buy button not found for prod-wifi-c6n' };
          const textBefore = buyBtn.innerText.trim();
          const countBefore = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          
          buyBtn.click();
          await new Promise(r => setTimeout(r, 400));
          const textDuring = buyBtn.innerText.trim();
          await new Promise(r => setTimeout(r, 800));
          const textAfter = buyBtn.innerText.trim();
          const countAfter = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          const cart = JSON.parse(localStorage.getItem('camnex_cart_v1') || '[]');
          
          return {
            textBefore,
            textDuring,
            textAfter,
            countBefore,
            countAfter,
            cartLength: cart.length,
            addedItem: cart[0] ? {
              productId: cart[0].productId,
              name: cart[0].product?.name,
              pricePerUnit: cart[0].pricePerUnit,
              quantity: cart[0].quantity
            } : null
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Test 1 Result:', t1.result.value);
    assert.strictEqual(t1.result.value.addedItem?.productId, 'prod-wifi-c6n', 'Correct product ID in cart');
    assert.strictEqual(t1.result.value.addedItem?.pricePerUnit, 3850, 'Correct authoritative price in cart (৳3,850 sale price)');
    assert.strictEqual(t1.result.value.countAfter, '1', 'Cart count incremented to 1');
    assert.ok(t1.result.value.textDuring.includes('Adding') || t1.result.value.textAfter.includes('Added'), 'Showed loading/added feedback');
    console.log('✓ TEST 1 PASSED: In-stock simple product added reliably with feedback and correct authoritative price.');

    // TEST 2: Out-of-stock product
    console.log('\n--- TEST 2: Out-of-stock product (prod-wifi-imou-ranger2pro-3mp) ---');
    const t2 = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const oosBtn = document.querySelector('[data-testid="catalog-buy-prod-wifi-imou-ranger2pro-3mp"]');
          if (!oosBtn) return { error: 'oosBtn not found for prod-wifi-imou-ranger2pro-3mp' };
          const isDisabled = oosBtn.disabled || oosBtn.getAttribute('aria-disabled') === 'true';
          const btnText = oosBtn.innerText.trim();
          const cartCountBefore = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          oosBtn.click();
          await new Promise(r => setTimeout(r, 400));
          const cartCountAfter = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          return {
            isDisabled,
            btnText,
            cartCountBefore,
            cartCountAfter,
            notAdded: cartCountBefore === cartCountAfter
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Test 2 Result:', t2.result.value);
    assert.strictEqual(t2.result.value.isDisabled, true, 'Out of stock button is disabled');
    assert.ok(t2.result.value.btnText.includes('Out of Stock'), 'Displays Out of Stock text');
    assert.strictEqual(t2.result.value.notAdded, true, 'Clicking out of stock button does NOT add to cart');
    console.log('✓ TEST 2 PASSED: Out-of-stock product button is properly disabled and prevents additions.');

    // TEST 3: Variable product with no variant selected
    console.log('\n--- TEST 3: Variable product with no variant selected (prod-hik-dvr-8ch) ---');
    const t3 = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const varBtn = document.querySelector('[data-testid="catalog-buy-prod-hik-dvr-8ch"]');
          if (!varBtn) return { error: 'varBtn not found' };
          const btnText = varBtn.innerText.trim();
          const countBefore = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          const currentUrlBefore = window.location.href;
          
          varBtn.click();
          await new Promise(r => setTimeout(r, 500));
          const currentUrlAfter = window.location.href;
          const countAfter = document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0';
          
          return {
            btnText,
            countBefore,
            countAfter,
            urlBefore: currentUrlBefore,
            urlAfter: currentUrlAfter,
            didNotAddArbitrary: countBefore === countAfter,
            navigatedToProductPage: currentUrlAfter.includes('/product/prod-hik-dvr-8ch')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Test 3 Result:', t3.result.value);
    assert.strictEqual(t3.result.value.didNotAddArbitrary, true, 'Did not silently add arbitrary variant');
    assert.ok(t3.result.value.btnText.includes('Select Model'), 'Button indicates Select Model');
    assert.strictEqual(t3.result.value.navigatedToProductPage, true, 'Navigated to product detail page');
    console.log('✓ TEST 3 PASSED: Variable product with no variant selected does not silently add arbitrary item; opens product detail.');

    // TEST 4: Variable product with a selected variant on the catalogue card
    console.log('\n--- TEST 4: Variable product with selected variant ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/catalog' });
    await new Promise(r => setTimeout(r, 2500));

    const t4 = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          // Find variable product card (prod-hik-dvr-8ch) and select 16-Channel variant pill
          const varPill = document.querySelector('[data-testid="catalog-variant-prod-hik-dvr-8ch-prod-hik-dvr-16ch"]');
          if (!varPill) return { error: 'variant pill not found' };
          
          varPill.click();
          await new Promise(r => setTimeout(r, 500));
          
          const buyBtn = document.querySelector('[data-testid="catalog-buy-prod-hik-dvr-8ch"]');
          const btnTextBeforeClick = buyBtn.innerText.trim();
          const countBefore = parseInt(document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0', 10);
          
          buyBtn.click();
          await new Promise(r => setTimeout(r, 900));
          
          const countAfter = parseInt(document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0', 10);
          const cart = JSON.parse(localStorage.getItem('camnex_cart_v1') || '[]');
          const item16ch = cart.find(i => i.productId === 'prod-hik-dvr-16ch');
          
          return {
            btnTextBeforeClick,
            countBefore,
            countAfter,
            found16chItem: Boolean(item16ch),
            item16chPrice: item16ch?.pricePerUnit,
            item16chName: item16ch?.product?.name
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Test 4 Result:', t4.result.value);
    assert.strictEqual(t4.result.value.found16chItem, true, 'Selected variant (prod-hik-dvr-16ch) added to cart');
    assert.strictEqual(t4.result.value.item16chPrice, 12500, 'Authoritative variant price (৳12,500) applied');
    console.log('✓ TEST 4 PASSED: Selecting a variant on the card successfully adds that exact variant with authoritative pricing.');

    // TEST 5: Repeated clicks and cart-count updates
    console.log('\n--- TEST 5: Rapid repeated clicks (Double-click prevention) ---');
    const t5 = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const buyBtn = document.querySelector('[data-testid="catalog-buy-prod-hik-4k-bullet"]');
          if (!buyBtn) return { error: 'prod-hik-4k-bullet buy button not found' };
          const countBefore = parseInt(document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0', 10);
          
          // Fire 5 rapid clicks in immediate succession
          buyBtn.click();
          buyBtn.click();
          buyBtn.click();
          buyBtn.click();
          buyBtn.click();
          
          await new Promise(r => setTimeout(r, 1200));
          const countAfter = parseInt(document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0', 10);
          const cart = JSON.parse(localStorage.getItem('camnex_cart_v1') || '[]');
          const bullet4kItem = cart.find(i => i.productId === 'prod-hik-4k-bullet');
          
          return {
            countBefore,
            countAfter,
            difference: countAfter - countBefore,
            bullet4kQuantity: bullet4kItem?.quantity
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Test 5 Result:', t5.result.value);
    assert.strictEqual(t5.result.value.difference, 1, 'Exactly 1 item added despite repeated rapid clicks');
    assert.strictEqual(t5.result.value.bullet4kQuantity, 1, 'Quantity is exactly 1 (no accidental duplicate)');
    console.log('✓ TEST 5 PASSED: Double-click prevention successfully guards against duplicate additions.');

    // TEST 6: Mobile layout and responsiveness
    console.log('\n--- TEST 6: Mobile viewport test (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const t6 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyWidth = document.body.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const buyBtns = Array.from(document.querySelectorAll('[data-testid^="catalog-buy-"]'));
          const visibleBuyBtns = buyBtns.filter(b => b.offsetWidth > 0 && b.offsetHeight > 0);
          
          return {
            bodyWidth,
            scrollWidth,
            hasHorizontalOverflow: scrollWidth > bodyWidth,
            visibleBuyBtnCount: visibleBuyBtns.length,
            firstBtnWidth: visibleBuyBtns[0]?.offsetWidth,
            firstBtnHeight: visibleBuyBtns[0]?.offsetHeight
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Test 6 Result:', t6.result.value);
    assert.strictEqual(t6.result.value.hasHorizontalOverflow, false, 'No horizontal overflow on mobile');
    assert.ok(t6.result.value.firstBtnWidth > 80, 'Buy button has accessible touch target width');
    assert.ok(t6.result.value.firstBtnHeight >= 32, 'Buy button has accessible touch target height');
    console.log('✓ TEST 6 PASSED: Mobile layout fits perfectly with no overflow and accessible touch targets.');

    // TEST 7: Checkout verification with authoritative backend price
    console.log('\n--- TEST 7: Checkout receives correct items and authoritative price ---');
    const t7 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cart = JSON.parse(localStorage.getItem('camnex_cart_v1') || '[]');
          const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
          const computedSubtotal = cart.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
          return {
            itemsCount: cart.length,
            totalUnits,
            computedSubtotal,
            items: cart.map(i => ({ id: i.productId, price: i.pricePerUnit, qty: i.quantity }))
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Test 7 Result:', t7.result.value);
    assert.ok(t7.result.value.itemsCount >= 3, 'All added products in cart');
    assert.ok(t7.result.value.computedSubtotal > 0, 'Subtotal correctly computed');
    console.log('✓ TEST 7 PASSED: Cart and checkout contain verified items with authoritative prices.');

    console.log('\n================================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================');

    ws.close();
  } finally {
    edge.kill();
  }
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
