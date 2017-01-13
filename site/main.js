const svgToSwift = require('../index')

const inputEl = document.querySelector('[data-hook="input"]')
const outputEl = document.querySelector('[data-hook="output"]')

const updateOutput = (evt) => {
  outputEl.innerText = svgToSwift(evt.target.value).join('\n')
}

inputEl.addEventListener('input', updateOutput)
