const Ploiu = {
	/** list of failed test names */
	failedTests: [],
	/** prints a green "ok" to the console */
	ok() {
		console.log("%cok", "color: springgreen");
	},
	/** prints a red "FAIL" to the console, also throws an eception to be caught by the test runner*/
	fail(message = "", throwException = true) {
		console.log("%cFAIL", "color: crimson");
		if (throwException) {
			throw new Error(message);
		}
	},
	////// assertion methods
	assert(expression, message = "") {
		if (!expression) {
			if (message && message !== "") {
				console.error(message);
			}
			this.fail(message);
		}
	},
	assertFalse(expression, message = "") {
		if (expression) {
			if (message && message !== "") {
				console.error(message);
			}
			this.fail(message);
		}
	},
	assertEquals(expected, actual, message = "") {
		if (expected !== actual) {
			if (message && message !== "") {
				console.error(message);
			}
			this.fail(message);
		}
	},
	assertNotEquals(notExpected, actual, message = "") {
		if(notExpected === actual) {
			if(message && message !== "") {
				console.error(message)
			}
			this.fail(message)
		}	
	},
	assertNull(value, message = "") {
		this.assert(value === null || value === undefined, message);
	},
	assertNotNull(value, message = "") {
		this.assertFalse(value === null || value === undefined, message);
	},
	////// test methods

	/**Runs the passed test, marking it as passed or failed depending on the result*/
	test(title = "", test = () => {
	}) {
		// first log the title, then run the test. If no exceptions are thrown, we can pass the test
		console.log(title);
		try {
			test();
			this.ok();
		} catch (e) {
			this.failedTests.push(title);
			if (typeof e === "string") {
				this.fail(e, false);
			}
		}
	},
	// this should be called if the test is an async function
	async testAsync(title = "", test = async () => {
	}) {
		// first log the title, then run the test. If no exceptions are thrown, we can pass the test
		console.log(title);
		try {
			await test();
			this.ok();
		} catch (e) {
			this.failedTests.push(title);
			if (typeof e === "string") {
				this.fail(e, false);
			}
		}
	},
	////// util methods

	/**
	 * Types the passed text into the passed element
	 * @param {string} text the text to type
	 * @param {HTMLElement} inputElement the input element to fill with the text
	 * @param {Number} keyIntervalMS the interval in milliseconds between each keystroke
	 * @return {Promise<void>}
	 */
	async type(text, inputElement, keyIntervalMS = 10) {
		return new Promise((resolve) => {
			const splitText = text.split("");
			// list of promises to wait for
			const promises = [];
			for (let i = 0; i < splitText.length; i++) {
				promises.push(
					new Promise((resolve) => {
						window.setTimeout(() => {
							const event = new Event("input", {
								bubbles: true,
								cancelable: true,
							});
							inputElement.value += splitText[i];
							inputElement.dispatchEvent(event);
							resolve();
						}, keyIntervalMS * i);
					}),
				);
			}
			Promise.allSettled(promises).then(() => resolve());
		});
	},
	/**
	 * selects an option in the passed `selectElement`
	 * @param {number} index
	 * @param {HTMLSelectElement} selectElement
	 */
	select(index, selectElement) {
		selectElement.selectedIndex = index;
		selectElement.dispatchEvent(new Event("change", {}));
	},
	/**
	 * clicks the passed element and waits the passed duration before resolving
	 * @param element
	 * @param waitDurationMS
	 * @return {Promise<void>}
	 */
	async clickAndWait(element, waitDurationMS = 250) {
		return new Promise((resolve) => {
			element.click();
			window.setTimeout(resolve, waitDurationMS);
		});
	},
	/** used to run a function that requires some sort of delay before it. Use this instead of `window.setTimeout`*/
	async delay(fn, delayTime = 250) {
		return new Promise((resolve, reject) => {
			window.setTimeout(() => {
				try {
					fn();
					resolve();
				} catch (e) {
					reject(e);
				}
			}, delayTime);
		});
	},
};
