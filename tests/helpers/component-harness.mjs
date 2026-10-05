import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

export async function loadTS(path, mocks = {}, globals = {}) {
    const source = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText
    const loaded = { exports: {} }
    runInNewContext(compiled, {
        exports: loaded.exports,
        module: loaded,
        console,
        URL,
        URLSearchParams,
        Request,
        Response,
        setTimeout,
        clearTimeout,
        crypto,
        Event,
        ...globals,
        require(name) {
            assert.ok(name in mocks, `Missing mock: ${path} -> ${name}`)
            return mocks[name]
        },
    })
    return loaded.exports
}

export function storage() {
    const map = new Map()
    return {
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => map.set(key, value),
        removeItem: (key) => map.delete(key),
    }
}

export function browser(url) {
    let location = new URL(url)
    const events = new EventTarget()
    return {
        location: {
            get href() {
                return location.href
            },
            set href(href) {
                location = new URL(href, location)
            },
            get origin() {
                return location.origin
            },
            get pathname() {
                return location.pathname
            },
            get search() {
                return location.search
            },
            get hash() {
                return location.hash
            },
            get searchParams() {
                return location.searchParams
            },
        },
        history: {
            state: {},
            replaceState(_state, _title, href) {
                location = new URL(href, location)
            },
        },
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
        dispatchEvent: events.dispatchEvent.bind(events),
    }
}

export function hooks() {
    const cells = []
    const effects = []
    let cursor = 0
    const changed = (old, next) => !old || !next || next.some((v, i) => !Object.is(v, old[i]))
    const react = {
        useState(initial) {
            const i = cursor++
            cells[i] ??= { value: typeof initial === 'function' ? initial() : initial }
            return [
                cells[i].value,
                (next) => {
                    cells[i].value = typeof next === 'function' ? next(cells[i].value) : next
                },
            ]
        },
        useRef(initial) {
            const i = cursor++
            cells[i] ??= { current: initial }
            return cells[i]
        },
        useEffect(fn, deps) {
            const i = cursor++
            if (changed(cells[i]?.deps, deps)) {
                effects.push(() => {
                    cells[i]?.cleanup?.()
                    cells[i] = { deps, cleanup: fn() }
                })
            }
        },
        useCallback(fn, deps) {
            const i = cursor++
            if (changed(cells[i]?.deps, deps)) cells[i] = { deps, value: fn }
            return cells[i].value
        },
        useMemo(fn, deps) {
            return react.useCallback(fn, deps)()
        },
    }
    return {
        react,
        jsx: { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
        render(fn) {
            cursor = 0
            const value = fn()
            effects.splice(0).forEach((effect) => effect())
            return value
        },
        unmount() {
            cells.forEach((cell) => cell?.cleanup?.())
        },
    }
}

export const tick = () => new Promise((resolve) => setImmediate(resolve))
