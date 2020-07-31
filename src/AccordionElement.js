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
	constructor() {
		super();
		// TODO make these variables private once all major browsers support private variables
		this._title = this.dataset.title ?? '';
		this._id = this.dataset.id ?? idCounter++;
		this._isOpen = this.dataset.isOpen ?? false;
		this._group = this.dataset.group ?? '';
		this._titleElement = this._createTitleElement();
		this._bodyElement = this._createBodyElement();

		this.appendChild(this._titleElement);
		this.appendChild(this._bodyElement);

		// add the accordion to the list
		window.accordions.push(this);
		// if the data-open attribute is set, expand this accordion
		if (this.dataset.open !== undefined) {
			this.expand();
		}
	}

	// ==============================================================================
	// TODO make this method private once firefox supports private fields and methods
	// ==============================================================================
	_createTitleElement() {
		const element = document.createElement('div');
		element.classList.add('accordion-title');
		element.innerText = this._title;
		element.addEventListener('click', () => this.toggle());
		return element;
	}

	_createBodyElement() {
		const element = document.createElement('div');
		element.classList.add('accordion-body');
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

	/**
	 * Opens the accordion and displays the contents inside of it
	 */
	expand() {
		this._isOpen = true;
		// set the height of the body to be the scroll height
		this._bodyElement.style.height = `${this._bodyElement.scrollHeight}px`;
		this.classList.add('open');
		// hide all other open accordions in the same group
		AccordionElement.findAccordionsByGroup(this._group).filter(accordion => accordion !== this).forEach(accordion => accordion.collapse());
	}

	/**
	 * Closes the accordion and hides the contents inside of it
	 */
	collapse() {
		this._isOpen = false;
		this._bodyElement.style.height = '';
		this.classList.remove('open');
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

customElements.define('accordion-element', AccordionElement);

// make this class accessible to external scripts
window.AccordionElement = AccordionElement;