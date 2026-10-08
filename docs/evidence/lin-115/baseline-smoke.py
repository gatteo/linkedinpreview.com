def baseline_case(width):
    ctx=open_isolated('/',width)
    try:
        wait_js("!!document.querySelector('[contenteditable=true]')")
        if js("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Decline')"):
            click_label('Decline')
        text=f'Synthetic homepage smoke {width}'
        edit_text(text)
        if width==390:
            click_label('Preview')
            wait_js("!!document.querySelector('.invisible [contenteditable=true]')")
        wait_js("[...document.querySelectorAll('.whitespace-pre-line')].some(e=>e.textContent==="+json.dumps(text)+")")
        if width==390:
            click_label('Editor')
            wait_js("getComputedStyle(document.querySelector('[contenteditable=true]')).visibility==='visible'")
        click_label('Copy Text')
        wait_js("document.body.innerText.includes('Text copied to clipboard')")
        assert_guard()
        assert js("navigator.clipboard.readText()") == text
        record(f'final_home_{width}',{'text':text,'preview':True,'nativeCopy':True,'errors':js('window.__fixtureErrors'),'guard':assert_guard()})
    finally:
        close_context(ctx)


def route_case(path,width,expect):
    ctx=open_isolated(path,width)
    try:
        wait_js('document.body.innerText.includes('+json.dumps(expect)+')')
        assert_guard()
        state=js("({text:document.body.innerText.slice(0,550),articleRegions:document.querySelectorAll('[data-article-tool]').length,errors:window.__fixtureErrors,guard:window.__lin115Contained})")
        assert state['articleRegions']==0 and not state['errors'],state
        record(f'final_route_{path.replace("/","_")}_{width}',state)
    finally:
        close_context(ctx)


def import_case(width):
    data=json.loads((EVIDENCE/f'import-{width}.json').read_text())
    ctx=open_isolated(data['target'],width,origin=DRAFT_PREVIEW)
    try:
        wait_js("!!document.querySelector('[contenteditable=true]')")
        assert_guard()
        found=js("document.querySelector('[contenteditable=true]').innerText")
        assert found==data['text'],found
        edited=found+' meaningful synthetic edit'
        edit_text(edited)
        wait_js("window.__fixtureRequests.some(r=>r.method==='PATCH'&&r.path==='/rest/v1/drafts')")
        wait_js("Object.keys(localStorage).filter(k=>k.startsWith('lp-draft-first:')).some(k=>JSON.parse(localStorage.getItem(k)).used===true)")
        assert_guard()
        result=js("({text:document.querySelector('[contenteditable=true]').innerText,url:location.pathname+location.search,meaningful:Object.keys(localStorage).filter(k=>k.startsWith('lp-draft-first:')).map(k=>JSON.parse(localStorage.getItem(k))),saved:window.__fixtureRequests.filter(r=>r.method==='PATCH'&&r.path==='/rest/v1/drafts'),errors:window.__fixtureErrors,guard:window.__lin115Contained})")
        assert result['text']==edited and any(s.get('used') and s.get('entrySource')=='tool_footer' for s in result['meaningful']) and result['saved'] and not result['errors'],result
        assert 'import=' not in result['url'] and 'from=tool_footer' in result['url'],result
        record(f'final_import_used_{width}',result)
    finally:
        close_context(ctx)
