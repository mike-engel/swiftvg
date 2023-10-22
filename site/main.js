const swiftvg = require("../index");

const inputEl = document.querySelector('[data-hook="input"]');
const outputEl = document.querySelector('[data-hook="output"]');

const updateOutput = evt => {
	const data = evt.target.value;

	if (data) {
		outputEl.value = swiftvg(evt.target.value).join("\n");
	} else {
		outputEl.value = "";
	}
};

inputEl.addEventListener("input", updateOutput);
