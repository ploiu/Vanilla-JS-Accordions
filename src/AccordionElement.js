/*MIT License

Copyright (c) 2024 ploiu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
if (!customElements.get('accordion-element')) {
  // used to keep track of default IDs
  let idCounter = 0
  /**
   * keeps track of the accordions that have been loaded so far
   * @type {AccordionElement[]}
   */
  globalThis.accordions = []

  /**
   * The class for an accordion element. Below is a list of data-* attributes that you can apply to the accordion's html and what they do:
   * - `data-title`: sets the title text of the accordion. This displays in a colored bar regardless if the accordion is closed or not.
   * - `data-group`: sets the accordion's group. When an accordion is opened, all other accordions in the same group get closed.
   * - `data-id`: sets the internal id of the accordion. Useful if you want to set a custom ID to use when retrieving the accordion later. Defaults to a counter variable.
   * - `data-open`: sets the accordion to be open after it's added to the dom.
   */
  class AccordionElement extends HTMLElement {
    #title
    #accordionId
    #isOpen
    #group
    #titleElement
    #bodyElement
    #parentAccordion
    /** need this because some frameworks cause connectedCallback to be called multiple times */
    #finishedConnecting
    #initialParentAccordionHeight
    /** @type {MutationObserver} mutation observer used to detect when children are added, so this can resize itself as needed */
    #observer

    constructor({ title, id, isOpen, group } = {}) {
      super()
      this.#title = title ?? this.dataset.title ?? ''
      this.#accordionId = id ?? this.dataset.id ?? idCounter++
      this.#isOpen = isOpen ?? this.dataset.isOpen ?? false
      this.#group = group ?? this.dataset.group ?? ''

      // add the accordion to the list
      globalThis.accordions.push(this)

      this.#parentAccordion = null
    }

    #createTitleElement() {
      // if we already have a div with the class ploiu-accordion-title, skip all this and just return the element. This allows the developer to set their own custom html titles
      const existingTitle = this.querySelector('div.ploiu-accordion-title')
      if (existingTitle) {
        existingTitle.addEventListener('click', () => this.toggle())
        return existingTitle
      } else {
        const element = document.createElement('div')
        element.classList.add('ploiu-accordion-title')
        element.innerText = this.#title
        element.addEventListener('click', () => this.toggle())
        return element
      }
    }

    #createBodyElement() {
      // if the developer already specified an accordion body, just return that instead of creating it all ourselves
      const existingBody = this.querySelector('div.ploiu-accordion-body')
      if (existingBody) {
        return existingBody
      } else {
        const element = document.createElement('div')
        element.classList.add('ploiu-accordion-body')
        // add all the child nodes from this element to the body element
        const trueChildren = [...this.childNodes].filter((it) => !it.classList?.contains('ploiu-accordion-title'))
        for (const child of trueChildren) {
          // always get the 0th index since we'll be removing the node later
          const node = child
          element.appendChild(node.cloneNode(true))
          node.remove()
        }
        return element
      }
    }

    /**
     * gets the first parent element whose tag matches 'ACCORDION-ELEMENT' and returns it
     * @returns {AccordionElement|null} the first accordion parent element if their is one, else null
     * @private
     */
    #getParentAccordion() {
      const parents = []
      let currentNode = this.parentNode
      while (currentNode?.parentNode) {
        parents.push(currentNode.parentNode)
        currentNode = currentNode.parentNode
      }
      return parents.find((el) => el?.tagName === 'ACCORDION-ELEMENT') || null
    }

    /**
     * retrieves the entire chain of parent accordions for this accordion
     *
     * @return {AccordionElement[]} the list of accordions that are the parents, grandparents, etc. of this accordion
     */
    #getParentAccordionChain() {
      const parents = []
      let currentAccordion = this.#parentAccordion
      while (currentAccordion) {
        parents.push(currentAccordion)
        currentAccordion = currentAccordion.#getParentAccordion()
      }
      return parents
    }

    /**
     * resizes this accordion to fit the content of the child elements
     */
    #expandParent(amount) {
      if (this.#parentAccordion?.isOpen) {
        // add the height of our accordion minus the height of our title element.
        const currentParentHeight = Number.parseFloat(
          this.#parentAccordion.bodyElement.style.height.replace('px', ''),
        )
        const newParentHeight = currentParentHeight + amount
        this.#parentAccordion.bodyElement.style.height = newParentHeight + 'px'
        // now resize all parents, grandparents, etc
        this.#parentAccordion.#expandParent(amount)
      }
    }

    #collapseParent(amount) {
      if (this.#parentAccordion?.isOpen) {
        const currentParentHeight = Number.parseFloat(
          this.#parentAccordion.bodyElement.style.height.replace('px', ''),
        )
        const newParentHeight = currentParentHeight - amount
        this.#parentAccordion.bodyElement.style.height = newParentHeight + 'px'
        // propagate the shrinkage across all parents
        this.#parentAccordion.#collapseParent(amount)
      }
    }

    /**
     * the internal, read only id of this accordion element
     * @returns {number}
     */
    get accordionId() {
      return this.#accordionId
    }

    get group() {
      return this.#group
    }

    set group(value) {
      this.#group = value
      this.dataset.group = value
    }

    get title() {
      return this.#title
    }

    /**
     * sets the contents of our title
     * @param {string|Node} value
     */
    set title(value) {
      if (typeof value === 'string') {
        this.#title = value
        if (this.isConnected) {
          this.#titleElement.innerText = value
        }
      } else if (value instanceof Node) {
        if (!this.isConnected) {
          throw "Can't set an accordion element title to a node when it hasn't been appended to the document!"
        }
        this.#title = ''
        this.#titleElement.innerText = '' // first clear the titleElement's children
        ;[...this.#titleElement.children].forEach((it) => it.remove())
        // now append our value to the title element
        this.#titleElement.appendChild(value)
      }
    }

    get isOpen() {
      return this.#isOpen
    }

    /**
     * make this private once private fields and methods are a thing
     * @returns {HTMLDivElement} the div element that acts as the wrapper for the accordion's body
     *
     * @private
     */
    get bodyElement() {
      return this.#bodyElement
    }

    /**
     * Sets the contents of this accordion's body element.
     * @param {HTMLElement} value
     */
    set body(value) {
      if (!this.isConnected) {
        throw "Can't set an accordion element body when it hasn't been appended to the document!"
      }
      // first remove all the contents from our accordion body
      Array.from(this.#bodyElement.children).forEach((el) => el?.remove())
      // now add the contents of the value to the body element
      this.#bodyElement.appendChild(value)
    }

    /**
     * Opens the accordion and displays the contents inside of it
     */
    expand() {
      // hide all other open accordions in the same group
      const parentAccordions = this.#getParentAccordionChain()
      AccordionElement.findAccordionsByGroup(this.#group).filter((accordion) =>
        accordion !== this && !parentAccordions.includes(accordion) &&
        this.#parentAccordion === accordion.#parentAccordion
      ).forEach((accordion) => accordion.collapse())
      this.#isOpen = true
      // set the height of the body to be the scroll height of the body and all other accordion bodies underneath
      this.#bodyElement.style.height = `${this.#bodyElement.scrollHeight}px`
      // change the height of all parent accordions to accommodate our added body height
      this.#expandParent(this.#bodyElement.scrollHeight)
      this.classList.add('open')
    }

    /**
     * Closes the accordion and hides the contents inside of it
     */
    collapse() {
      if (this.#isOpen) {
        this.#isOpen = false
        // if our parent is an accordion element, reduce the size back to the initial height
        if (this.#parentAccordion) {
          this.#collapseParent(this.bodyElement.scrollHeight)
        }
        this.#bodyElement.style.height = '0'
        this.classList.remove('open')
        // close all child accordions
        Array.from(this.querySelectorAll('accordion-element')).forEach((accordion) => accordion.collapse())
      }
    }

    /**
     * Toggles the open/closed state of the accordion
     */
    toggle() {
      if (this.#isOpen) {
        this.collapse()
      } else {
        this.expand()
      }
    }

    /**
     * called when this node is connected to the DOM.
     *
     * An editor may say it's unused, but it's called by the browser and should not be removed
     *
     * @override
     */
    connectedCallback() {
      // make sure we're actually connected before we do anything
      if (!this.#finishedConnecting && this.isConnected) {
        this.#titleElement = this.#createTitleElement()
        this.#bodyElement = this.#createBodyElement()
        // append children here and set up other dom-based attributes
        this.appendChild(this.#titleElement)
        this.appendChild(this.#bodyElement)
        // if the data-open attribute is set, expand this accordion
        if (this.dataset.open !== undefined || this.#isOpen) {
          this.expand()
        }
        this.#parentAccordion = this.#getParentAccordion()
        if (this.#parentAccordion !== null) {
          this.#initialParentAccordionHeight = this.#parentAccordion.scrollHeight
        } else {
          this.#initialParentAccordionHeight = 0 // reset this
        }
        this.#setupObserver()
        this.#finishedConnecting = true
      }
    }

    /**
     * called when this node is removed from the DOM.
     *
     * An editor may say it's unused, but it's called by the browser and should not be removed
     *
     * @override
     */
    disconnectedCallback() {
      if (this.#observer) {
        this.#observer.disconnect()
      }
    }

    #setupObserver() {
      this.#observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && this.#isOpen) {
            this.#onChildrenChanged()
          }
        }
      })
      this.#observer.observe(this, { childList: true, subtree: true })
    }

    #onChildrenChanged() {
      // scrollHeight is messed up by css transitions, so we need to disable that if we have a parent accordion
      if (this.#parentAccordion) {
        this.#bodyElement.style.transition = 'none'
      }
      // set to auto here because we manually set style height, which impacts scroll height. Without this, removing elements will not resize
      this.#bodyElement.style.height = 'auto'
      const newHeight = this.#bodyElement.scrollHeight + 'px'
      this.#bodyElement.style.transition = 'var(--accordion-expand-rate)'
      requestAnimationFrame(() => {
        this.#bodyElement.style.height = newHeight
      })
    }

    /**
     * finds the registered accordion with the passed `id`, or `null` if none could be found. If there are multiple accordions with the same id,
     * the first one created on the page will be returned.
     * @param id {number}
     * @returns {null|AccordionElement}
     */
    static findAccordionById(id) {
      try {
        return globalThis.accordions.filter((accordion) => accordion.id === id)[0]
      } catch {
        return null
      }
    }

    /**
     * Finds all accordions with the passed group, case insensitive, and returns them.
     * @param {string} group
     * @returns {AccordionElement[]}
     */
    static findAccordionsByGroup(group) {
      return [...document.querySelectorAll('accordion-element')].filter((accordion) => {
        // for some reason, class getters are not called for custom elements that aren't fully constructed yet. Not sure why, but
        // when that happens, `accordion.group` will be undefined even if the private properties have values. Once again, the getter never gets called
        // happens in chromium and non chromium browsers
        return accordion.group?.toLowerCase() === group.toLowerCase()
      })
    }
  }

  /**
   * creates a "fan" of accordions. All child accordions are grouped together so that when one closes, the others do too.
   * This is more of a stylistic element than anything, as it visually groups accordions close together as if they're a
   * part of a single element
   */
  class AccordionFan extends HTMLElement {
    connectedCallback() {
      if (this.isConnected) {
        // for each of our child accordion elements, set its group to be this object
        Array.from(this.querySelectorAll('accordion-element')).forEach((el) => el.group = `fan-${idCounter}`)
        idCounter++
      }
    }
  }

  customElements.define('accordion-element', AccordionElement)
  customElements.define('accordion-fan', AccordionFan)
  // make this class accessible to external scripts
  globalThis.AccordionElement = AccordionElement
}
