const swiftvg = require('../index')

const inputEl = document.querySelector('[data-hook="input"]')
const outputEl = document.querySelector('[data-hook="output"]')

const updateOutput = (evt) => {
  const data = evt.target.value

  if (data) {
    outputEl.innerText = swiftvg(evt.target.value).join('\n')
  } else {
    outputEl.innerText = ''
  }
}

inputEl.addEventListener('input', updateOutput)
