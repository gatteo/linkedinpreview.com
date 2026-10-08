import json, time, base64
from pathlib import Path
REPO=Path('/Users/gatteomini/agents/lp-eng-agent/linkedinpreview.com')
OUT=REPO/'docs/evidence/lin-108/oct07'
PREVIEW='https://linkedinpreview-9n9vdduaa-gatteos.vercel.app'
BLOCKS=['*supabase*','*linkedin.com*','*stripe*','*openai*','*anthropic*','*posthog*','*featurebase*','*tally*','*googletagmanager*','*google-analytics*','*google.com*','*doubleclick*','*/api/*','*/ingest*']
USER='11111111-1111-4111-8111-111111111111'
def record(name,detail):
 p=OUT/'browser.json'; rows=json.loads(p.read_text()) if p.exists() else []
 assert not any(r['name']==name for r in rows),name
 rows.append({'name':name,'detail':detail}); p.write_text(json.dumps(rows,indent=2)); print(name,json.dumps(detail))
def wait_js(expr,seconds=30):
 end=time.time()+seconds
 while time.time()<end:
  value=js(expr)
  if value:return value
  time.sleep(.2)
 raise AssertionError(expr)
def guard():
 cdp('Network.setBlockedURLs',urls=BLOCKS)
 v=js('({marker:window.__lin108Isolated,contained:window.__contained,fetch:window.fetch.__isolated,ws:window.WebSocket.__isolated,beacon:navigator.sendBeacon.__isolated,xhr:window.XMLHttpRequest.__isolated})')
 assert all(v.values()),'Containment absent, STOP '+str(v)
 return v
def open_isolated(path='/',width=1440,seed=''):
 context=cdp('Target.createBrowserContext',disposeOnDetach=False)['browserContextId']
 target=cdp('Target.createTarget',url='about:blank',browserContextId=context,background=True)['targetId']
 switch_tab(target); cdp('Network.enable'); cdp('Network.setBlockedURLs',urls=BLOCKS); cdp('Page.enable')
 cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000 if width>600 else 844,deviceScaleFactor=1,mobile=width<600)
 fixture=(REPO/'tests/fixtures/draft-first-browser.js').read_text()
 header=(REPO/'tests/fixtures/header-entry-browser.js').read_text()
 cdp('Page.addScriptToEvaluateOnNewDocument',source='window.__flagValue=undefined;'+fixture+header+';window.__lin108Isolated=true;'+seed)
 cdp('Browser.grantPermissions',origin=PREVIEW,browserContextId=context,permissions=['clipboardReadWrite','clipboardSanitizedWrite'])
 goto_url(PREVIEW+path); wait_for_load(); cdp('Page.bringToFront'); state=guard()
 p=OUT/'contexts.json'; rows=json.loads(p.read_text()) if p.exists() else []
 rows.append({'context':context,'target':target,'path':path,'width':width,'closed':False,'isolation':state,'blocked':BLOCKS}); p.write_text(json.dumps(rows,indent=2))
 return context
def click_selector(selector):
 guard(); point=js('''(() => {const e=document.querySelector(%s);if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()'''%json.dumps(selector))
 assert point and point['w'] and point['h'],point
 time.sleep(.25); click_at_xy(point['x'],point['y'])
def click_text(text,selector='button,a'):
 guard(); point=js('''(() => {const e=[...document.querySelectorAll(%s)].find(e=>e.textContent.trim()===%s);if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()'''%(json.dumps(selector),json.dumps(text)))
 assert point and point['w'] and point['h'],point
 time.sleep(.25); click_at_xy(point['x'],point['y'])
def edit(text):
 guard(); js("(() => {const e=document.querySelector('[contenteditable=true]');e.focus();document.execCommand('selectAll',false,null)})()"); cdp('Input.insertText',text=text)
 assert js("document.querySelector('[contenteditable=true]').innerText")==text
 deferral=js("JSON.parse(localStorage.getItem('lp-draft-first:'+"+json.dumps(USER)+")||'null')")
 return deferral
def shot(name):
 guard(); p=OUT/name;p.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']));print(str(p))
def carry():
 guard(); return js("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('lp-')||k.startsWith('lin108-')).map(k=>[k,localStorage.getItem(k)]))")
def seed_storage(state):
 return 'Object.entries('+json.dumps(state)+').forEach(([k,v])=>localStorage.setItem(k,v));'
def close_context(context):
 errors=js('window.__fixtureErrors');assert not errors,errors
 record('errors-'+context,{'errors':errors,'requests':js('window.__fixtureRequests')})
 cdp('Target.disposeBrowserContext',browserContextId=context)
 p=OUT/'contexts.json';rows=json.loads(p.read_text())
 for r in rows:
  if r['context']==context:r['closed']=True
 p.write_text(json.dumps(rows,indent=2)); ensure_real_tab()
