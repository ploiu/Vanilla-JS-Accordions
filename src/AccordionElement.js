if (!customElements.get('accordion-element')) {
// used to keep track of default IDs
	let idCounter = 0;
	/**
	 * keeps track of the accordions that have been loaded so far
	 * @type {AccordionElement[]}
	 */
	window.accordions = [];

	/**
	 * The class for an accordion element. Below is a list of data-* attributes that you can apply to the accordion's html and what they do:
	 * - `data-title`: sets the title text of the accordion. This displays in a colored bar regardless if the accordion is closed or not.
	 * - `data-group`: sets the accordion's group. When an accordion is opened, all other accordions in the same group get closed.
	 * - `data-id`: sets the internal id of the accordion. Useful if you want to set a custom ID to use when retrieving the accordion later. Defaults to a counter variable.
	 * - `data-open`: sets the accordion to be open after it's added to the dom.
	 */
	class AccordionElement extends HTMLElement {
		#title
		#id
		#isOpen
		#group
		#titleElement
		#bodyElement
		#parentAccordion
		#initialParentAccordionHeight
		constructor({title, id, isOpen, group} = {}) {
			super();
			// TODO make these variables private once all major browsers support private variables
			this.#title = title ?? this.dataset.title ?? '';
			this.#id = id ?? this.dataset.id ?? idCounter++;
			this.#isOpen = isOpen ?? this.dataset.isOpen ?? false;
			this.#group = group ?? this.dataset.group ?? '';
			this.#titleElement = this._createTitleElement();
			this.#bodyElement = this._createBodyElement();

			// add the accordion to the list
			window.accordions.push(this);
			
			this.#parentAccordion = null;
		}

		// ==============================================================================
		// TODO make this method private once firefox supports private fields and methods
		// ==============================================================================
		_createTitleElement() {
			const element = document.createElement('div');
			element.classList.add('ploiu-accordion-title');
			element.innerText = this.#title;
			element.addEventListener('click', () => this.toggle());
			return element;
		}

		_createBodyElement() {
			const element = document.createElement('div');
			element.classList.add('ploiu-accordion-body');
			// add all the child nodes from this element to the body element
			while (this.childElementCount > 0) {
				// always get the 0th index since we'll be removing the node later
				const node = this.children[0];
				element.appendChild(node.cloneNode(true));
				node.remove();
			}
			return element;
		}

		/**
		 * the internal, read only id of this accordion element
		 * @returns {number}
		 */
		get id() {
			return this.#id;
		}

		get group() {
			return this.#group;
		}

		set group(value) {
			this.#group = value;
			this.dataset.group = value;
		}

		get title() {
			return this.#title;
		}

		set title(value) {
			this.#title = value;
			this.#titleElement.innerText = value;
		}

		get isOpen() {
			return this.#isOpen;
		}

		/**
		 * make this private once private fields and methods are a thing
		 * @returns {HTMLDivElement} the div element that acts as the wrapper for the accordion's body
		 *
		 * @private
		 */
		get bodyElement() {
			return this.#bodyElement;
		}

		/**
		 * Sets the contents of this accordion's body element.
		 * @param {HTMLElement} value
		 */
		set body(value) {
			// first remove all the contents from our accordion body
			Array.from(this.#bodyElement.children).forEach(el => el?.remove());
			// now add the contents of the value to the body element
			this.#bodyElement.appendChild(value);
		}

		/**
		 * Opens the accordion and displays the contents inside of it
		 */
		expand() {
			// hide all other open accordions in the same group
			AccordionElement.findAccordionsByGroup(this.#group).filter(accordion => accordion !== this && accordion !== this.#parentAccordion).forEach(accordion => accordion.collapse());
			this.#isOpen = true;
			// set the height of the body to be the scroll height of the body and all other accordion bodies underneath
			this.#bodyElement.style.height = `${this.#bodyElement.scrollHeight}px`;
			// if the parent element is an accordion, increase the height of it to accommodate
			if (this.#parentAccordion?.isOpen) {
				// add the height of our accordion minus the height of our title element. 
				this.#parentAccordion.bodyElement.style.height =
					Number.parseFloat(this.#parentAccordion.bodyElement.style.height.replace(/px/, '')) // we manually set the pixel height of the element, so this is ok to do
					+ this.bodyElement.scrollHeight + 'px';
			}
			this.classList.add('open');
		}

		/**
		 * Closes the accordion and hides the contents inside of it
		 */
		collapse() {
			if (this.#isOpen) {
				this.#isOpen = false;
				// if our parent is an accordion element, reduce the size back to the initial height
				if (this.#parentAccordion) {
					this.#parentAccordion.bodyElement.style.height = this.#parentAccordion.bodyElement.clientHeight - this.bodyElement.scrollHeight + 'px';
				}
				this.#bodyElement.style.height = '0';
				this.classList.remove('open');
				// close all child accordions
				Array.from(this.querySelectorAll('accordion-element')).forEach(accordion => accordion.collapse());
			}
		}

		/**
		 * Toggles the open/closed state of the accordion
		 */
		toggle() {
			if (this.#isOpen) {
				this.collapse();
			} else {
				this.expand();
			}
		}

		/**
		 * gets the first parent element whose tag matches 'ACCORDION-ELEMENT' and returns it
		 * @returns {AccordionElement|null} the first accordion parent element if their is one, else null
		 * @private
		 */
		_getParentAccordion() {
			let parents = [];
			let currentNode = this;
			while (currentNode?.parentNode) {
				parents.push(currentNode.parentNode);
				currentNode = currentNode.parentNode;
			}
			parents = parents.filter(el => el?.tagName === 'ACCORDION-ELEMENT');
			return parents.length > 0 ? parents[0] : null;
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
			if (this.isConnected) {
				// append children here and set up other dom-based attributes
				this.appendChild(this.#titleElement);
				this.appendChild(this.#bodyElement);
				// if the data-open attribute is set, expand this accordion
				if (this.dataset.open !== undefined || this.#isOpen) {
					this.expand();
				}
				this.#parentAccordion = this._getParentAccordion();
				if (this.#parentAccordion !== null) {
					this.#initialParentAccordionHeight = this.#parentAccordion.scrollHeight;
				} else {
					this.#initialParentAccordionHeight = 0; // reset this
				}
			}
		}

		/**
		 * finds the registered accordion with the passed `id`, or `null` if none could be found. If there are multiple accordions with the same id,
		 * the first one created on the page will be returned.
		 * @param id {number}
		 * @returns {null|AccordionElement}
		 */
		static findAccordionById(id) {
			try {
				return window.accordions.filter(accordion => accordion.id === id)[0];
			} catch (exception) {
				return null;
			}
		}

		/**
		 * Finds all accordions with the passed group, case insensitive, and returns them.
		 * @param {string} group
		 * @returns {AccordionElement[]}
		 */
		static findAccordionsByGroup(group) {
			return window.accordions.filter(accordion => accordion.group.toLowerCase() === group.toLowerCase());
		}

	}

	/**
	 * creates a "fan" of accordions. All child accordions are grouped together so that when one closes, the others do too.
	 * This is more of a stylistic element than anything, as it visually groups accordions close together as if they're a
	 * part of a single element
	 */
	class AccordionFan extends HTMLElement {
		constructor() {
			super();
			// for each of our child accordion elements, set its group to be this object
			Array.from(this.querySelectorAll('accordion-element')).forEach(el => el.group = `fan-${idCounter}`);
			idCounter++;
		}
	}

	customElements.define('accordion-element', AccordionElement);
	customElements.define('accordion-fan', AccordionFan);
	// make this class accessible to external scripts
	window.AccordionElement = AccordionElement;
}
