ENTRIES = [
    ('/blog/where-are-linkedin-drafts-saved','Work on my recovered draft'),
    ('/blog/linkedin-post-length-guide-2026','Check my draft length'),
    ('/blog/how-to-write-open-to-work-linkedin-post','Edit my announcement'),
    ('/blog/how-to-draft-linkedin-posts','Draft and preview here'),
]


def article_case(index,width):
    path,label=ENTRIES[index]
    prefix=f'final_{index}_{width}'
    restored=f'Synthetic stored draft LIN115 {index} {width}'
    text=f'Synthetic edited draft LIN115 {index} {width}'
    doc={'type':'doc','content':[{'type':'paragraph','content':[{'type':'text','text':restored}]}]}
    seed="localStorage.setItem('linkedinpreview-draft',JSON.stringify("+json.dumps(doc)+"));"
    context=open_isolated(path,width,seed)
    try:
        wait_js("!!document.querySelector('a[aria-expanded]')")
        if js("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Decline')"):
            click_label('Decline')
        before=js("({href:document.querySelector('a[aria-expanded]').getAttribute('href'),label:document.querySelector('a[aria-expanded]').textContent,editors:document.querySelectorAll('[contenteditable=true]').length,regions:document.querySelectorAll('[data-article-tool]').length,requests:window.__fixtureRequests.length})")
        assert before['label']==label and before['editors']==0 and before['regions']==0 and before['requests']==0,before
        assert before['href']=='/?utm_source=linkedinpreview.com&utm_medium=blog&utm_content=card_cta#tool',before
        record(prefix+'_lazy_fallback',before)
        assert_guard()
        modified=js("""(() => {
          const a=document.querySelector('a[aria-expanded]');let observed;
          const prevent=(e)=>{observed=e.defaultPrevented;e.preventDefault()};
          document.addEventListener('click',prevent,{once:true});
          a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true,button:0}));
          return {appPrevented:observed,regions:document.querySelectorAll('[data-article-tool]').length};
        })()""")
        assert not modified['appPrevented'] and modified['regions']==0,modified
        record(prefix+'_modified_click_fallback',modified)
        assert_guard()
        if index==0:
            js("document.querySelector('a[aria-expanded]').focus()")
            cdp('Input.dispatchKeyEvent',type='rawKeyDown',key='Enter',code='Enter',windowsVirtualKeyCode=13)
            cdp('Input.dispatchKeyEvent',type='keyUp',key='Enter',code='Enter',windowsVirtualKeyCode=13)
        else:
            click_label(label,'a')
        wait_js("document.querySelector('[contenteditable=true]')?.innerText==="+json.dumps(restored))
        state=js("({expanded:document.querySelector('a[aria-expanded]').getAttribute('aria-expanded'),editors:document.querySelectorAll('[contenteditable=true]').length,regions:document.querySelectorAll('[data-article-tool]').length,overflow:document.documentElement.scrollWidth>innerWidth,text:document.querySelector('[contenteditable=true]').innerText})")
        assert state['expanded']=='true' and state['regions']==1 and state['editors']==1 and not state['overflow'],state
        record(prefix+'_restored_single_tool',state)
        edit_text(text)
        click_label('Preview')
        wait_js("[...document.querySelectorAll('[data-article-tool] .whitespace-pre-line')].some(e=>e.textContent==="+json.dumps(text)+")")
        assert_guard()
        wait_js("!!document.querySelector('[data-article-tool] .invisible [contenteditable=true]')")
        time.sleep(.2)
        record(prefix+'_typing_preview',{'text':text,'preview_visible':True})
        if index in [0,1]:
            js("document.querySelector('[data-article-tool]').scrollIntoView({block:'center',behavior:'instant'})")
            shot(f'final-{index}-{width}-preview.png')
        click_label('Editor')
        assert_guard()
        js("void(window.__activeEditor=document.querySelector('[contenteditable=true]'))")
        click_label(label,'a')
        assert_guard()
        retained=js("({sameEditor:window.__activeEditor===document.querySelector('[contenteditable=true]'),text:document.querySelector('[contenteditable=true]').innerText,regions:document.querySelectorAll('[data-article-tool]').length})")
        assert retained['sameEditor'] and retained['text']==text and retained['regions']==1,retained
        record(prefix+'_tab_reopen_retention',retained)
        click_label('Copy Text')
        wait_js("document.body.innerText.includes('Text copied to clipboard')")
        assert_guard()
        assert js("navigator.clipboard===window.__clipboardOriginal")
        clipboard=js("navigator.clipboard.readText()")
        assert clipboard==text,clipboard
        record(prefix+'_native_clipboard',{'originalAPI':True,'readback':clipboard})
        if index==0:
            assert_guard()
            previous=js("window.__fixtureRequests.filter(r=>r.path==='/api/analyze').length")
            js("void Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('SYNTHETIC_CLIPBOARD_DENIED'))}})")
            click_label('Copy Text')
            wait_js("document.body.innerText.includes('Failed to copy text: Error: SYNTHETIC_CLIPBOARD_DENIED')")
            assert_guard()
            after=js("window.__fixtureRequests.filter(r=>r.path==='/api/analyze').length")
            assert after==previous,(previous,after)
            js("void Object.defineProperty(navigator,'clipboard',{configurable:true,value:window.__clipboardOriginal})")
            assert js("navigator.clipboard.readText()") == text
            record(prefix+'_failed_clipboard',{'syntheticFailureToast':True,'noNewAnalysis':True,'originalClipboardRetained':True})
        if index==0:
            shot(f'final-{index}-{width}-editor.png')
            click_label('Create my LinkedIn plan')
            target=wait_js("window.__guardedNavigation.at(-1)")
            from urllib.parse import urlparse,parse_qs
            parsed=urlparse(target); params=parse_qs(parsed.query)
            assert parsed.path=='/dashboard/editor' and params.get('from')==['tool_footer'] and params.get('import'),target
            (EVIDENCE/f'import-{width}.json').write_text(json.dumps({'target':target,'text':text}))
            record(prefix+'_content_carrying_footer',{'path':parsed.path,'source':params['from'][0],'hasEncodedImport':True,'navigationHeld':True})
        errors=js("window.__fixtureErrors")
        assert not errors,errors
        record(prefix+'_runtime_containment',{'errors':errors,'markers':assert_guard(),'intercepted':js('window.__fixtureRequests')})
    finally:
        close_context(context)
