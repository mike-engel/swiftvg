const curry = require('ramda/src/curry')
const defaultTo = require('ramda/src/defaultTo')
const drop = require('ramda/src/drop')
const equals = require('ramda/src/equals')
const head = require('ramnda/src/head')
const join = require('ramda/src/join')
const nth = require('ramda/src/nth')
const parse = require('parse-svg-path')
const pipe = require('ramda/src/pipe')
const replace = require('ramda/src/replace')
const slice = require('ramda/src/slice')
const test = require('ramda/src/test')
const toString = require('ramda/src/toString')

// SET_RELATIVE :: String
const SET_RELATIVE = 'SET_RELATIVE'

// SET_ABSOLUTE :: String
const SET_ABSOLUTE = 'SET_ABSOLUTE'

// type alias State = { x: String, y: String }
// initialState :: State
const initialState = { x: '0', y: '0' }

// state :: State
let state = Object.assign({}, initialState)

// reducer :: Object -> String -> Object -> Object
const reducer = curry((a, b, c) => {
  switch (b) {
    case SET_RELATIVE:
      return Object.assign({}, a, {
        x: a.x + parseFloat(c.x),
        y: a.y + parseFloat(c.y)
      })
    case SET_ABSOLUTE:
      return Object.assign({}, a, {
        x: parseFloat(c.x),
        y: parseFloat(c.y)
      })
    default:
      return a
  }
})

// dispatch :: String -> Object -> State
const dispatch = curry((a, b) => {
  state = reducer(state, a, b)

  return state
})

// round :: Number -> Number
const round = (a) => {
  return Math.round(a)
}

// powerString :: Regex$Match -> Any -> String
const powerString = curry((a, b) => {
  return `e-${parseInt(b, 10) + 2}`
})

// bigRound :: Number -> Number
const bigRound = (a) => {
  if (pipe(toString, test(/e\-/))(a)) {
    const addedString = pipe(toString, replace(/e-(\d)+/, powerString))(a)

    return pipe(round, parseInt)(`${addedString}e-2`)
  }

  return pipe(round, parseInt)(`${a + 'e+2'}e-2`)
}

// cgPoint :: Object -> String
const cgPoint = (a) => {
  return `CGPoint(x: ${bigRound(a.x)}, y: ${bigRound(a.y)})`
}

// beginShape :: Nothing -> String
const beginShape = () => 'let shape = UIBezierPath()'

// endShape :: String
const endShape = 'shape.close()'

// convertXY :: Array -> Object
const convertXY = (a) => {
  const x = nth(0, a)
  const y = nth(1, a)

  return { x: defaultTo(0, x), y: defaultTo(0, y) }
}

// convertMove :: String -> String
const convertMove = (a) => {
  return `shape.move(to: ${a})`
}

// convertLine :: String -> String
const convertLine = (a) => {
  return `shape.addLine(to: ${a})`
}

// convertRelativeLine :: String -> String
const convertRelativeLine = (a) => {
  return `shape.addLine(to: ${a})`
}

// convertVertical :: Array -> String
// convertRelativeVertical :: Array -> String
// convertHorizontal :: Array -> String
// convertRelativeHorizontal :: Array -> String

// convertCubicCurve :: Array -> String
const convertCubicCurve = (a) => {
  const anchorPoint = pipe(slice(4, 5), convertXY, cgPoint)(a)
  const controlPointOne = pipe(slice(0, 1), convertXY, cgPoint)(a)
  const controlPointTwo = pipe(slice(2, 3), convertXY, cgPoint)(a)

  return `shape.addCurve(to: ${anchorPoint}, controlPoint1: ${controlPointOne}, controlPoint2: ${controlPointTwo})`
}

// convertRelativeCubicCurve :: Array -> String

// convertQuadraticCurve :: Array -> String
const convertQuadraticCurve = (a) => {
  const anchorPoint = pipe(slice(2, 3), convertXY, cgPoint)(a)
  const controlPoint = pipe(slice(0, 1), convertXY, cgPoint)(a)

  return `shape.addCurve(to: ${anchorPoint}, controlPoint: ${controlPoint})`
}

// convertRelativeQuadriticCurve :: Array -> String

// convertArc :: Array -> String
const convertArc = (a) => {
  const center = pipe(slice(5, 6), convertXY, cgPoint)(a)
  const radius = pipe(slice(0, 1), convertXY, cgPoint)(a)
  const clockwise = pipe(nth(4), equals(1))(a)
  const startAngle = 0
  const endAngle = 360

  return `shape.addArc(withCenter: ${center}, radius: ${radius}, startAngle: ${startAngle}, endAngle: ${endAngle}, clockwise: ${clockwise})`
}

// processPathData :: Array -> String
const processPathData = (a) => {
  switch (head(a)) {
    case 'M':
      return pipe(drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertMove)(a)
    case 'l':
      return pipe(drop(1), convertXY, dispatch(SET_RELATIVE), cgPoint, convertRelativeLine)(a)
    case 'L':
      return pipe(drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'C':
      return pipe(drop(1), convertCubicCurve)(a)
    case 'Q':
      return pipe(drop(1), convertQuadraticCurve)(a)
    case 'A':
      return pipe(drop(1), convertArc)(a)
    case 'Z':
      return endShape
    case 'v':
    case 'V':
    case 'h':
    case 'H':
    case 'q':
    case 'c':
    default:
      return `SVG parsing for ${head(a)} data isn't supported yet`
  }
}

// convertPoints :: Array -> Array
const convertPoints = (a) => {
  return a.map(processPathData)
}

module.exports = function (pathData) {
  return pipe(beginShape, parse, convertPoints, join)(pathData)
}
