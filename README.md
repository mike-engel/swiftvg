# swiftvg

> Convert SVG path data to a Swift 3 UIBezierPath

[![Build Status](https://travis-ci.org/mike-engel/swiftvg.svg?branch=master)](https://travis-ci.org/mike-engel/swiftvg)
[![npm](https://img.shields.io/npm/l/swiftvg.svg)](https://npmjs.com/package/swiftvg)
[![codecov](https://codecov.io/gh/mike-engel/swiftvg/branch/master/graph/badge.svg)](https://codecov.io/gh/mike-engel/swiftvg)

# Why?

As an iOS developer, you have to support at least three different pixel densities. Why waste your time managing a million image assets for different resolutions and states?

`swiftvg` is a small little tool written in javascript to help you convert your vector SVG images into `UIBezierPath` shapes. It provides both CLI and JS apis, so you can use it however you'd like.

# Installing

There are two ways to use `swiftvg`: through the CLI or through your code.

## CLI

To install the tool, use npm (or another npm package manager like yarn). It's
recommended that you install it globally, have `node_modules/.bin` in your
path, or use it with an npm `run-script`.

```sh
npm install -g swiftvg
```

## JS API

To add `swiftvg` to your project, install it to your dependencies.

```sh
npm install -S swiftvg
```

# Usage

## CLI

After it's installed and avilable somewhere in your path, run the command with
your svg data string.

Unless something went wrong, the command should exit with a 0 status and print
the swift code line by line to your terminal's STDOUT.

```sh
swiftvg "M37,17 L37,25 Z"

# output
let shape = UIBezierPath()
shape.move(to: CGPoint(x: 37, y: 17))
shape.addLine(to: CGPoint(x: 37, y: 25))
shape.close()
```

## JS API

After it's installed, `require` or `import` it into your code and run the
exported function.

You can expect the function to return an array, where each element is a line
of swift code. You can `console.log(join(output, '\n'))` or anything else you
can imagine.

```js
// CommonJS
const swiftvg = require("swiftvg");

// ES2015
import swiftvg from "swiftvg";

const pathData = "M37,17 L37,25 Z";

swiftvg(pathData); // Array<String>
```

# Contributing

As the project is pretty small, you only need to run `npm install` to get up and
running. From there, [standard](https://github.com/feross/standard) is used for
code style.

This is a functional project, so please try to keep it that way—avoid side
affects, mutations, and imperative code when you can.

There are four testing commands:

```
npm run build:browser – build a UMD file for a browser to consume
npm run build:site – build the JS bundle for the public site
npm run test – run all tests
npm run test:coverage - get a coverage report
npm run test:lint – lint the project using standard
npm run test:unit – run only unit tests with no coverage or linting
```

# [Code of Conduct](#CODE_OF_CONDUCT.md)

# [License](LICENSE.md)
