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
		constructor({title, id, isOpen, group} = {}) {
			super();
			// TODO make these variables private once all major browsers support private variables
			this._title = title ?? this.dataset.title ?? '';
			this._id = id ?? this.dataset.id ?? idCounter++;
			this._isOpen = isOpen ?? this.dataset.isOpen ?? false;
			this._group = group ?? this.dataset.group ?? '';
			this._titleElement = this._createTitleElement();
			this._bodyElement = this._createBodyElement();

			// add the accordion to the list
			window.accordions.push(this);
			
			this._parentAccordion = null;
		}

		// ==============================================================================
		// TODO make this method private once firefox supports private fields and methods
		// ==============================================================================
		_createTitleElement() {
			const element = document.createElement('div');
			element.classList.add('ploiu-accordion-title');
			element.innerText = this._title;
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
			return this._id;
		}

		get group() {
			return this._group;
		}

		set group(value) {
			this._group = value;
			this.dataset.group = value;
		}

		get title() {
			return this._title;
		}

		set title(value) {
			this._title = value;
			this._titleElement.innerText = value;
		}

		get isOpen() {
			return this._isOpen;
		}

		/**
		 * make this private once private fields and methods are a thing
		 * @returns {HTMLDivElement} the div element that acts as the wrapper for the accordion's body
		 *
		 * @private
		 */
		get bodyElement() {
			return this._bodyElement;
		}

		/**
		 * Sets the contents of this accordion's body element.
		 * @param {HTMLElement} value
		 */
		set body(value) {
			// first remove all the contents from our accordion body
			Array.from(this._bodyElement.children).forEach(el => el?.remove());
			// now add the contents of the value to the body element
			this._bodyElement.appendChild(value);
		}

		/**
		 * Opens the accordion and displays the contents inside of it
		 */
		expand() {
			// hide all other open accordions in the same group
			AccordionElement.findAccordionsByGroup(this._group).filter(accordion => accordion !== this && accordion !== this._parentAccordion).forEach(accordion => accordion.collapse());
			this._isOpen = true;
			// set the height of the body to be the scroll height of the body and all other accordion bodies underneath
			this._bodyElement.style.height = `${this._bodyElement.scrollHeight}px`;
			// if the parent element is an accordion, increase the height of it to accommodate
			if (this._parentAccordion?.isOpen) {
				// add the height of our accordion minus the height of our title element. 
				this._parentAccordion.bodyElement.style.height =
					Number.parseFloat(this._parentAccordion.bodyElement.style.height.replace(/px/, '')) // we manually set the pixel height of the element, so this is ok to do
					+ this.bodyElement.scrollHeight + 'px';
			}
			this.classList.add('open');
		}

		/**
		 * Closes the accordion and hides the contents inside of it
		 */
		collapse() {
			if (this._isOpen) {
				this._isOpen = false;
				// if our parent is an accordion element, reduce the size back to the initial height
				if (this._parentAccordion) {
					this._parentAccordion.bodyElement.style.height = this._parentAccordion.bodyElement.clientHeight - this.bodyElement.scrollHeight + 'px';
				}
				this._bodyElement.style.height = '0';
				this.classList.remove('open');
				// close all child accordions
				Array.from(this.querySelectorAll('accordion-element')).forEach(accordion => accordion.collapse());
			}
		}

		/**
		 * Toggles the open/closed state of the accordion
		 */
		toggle() {
			if (this._isOpen) {
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
				this.appendChild(this._titleElement);
				this.appendChild(this._bodyElement);
				// if the data-open attribute is set, expand this accordion
				if (this.dataset.open !== undefined || this._isOpen) {
					this.expand();
				}
				this._parentAccordion = this._getParentAccordion();
				if (this._parentAccordion !== null) {
					this._initialParentAccordionHeight = this._parentAccordion.scrollHeight;
				} else {
					this._initialParentAccordionHeight = 0; // reset this
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
