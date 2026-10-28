// Evaluate in the preview after two successful copies on / or /formatter.
// Run at mobile width with consent undecided and again after dismissal.
;(() => {
    const assert = (condition, message) => {
        if (!condition) throw new Error(message)
    }

    assert(['/', '/formatter'].includes(location.pathname), 'expected a public discovery surface')
    const question = document.querySelector('[aria-label="Optional visitor question"]')
    assert(question, 'question must be mounted after two successful copies')
    assert(getComputedStyle(question).position === 'static', 'question must reserve space, not float over controls')
    const tool = document.querySelector('#tool')
    assert(tool?.contains(question), 'question must stay in the tool section')
    const buttons = [...tool.querySelectorAll('button')]
    const find = (text) => buttons.find((button) => button.innerText.trim() === text)
    const copy = find('Copy Text')
    const draft = find('Continue my draft')
    const plan = find('Create my LinkedIn plan')
    const bottom = Math.max(...[copy, draft, plan].map((button) => button.getBoundingClientRect().bottom))
    assert(question.getBoundingClientRect().top >= bottom, 'question must follow all copy and activation controls')
    const rect = (element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
    }
    const hit = (element) => {
        const r = element.getBoundingClientRect()
        const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        return target === element || element.contains(target)
    }
    const results = []
    // A low copy position, while leaving clearance for the unchanged cookie banner/toasts.
    window.scrollBy({ top: copy.getBoundingClientRect().top - innerHeight * 0.62, behavior: 'instant' })
    assert(hit(copy), 'low-viewport Copy Text must not be intercepted')
    results.push({ control: 'Copy Text (low viewport)', rect: rect(copy), hit: true })
    const dismiss = question.querySelector('[aria-label="Dismiss visitor question"]')
    for (const element of [copy, draft, plan, dismiss, ...question.querySelectorAll('button:not([aria-label])')]) {
        assert(element, 'control must exist')
        element.scrollIntoView({ block: 'center', behavior: 'instant' })

        assert(hit(element), `${element.innerText || element.getAttribute('aria-label')} must remain reachable`)
        results.push({
            control: element.innerText || element.getAttribute('aria-label'),
            rect: rect(element),
            hit: true,
        })
    }
    for (const element of [...document.querySelectorAll('button')].filter((b) =>
        ['Accept', 'Decline'].includes(b.innerText.trim()),
    )) {
        assert(hit(element), 'cookie consent controls must remain reachable')
        results.push({ control: element.innerText, rect: rect(element), hit: true })
    }
    return { path: location.pathname, width: innerWidth, height: innerHeight, results }
})()
