# svg-to-swift

> A small tool to help you convert your SVG code into Swift code

# Installing

There are two ways to use `svg-to-swift`: through the CLI or through your code.

## CLI

To install the tool, use npm (or another npm package manager like yarn). It's
recommended that you install it globally, have `node_modules/.bin` in your
path, or will use it with an npm `run-script`.

```sh
npm install -g svg-to-swift
```

## JS API

To add `svg-to-swift` to your project, install it to your dependencies.

```sh
npm install -S svg-to-swift
```

# Usage

## CLI

After it's installed and avilable somewhere in your path, run the command with
your svg data string.

Unless something went wrong, the command should exit with a 0 status and print
the swift code line by line to your terminal's STDOUT.

```sh
svg-to-swift "M37,17 L37,17 Z"
```

## JS API

After it's installed, `require` or `import` it into your code and run the
exported function.

You can expect the function to return an array, where each element is a line
of swift code. You can `console.log(join(output, '\n'))` or anything else you
can imagine.

```js
// CommonJS
const svgToSwift = require('svg-to-swift')

// ES2015
import svgToSwift from 'svg-to-swift'

const pathData = 'M37,17 L37,17 Z'

svgToSwift(pathData) // Array<String>
```

# Contributing

As the project is pretty small, you only need to run `npm install` to get up and
running. From there, [standard](https://github.com/feross/standard) is used for
code style.

This is a functional project, so please try to keep it that way—avoid side
affects, mutations, and imperative code when you can.

There are four testing commands:

```
npm run test - run all tests
npm run test:coverage - get a coverage report
npm run test:lint - lint the project using standard
npm run test:unit - run only unit tests with no coverage or linting
```

# [Code of Conduct](#CODE_OF_CONDUCT.md)

# [License](LICENSE.md)
