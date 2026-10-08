from pathlib import Path
import json, time, os


PREVIEW = 'https://linkedinpreview-lfzsze7ip-gatteos.vercel.app'
REPO = Path('/Users/gatteomini/agents/lp-eng-agent/linkedinpreview.com')
EVIDENCE = REPO / 'docs/evidence/lin-108/oct06'
BLOCKS = ['*supabase*', '*linkedin.com*', '*stripe.com*', '*stripe.network*', '*openai.com*', '*anthropic.com*', '*posthog*', '*featurebase*', '*tally*', '*/api/*', '*/ingest*']

def assert_isolated():
    state = js('({marker:window.__lin108Isolated, fetch:window.fetch.__isolated, ws:window.WebSocket.__isolated, beacon:navigator.sendBeacon.__isolated, xhr:window.XMLHttpRequest.__isolated})')
    assert all(state.values()), f'Containment missing, STOP: {state}'
    return state

def record(name, detail):
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    path = EVIDENCE / 'fresh-context-smoke.json'
    rows = json.loads(path.read_text()) if path.exists() else []
    rows.append({'name':name, 'detail':detail})
    path.write_text(json.dumps(rows, indent=2))
    print(name, json.dumps(detail))

def isolated_open(path='/', width=1440, height=1000, seed=''):
    carry = {}
    if js("location.origin==='"+PREVIEW+"' && window.__lin108Isolated===true"):
        assert_isolated()
        carry = js("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('lp-')||k.startsWith('lin108-')).map(k=>[k,localStorage.getItem(k)]))")
    context = cdp('Target.createBrowserContext',disposeOnDetach=False)['browserContextId']
    target = cdp('Target.createTarget',url='about:blank',browserContextId=context,background=True)['targetId']
    switch_tab(target)
    info=cdp('Target.getTargetInfo',targetId=target)['targetInfo']
    assert info['browserContextId']==context,info
    cdp('Network.enable')
    cdp('Network.setBlockedURLs', urls=BLOCKS)
    cdp('Page.enable')
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=width<600)
    fixture = (REPO / 'tests/fixtures/draft-first-browser.js').read_text()
    guard = ''';(() => {
      const fixtureFetch = window.fetch;
      window.fetch = async (input, init={}) => {
        const url=new URL(typeof input==='string'?input:input.url, location.href);
        const method=init.method || (input instanceof Request?input.method:'GET');
        if(url.origin!==location.origin && !/supabase/.test(url.hostname)) {
          window.__fixtureRequests.push({path:url.pathname,method,blocked:true});
          return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
        }
        return fixtureFetch(input,init);
      };
      window.fetch.__isolated=true;
      window.WebSocket=class extends EventTarget {
        static CONNECTING=0; static OPEN=1; static CLOSING=2; static CLOSED=3;
        readyState=1;
        constructor(url){super();this.url=url;queueMicrotask(()=>this.onopen?.(new Event('open')))}
        send(){} close(){this.readyState=3}
      };
      window.WebSocket.__isolated=true;
      navigator.sendBeacon=()=>false; navigator.sendBeacon.__isolated=true;
      window.XMLHttpRequest=class {open(){throw Error('Synthetic XHR blocked')} };
      window.XMLHttpRequest.__isolated=true;
      window.__lin108Isolated=true;
    })();'''
    storage_seed=';Object.entries('+json.dumps(carry)+').forEach(([k,v])=>localStorage.setItem(k,v));'
    once_seed=";if(!sessionStorage.getItem('__context_seeded')){"+storage_seed+seed+";sessionStorage.setItem('__context_seeded','1')}"
    cdp('Page.addScriptToEvaluateOnNewDocument', source=fixture+guard+once_seed)
    cdp('Browser.grantPermissions', origin=PREVIEW, browserContextId=context, permissions=['clipboardReadWrite','clipboardSanitizedWrite'])
    goto_url(PREVIEW+path)
    wait_for_load()
    cdp('Page.bringToFront')
    state=assert_isolated()
    record('isolation_'+path[:70]+'_'+str(width), {**state,'fresh_browser_context':context,'target':target,'blocked_urls':BLOCKS})
    return state

def wait_js(expr, seconds=25):
    deadline=time.time()+seconds
    while time.time()<deadline:
        result=js(expr)
        if result: return result
        time.sleep(.25)
    raise AssertionError('Wait failed: '+expr)

def click_text(label, selector='button'):
    assert_isolated()
    position=js('''(() => {
      const e=[...document.querySelectorAll(%s)].find(e=>e.textContent.trim()===%s);
      if(!e) return null;
      e.scrollIntoView({block:'center',behavior:'instant'});
      const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
    })()''' % (json.dumps(selector),json.dumps(label)))
    assert position, 'Missing '+label
    time.sleep(.2)
    click_at_xy(position['x'],position['y'])

def edit_text(text):
    assert_isolated()
    result=js('''(() => {const e=document.querySelector('[contenteditable=true]');
      if(!e)return false;e.focus();document.execCommand('selectAll',false,null);
      document.execCommand('insertText',false,%s);return e.innerText})()''' % json.dumps(text))
    assert result==text, repr(result)

def screenshot(name):
    import base64
    data=cdp('Page.captureScreenshot',format='png')['data']
    (EVIDENCE/name).write_bytes(base64.b64decode(data))
    print('Saved screenshot',str(EVIDENCE/name))

def draft_state():
    return js("JSON.parse(localStorage.getItem('lp-draft-first:11111111-1111-4111-8111-111111111111')||'null')")

def hold_checkout():
    assert_isolated()
    js("(() => {const f=window.fetch;window.fetch=async(input,init={})=>{const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.pathname==='/api/billing/checkout'){window.__fixtureCheckout=JSON.parse(init.body);window.__fixtureRequests.push({path:u.pathname,method:'POST',fixture:true,held:true});return new Promise(()=>{})}return f(input,init)};window.fetch.__isolated=true})()")
    assert_isolated()
