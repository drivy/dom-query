export interface EnhancedHTMLElement {
  isEnhancedHTMLElement: true
  on: <K extends keyof WindowEventMap>(
    this: HTMLElement & EnhancedHTMLElement,
    type: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => () => void
  onDelegate: <K extends keyof WindowEventMap>(
    this: HTMLElement & EnhancedHTMLElement,
    childSelector: string,
    type: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => () => void
  query: typeof query
  queryStrict: typeof queryStrict
  queryAll: typeof queryAll
}

const overrideEventCurrentTarget = (event: Event, target: Element) => {
  Object.defineProperty(event, "currentTarget", {
    configurable: true,
    enumerable: true,
    get: () => target,
  })
}

const enhancedHTMLElementImpl: EnhancedHTMLElement = {
  isEnhancedHTMLElement: true,
  on(type, callback, options) {
    const attachedCallback = (e: Event) => {
      // wrapped in a function to mimic the once configuration of the native option, which is not well supported (IE 11)
      callback.call(e.target, e as WindowEventMap[typeof type])
      if (options && options.once) {
        this.removeEventListener(type, attachedCallback)
      }
    }

    const removeListener = () => {
      this.removeEventListener(type, attachedCallback)
    }

    this.addEventListener(type, attachedCallback)
    return removeListener
  },
  onDelegate(childSelector, type, callback, options) {
    const containerListenerCallback = (e: Event) => {
      if (!(e.target instanceof Element)) return

      const target = e.target.closest(childSelector)

      if (!this.contains(target)) return

      if (target) {
        overrideEventCurrentTarget(e, target)
        callback.call(target, e as WindowEventMap[typeof type])
      }
    }

    const removeListener = () => {
      this.removeEventListener(type, containerListenerCallback)
    }

    this.addEventListener(type, containerListenerCallback, options)

    return removeListener
  },
  query,
  queryStrict,
  queryAll,
}

export interface EnhancedHTMLElementList {
  isEnhancedHTMLElementList: true
  on: <K extends keyof WindowEventMap>(
    this: (HTMLElement & EnhancedHTMLElement)[] & EnhancedHTMLElementList,
    type: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => () => void
  onDelegate: <K extends keyof WindowEventMap>(
    this: (HTMLElement & EnhancedHTMLElement)[] & EnhancedHTMLElementList,
    childSelector: string,
    type: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => () => void
}

const enhancedHTMLElementListImpl: EnhancedHTMLElementList = {
  isEnhancedHTMLElementList: true,
  on(type, callback, options) {
    const removers: (() => void)[] = []
    const removeListeners = () => {
      removers.forEach((remover) => remover())
    }

    this.forEach((enhancedHTMLElement) => {
      const remover = enhancedHTMLElement.on(type, callback, options)
      removers.push(remover)
    })
    return removeListeners
  },
  onDelegate(childSelector, type, callback, options) {
    const removers: (() => void)[] = []
    const removeListeners = () => {
      removers.forEach((remover) => remover())
    }

    this.forEach((enhancedHTMLElement) => {
      const remover = enhancedHTMLElement.onDelegate(
        childSelector,
        type,
        callback,
        options
      )
      removers.push(remover)
    })

    return removeListeners
  },
}

export const toEnhancedHTMLElement = <T extends HTMLElement = HTMLElement>(
  node: T
): T & EnhancedHTMLElement => {
  return Object.assign(node, enhancedHTMLElementImpl)
}

export function query<T extends HTMLElement = HTMLElement>(
  this: HTMLElement | void,
  selector: string
): (T & EnhancedHTMLElement) | null {
  const context = this instanceof HTMLElement ? this : document
  const element = context.querySelector<T>(selector)
  return element ? toEnhancedHTMLElement<T>(element) : null
}

export function queryStrict<T extends HTMLElement = HTMLElement>(
  this: (HTMLElement & EnhancedHTMLElement) | void,
  selector: string
): T & EnhancedHTMLElement {
  const element =
    this instanceof HTMLElement ? this.query<T>(selector) : query<T>(selector)
  if (!element) throw new Error(`Unexisting HTML element: ${selector}`)
  return element
}

export const toEnhancedHTMLElementList = <T extends HTMLElement = HTMLElement>(
  elements: T[]
): (T & EnhancedHTMLElement)[] & EnhancedHTMLElementList => {
  const enhancedElements = elements.map((node) =>
    toEnhancedHTMLElement<T>(node)
  )

  return Object.assign(enhancedElements, enhancedHTMLElementListImpl)
}

export function queryAll<T extends HTMLElement = HTMLElement>(
  this: HTMLElement | void,
  selector: string
): (T & EnhancedHTMLElement)[] & EnhancedHTMLElementList {
  const context = this instanceof HTMLElement ? this : document
  const elements: T[] = Array.from(context.querySelectorAll(selector))

  return toEnhancedHTMLElementList<T>(elements)
}
