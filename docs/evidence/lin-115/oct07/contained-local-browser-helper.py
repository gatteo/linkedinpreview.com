# Fresh contained local verification only, never a Vercel preview claim.
from pathlib import Path
exec(Path('/Users/gatteomini/agents/lp-eng-agent/resources/lin-115-browser-helper.py').read_text(), globals())
EVIDENCE = REPO / 'docs/evidence/lin-115/oct07/local-browser'
PREVIEW = 'http://127.0.0.1:3155'
DRAFT_PREVIEW = PREVIEW
BLOCKS += ['*googletagmanager*', '*google-analytics*', '*google.com*', '*doubleclick*']
FIXTURE_HEAD = 'd2fcaa685f94b5bf7e2e401b9212ded6bb91513a'

TRANSPORT = ''';(() => {
 const f=window.fetch;
 window.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin!==location.origin && !/supabase/.test(url.hostname))
   return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
  return f(input,init);
 }; window.fetch.__isolated=true;
 window.WebSocket=class extends EventTarget {
  static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
  readyState=1;constructor(url){super();this.url=url;queueMicrotask(()=>this.onopen?.(new Event('open')))}
  send(){}close(){this.readyState=3}
 };window.WebSocket.__isolated=true;
 navigator.sendBeacon=()=>false;navigator.sendBeacon.__isolated=true;
 window.XMLHttpRequest=class{open(){throw Error('Synthetic XHR blocked')}};
 window.XMLHttpRequest.__isolated=true;
 window.__lin115Contained=true;window.__lin115Fixture='oct07-local-accepted-draft';
 window.__clipboardOriginal=navigator.clipboard;
 window.__guardedNavigation=[];
 window.navigation?.addEventListener('navigate',e=>{
  const u=new URL(e.destination.url);
  if(!location.pathname.startsWith('/dashboard') && u.pathname.startsWith('/dashboard')){
   window.__guardedNavigation.push(u.pathname+u.search);e.preventDefault();
  }
 });
})();'''

def assert_guard():
    cdp('Network.enable')
    cdp('Network.setBlockedURLs', urls=BLOCKS)
    state=js('({fixture:window.__lin115Fixture,contained:window.__lin115Contained,fetch:window.fetch.__isolated,ws:window.WebSocket.__isolated,beacon:navigator.sendBeacon.__isolated,xhr:window.XMLHttpRequest.__isolated})')
    assert state['fixture']=='oct07-local-accepted-draft' and all(state.values()), 'Missing containment, STOP '+str(state)
    return state

def open_isolated(path,width=1440,seed='',origin=None):
    origin=origin or PREVIEW
    context=cdp('Target.createBrowserContext',disposeOnDetach=False)['browserContextId']
    target=cdp('Target.createTarget',url='about:blank',browserContextId=context,background=True)['targetId']
    switch_tab(target)
    cdp('Network.enable');cdp('Network.setBlockedURLs',urls=BLOCKS);cdp('Page.enable')
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000 if width>600 else 844,deviceScaleFactor=1,mobile=width<600)
    fixture=subprocess.check_output(['git','show',FIXTURE_HEAD+':tests/fixtures/draft-first-browser.js'],cwd=REPO,text=True)
    header=(REPO/'tests/fixtures/header-entry-browser.js').read_text()
    # Execute inspected synthetic backend and all transport guards on blank BEFORE navigation.
    js(fixture+TRANSPORT)
    source='window.__flagValue=undefined;'+fixture+header+TRANSPORT+';'+seed
    installed=cdp('Page.addScriptToEvaluateOnNewDocument',source=source)
    assert installed.get('identifier'), 'Missing new-document fixture, STOP'
    before=assert_guard()
    cdp('Browser.grantPermissions',origin=origin,browserContextId=context,permissions=['clipboardReadWrite','clipboardSanitizedWrite'])
    goto_url(origin+path);wait_for_load();cdp('Page.bringToFront');after=assert_guard()
    EVIDENCE.mkdir(parents=True,exist_ok=True)
    p=EVIDENCE/'browser-contexts.json';rows=json.loads(p.read_text()) if p.exists() else []
    rows.append({'context':context,'target':target,'origin':origin,'path':path,'width':width,'fixture_head':FIXTURE_HEAD,'before_navigation':before,'after_navigation':after,'closed':False,'blocked_urls':BLOCKS})
    p.write_text(json.dumps(rows,indent=2))
    return context

def close_context(context):
    errors=js('window.__fixtureErrors')
    record('errors-'+context,{'errors':errors,'requests':js('window.__fixtureRequests')})
    cdp('Target.disposeBrowserContext',browserContextId=context)
    p=EVIDENCE/'browser-contexts.json';rows=json.loads(p.read_text())
    for row in rows:
        if row['context']==context:row['closed']=True
    p.write_text(json.dumps(rows,indent=2));ensure_real_tab()

exec(Path('/Users/gatteomini/agents/lp-eng-agent/resources/lin-115-article-smoke.py').read_text(),globals())
exec(Path('/Users/gatteomini/agents/lp-eng-agent/resources/lin-115-baseline-smoke.py').read_text(),globals())
