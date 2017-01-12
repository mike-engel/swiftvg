const {
  always,
  append,
  converge,
  curry,
  drop,
  equals,
  head,
  identity,
  isNil,
  merge,
  nth,
  pair,
  pipe,
  prepend,
  prop,
  slice,
  when
} = require('ramda')
const parse = require('parse-svg-path')

// SET_ABSOLUTE :: String
const SET_ABSOLUTE = 'SET_ABSOLUTE'

// SET_RELATIVE :: String
const SET_RELATIVE = 'SET_RELATIVE'

// type alias State = { x: String, y: String }
// initialState :: State
const initialState = { x: 0, y: 0 }

// state :: State
let state = Object.assign({}, initialState)

// reducer :: Object -> String -> Object -> Object
const reducer = curry((a, b, c) => {
  switch (b) {
    case SET_RELATIVE:
      return Object.assign({}, a, {
        x: a.x + Number((c.x)),
        y: a.y + Number((c.y))
      })
    case SET_ABSOLUTE:
      return Object.assign({}, a, {
        x: Number(when(isNil, always(a.x), c.x)),
        y: Number(when(isNil, always(a.y), c.y))
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

// roundFloat :: Number | String -> Number
const roundFloat = (a) => {
  return Number(a * 100).toFixed() / 100
}

// convertXY :: Array -> Object
const convertXY = (a) => {
  const x = Number(nth(0, a))
  const y = Number(nth(1, a))

  return { x, y }
}

// convertCCXY :: Array -> Object
const convertCCXY = (a) => {
  const x = Number(nth(4, a))
  const y = Number(nth(5, a))
  const cp1x = Number(nth(0, a))
  const cp1y = Number(nth(1, a))
  const cp2x = Number(nth(2, a))
  const cp2y = Number(nth(3, a))

  return { x, y, cp1x, cp1y, cp2x, cp2y }
}

// convertQCXY :: Array -> Object
const convertQCXY = (a) => {
  const x = Number(nth(2, a))
  const y = Number(nth(3, a))
  const cpx = Number(nth(0, a))
  const cpy = Number(nth(1, a))

  return { x, y, cpx, cpy }
}

// convertArcXY :: Array -> Object
const convertArcXY = (a) => {
  const x = Number(nth(5, a))
  const y = Number(nth(6, a))
  const rx = Number(nth(0, a))
  const ry = Number(nth(1, a))
  const cw = pipe(nth(4), equals(1))(a)

  return { x, y, rx, ry, cw }
}

// beginShape :: Nothing -> String
const beginShape = always('let shape = UIBezierPath()')

// endShape :: String
const endShape = 'shape.close()'

// cgPoint :: Object -> String
const cgPoint = (a) => {
  return `CGPoint(x: ${roundFloat(a.x)}, y: ${roundFloat(a.y)})`
}

// convertMove :: String -> String
const convertMove = (a) => {
  return `shape.move(to: ${a})`
}

// convertLine :: String -> String
const convertLine = (a) => {
  return `shape.addLine(to: ${a})`
}

// convertCubicCurve :: Object -> String
const convertCubicCurve = (a) => {
  const anchorPoint = pipe(converge(pair, [prop('x'), prop('y')]), convertXY, cgPoint)(a)
  const controlPointOne = pipe(converge(pair, [prop('cp1x'), prop('cp1y')]), convertXY, cgPoint)(a)
  const controlPointTwo = pipe(converge(pair, [prop('cp2x'), prop('cp2y')]), convertXY, cgPoint)(a)

  return `shape.addCurve(to: ${anchorPoint}, controlPoint1: ${controlPointOne}, controlPoint2: ${controlPointTwo})`
}

// convertQuadraticCurve :: Object -> String
const convertQuadraticCurve = (a) => {
  const anchorPoint = pipe(converge(pair, [prop('x'), prop('y')]), convertXY, cgPoint)(a)
  const controlPoint = pipe(converge(pair, [prop('cpx'), prop('cpy')]), convertXY, cgPoint)(a)

  return `shape.addCurve(to: ${anchorPoint}, controlPoint: ${controlPoint})`
}

// convertArc :: Object -> String
const convertArc = (a) => {
  const anchor = pipe(converge(pair, [prop('x'), prop('y')]), convertXY, cgPoint)(a)
  const radius = pipe(converge(pair, [prop('rx'), prop('ry')]), convertXY, cgPoint)(a)
  const clockwise = prop('cw', a)
  const startAngle = 0
  const endAngle = 360

  return `shape.addArc(withCenter: ${anchor}, radius: ${radius}, startAngle: ${startAngle}, endAngle: ${endAngle}, clockwise: ${clockwise})`
}

// processPathData :: Array -> String
const processPathData = (a) => {
  switch (head(a)) {
    case 'v':
      return pipe(drop(1), prepend(0), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'V':
      return pipe(drop(1), prepend(null), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'h':
      return pipe(drop(1), append(0), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'H':
      return pipe(drop(1), append(null), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'M':
      return pipe(drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertMove)(a)
    case 'l':
      return pipe(drop(1), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'L':
      return pipe(drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'c':
      return pipe(drop(1), convertCCXY, converge(merge, [identity, dispatch(SET_RELATIVE)]), convertCubicCurve)(a)
    case 'C':
      return pipe(drop(1), convertCCXY, converge(merge, [identity, dispatch(SET_ABSOLUTE)]), convertCubicCurve)(a)
    case 'q':
      return pipe(drop(1), convertQCXY, converge(merge, [identity, dispatch(SET_RELATIVE)]), convertQuadraticCurve)(a)
    case 'Q':
      return pipe(drop(1), convertQCXY, converge(merge, [identity, dispatch(SET_ABSOLUTE)]), convertQuadraticCurve)(a)
    case 'A':
      return pipe(drop(1), convertArcXY, converge(merge, [identity, dispatch(SET_ABSOLUTE)]), convertArc)(a)
    case 'Z':
      return endShape
    default:
      return `SVG parsing for ${head(a)} data isn't supported yet`
  }
}

// convertPoints :: Array -> Array
const convertPoints = (a) => {
  return a.map(processPathData)
}

module.exports = (pathData) => {
  return pipe(parse, convertPoints, prepend(beginShape()))(pathData)
}

module.exports.SET_ABSOLUTE = SET_ABSOLUTE
module.exports.SET_RELATIVE = SET_RELATIVE
module.exports.initialState = initialState
module.exports.reducer = reducer
module.exports.dispatch = dispatch
module.exports.roundFloat = roundFloat
module.exports.cgPoint = cgPoint
module.exports.beginShape = beginShape
module.exports.endShape = endShape
module.exports.convertXY = convertXY
module.exports.convertCCXY = convertCCXY
module.exports.convertQCXY = convertQCXY
module.exports.convertArcXY = convertArcXY
module.exports.convertMove = convertMove
module.exports.convertLine = convertLine
module.exports.convertCubicCurve = convertCubicCurve
module.exports.convertQuadraticCurve = convertQuadraticCurve
module.exports.convertArc = convertArc
module.exports.processPathData = processPathData
module.exports.convertPoints = convertPoints
