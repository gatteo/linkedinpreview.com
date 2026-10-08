import json, time, subprocess, base64
from pathlib import Path

REPO = Path('/Users/gatteomini/agents/lp-eng-agent/linkedinpreview.com')
EVIDENCE = REPO / 'docs/evidence/lin-115'
PREVIEW = 'https://linkedinpreview-butqkctem-gatteos.vercel.app'
DRAFT_PREVIEW = 'https://linkedinpreview-lfzsze7ip-gatteos.vercel.app'
BLOCKS = ['*supabase*', '*linkedin.com*', '*stripe*', '*openai*', '*anthropic*', '*posthog*', '*featurebase*', '*tally*', '*/api/*', '*/ingest*']


def record(name, detail):
    path = EVIDENCE / 'browser-smoke.json'
    rows = json.loads(path.read_text()) if path.exists() else []
    previous = next((row for row in rows if row['name']==name), None)
    if previous:
        assert previous['detail']==detail, (name, previous['detail'], detail)
        print('Repeated assertion matches preserved evidence:', name)
        return
    rows.append({'name': name, 'detail': detail})
    path.write_text(json.dumps(rows, indent=2))
    print(name, json.dumps(detail))


def assert_guard():
    cdp('Network.enable')
    cdp('Network.setBlockedURLs', urls=BLOCKS)
    state = js('({fixture:window.__lin115Contained,fetch:window.fetch.__isolated,ws:window.WebSocket.__isolated,beacon:navigator.sendBeacon.__isolated,xhr:window.XMLHttpRequest.__isolated})')
    assert all(state.values()), f'Containment missing, STOP: {state}'
    return state


def open_isolated(path, width=1440, seed='', origin=PREVIEW):
    context = cdp('Target.createBrowserContext', disposeOnDetach=False)['browserContextId']
    target = cdp('Target.createTarget', url='about:blank', browserContextId=context, background=True)['targetId']
    switch_tab(target)
    info = cdp('Target.getTargetInfo', targetId=target)['targetInfo']
    assert info['browserContextId'] == context, info
    cdp('Network.enable')
    cdp('Network.setBlockedURLs', urls=BLOCKS)
    cdp('Page.enable')
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1000 if width>600 else 844, deviceScaleFactor=1, mobile=width<600)
    fixture = subprocess.check_output(['git','show','20b4de7529d63287d9101c33890bfb0007134a84:tests/fixtures/draft-first-browser.js'], cwd=REPO, text=True)
    guard = ''';(() => {
      const f=window.fetch;
      window.fetch=async(input,init={})=>{
        const url=new URL(typeof input==='string'?input:input.url,location.href);
        if(url.origin!==location.origin && !/supabase/.test(url.hostname)) {
          window.__fixtureRequests.push({path:url.pathname,method:init.method||'GET',blocked:true});
          return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
        }
        return f(input,init);
      }; window.fetch.__isolated=true;
      window.WebSocket=class extends EventTarget {
        static CONNECTING=0; static OPEN=1; static CLOSING=2; static CLOSED=3;
        readyState=1; constructor(url){super();this.url=url;queueMicrotask(()=>this.onopen?.(new Event('open')))}
        send(){} close(){this.readyState=3}
      }; window.WebSocket.__isolated=true;
      navigator.sendBeacon=()=>false; navigator.sendBeacon.__isolated=true;
      window.XMLHttpRequest=class {open(){throw Error('Synthetic XHR blocked')}}; window.XMLHttpRequest.__isolated=true;
      window.__lin115Contained=true;
      window.__clipboardOriginal=navigator.clipboard;
      window.__guardedNavigation=[];
      window.navigation?.addEventListener('navigate', e=>{
        const url=new URL(e.destination.url);
        if(!location.pathname.startsWith('/dashboard') && url.pathname.startsWith('/dashboard')){
          window.__guardedNavigation.push(url.pathname+url.search);e.preventDefault();
        }
      });
    })();'''
    cdp('Page.addScriptToEvaluateOnNewDocument', source=fixture+guard+';'+seed)
    cdp('Browser.grantPermissions', origin=origin, browserContextId=context, permissions=['clipboardReadWrite','clipboardSanitizedWrite'])
    goto_url(origin+path)
    wait_for_load()
    cdp('Page.bringToFront')
    assert_guard()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    contexts = EVIDENCE / 'browser-contexts.json'
    rows = json.loads(contexts.read_text()) if contexts.exists() else []
    rows.append({'context':context,'target':target,'origin':origin,'path':path,'width':width,'blocked_urls':BLOCKS})
    contexts.write_text(json.dumps(rows, indent=2))
    return context


def wait_js(expr, seconds=25):
    deadline=time.time()+seconds
    while time.time()<deadline:
        result=js(expr)
        if result: return result
        time.sleep(.2)
    raise AssertionError('Wait failed: '+expr)


def click_label(label, selector='button'):
    assert_guard()
    position=js('''(() => {
      const e=[...document.querySelectorAll(%s)].find(e=>e.textContent.trim()===%s && e.getBoundingClientRect().width>0);
      if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});
      const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
    })()''' % (json.dumps(selector),json.dumps(label)))
    assert position, 'Missing '+label
    time.sleep(.25)
    click_at_xy(position['x'],position['y'])


def edit_text(text):
    assert_guard()
    result=js('''(() => {const e=document.querySelector('[contenteditable=true]');
      if(!e)return false;e.focus();document.execCommand('selectAll',false,null);
      document.execCommand('insertText',false,%s);return e.innerText})()''' % json.dumps(text))
    assert result==text, repr(result)


def shot(name):
    assert_guard()
    data=cdp('Page.captureScreenshot',format='png')['data']
    (EVIDENCE/name).write_bytes(base64.b64decode(data))
    print(str(EVIDENCE/name))


def close_context(context):
    cdp('Target.disposeBrowserContext',browserContextId=context)
    ensure_real_tab()
