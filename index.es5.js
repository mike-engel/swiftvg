(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('ramda'), require('parse-svg-path')) :
  typeof define === 'function' && define.amd ? define(['ramda', 'parse-svg-path'], factory) :
  (factory(global.ramda,global.parse));
}(this, (function (ramda,parse) { 'use strict';

parse = 'default' in parse ? parse['default'] : parse;

// SET_ABSOLUTE :: String
const SET_ABSOLUTE = 'SET_ABSOLUTE';

// SET_RELATIVE :: String
const SET_RELATIVE = 'SET_RELATIVE';

// type alias State = { x: String, y: String }
// initialState :: State
const initialState = { x: 0, y: 0 };

// state :: State
let state = Object.assign({}, initialState);

// reducer :: State -> String -> Object -> State
const reducer = ramda.curry((a, b, c) => {
  switch (b) {
    case SET_RELATIVE:
      return Object.assign({}, a, {
        x: a.x + Number((c.x)),
        y: a.y + Number((c.y))
      })
    case SET_ABSOLUTE:
      return Object.assign({}, a, {
        x: Number(ramda.when(ramda.isNil, ramda.always(a.x), c.x)),
        y: Number(ramda.when(ramda.isNil, ramda.always(a.y), c.y))
      })
    default:
      return a
  }
});

// dispatch :: String -> Object -> State
const dispatch = ramda.curry((a, b) => {
  state = reducer(state, a, b);

  return state
});

// roundFloat :: Number | String -> Number
const roundFloat = (a) => {
  return Number(a * 100).toFixed() / 100
};

// convertXY :: Array (Number | String) -> Object
const convertXY = (a) => {
  const x = Number(ramda.nth(0, a));
  const y = Number(ramda.nth(1, a));

  return { x, y }
};

// convertCCXY :: Array (Number | String) -> Object
const convertCCXY = (a) => {
  const x = Number(ramda.nth(4, a));
  const y = Number(ramda.nth(5, a));
  const cp1x = Number(ramda.nth(0, a));
  const cp1y = Number(ramda.nth(1, a));
  const cp2x = Number(ramda.nth(2, a));
  const cp2y = Number(ramda.nth(3, a));

  return { x, y, cp1x, cp1y, cp2x, cp2y }
};

// convertQCXY :: Array (Number | String) -> Object
const convertQCXY = (a) => {
  const x = Number(ramda.nth(2, a));
  const y = Number(ramda.nth(3, a));
  const cpx = Number(ramda.nth(0, a));
  const cpy = Number(ramda.nth(1, a));

  return { x, y, cpx, cpy }
};

// convertArcXY :: Array (Number | String) -> Object
const convertArcXY = (a) => {
  const x = Number(ramda.nth(5, a));
  const y = Number(ramda.nth(6, a));
  const rx = Number(ramda.nth(0, a));
  const ry = Number(ramda.nth(1, a));
  const cw = ramda.pipe(ramda.nth(4), ramda.equals(1))(a);

  return { x, y, rx, ry, cw }
};

// beginShape :: Nothing -> String
const beginShape = ramda.always('let shape = UIBezierPath()');

// endShape :: String
const endShape = 'shape.close()';

// cgPoint :: Object -> String
const cgPoint = (a) => {
  return `CGPoint(x: ${roundFloat(a.x)}, y: ${roundFloat(a.y)})`
};

// convertMove :: String -> String
const convertMove = (a) => {
  return `shape.move(to: ${a})`
};

// convertLine :: String -> String
const convertLine = (a) => {
  return `shape.addLine(to: ${a})`
};

// convertCubicCurve :: Object -> String
const convertCubicCurve = (a) => {
  const anchorPoint = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('x'), ramda.prop('y')]), convertXY, cgPoint)(a);
  const controlPointOne = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('cp1x'), ramda.prop('cp1y')]), convertXY, cgPoint)(a);
  const controlPointTwo = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('cp2x'), ramda.prop('cp2y')]), convertXY, cgPoint)(a);

  return `shape.addCurve(to: ${anchorPoint}, controlPoint1: ${controlPointOne}, controlPoint2: ${controlPointTwo})`
};

// convertQuadraticCurve :: Object -> String
const convertQuadraticCurve = (a) => {
  const anchorPoint = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('x'), ramda.prop('y')]), convertXY, cgPoint)(a);
  const controlPoint = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('cpx'), ramda.prop('cpy')]), convertXY, cgPoint)(a);

  return `shape.addCurve(to: ${anchorPoint}, controlPoint: ${controlPoint})`
};

// convertArc :: Object -> String
const convertArc = (a) => {
  const anchor = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('x'), ramda.prop('y')]), convertXY, cgPoint)(a);
  const radius = ramda.pipe(ramda.converge(ramda.pair, [ramda.prop('rx'), ramda.prop('ry')]), convertXY, cgPoint)(a);
  const clockwise = ramda.prop('cw', a);
  const startAngle = 0;
  const endAngle = 360;

  return `shape.addArc(withCenter: ${anchor}, radius: ${radius}, startAngle: ${startAngle}, endAngle: ${endAngle}, clockwise: ${clockwise})`
};

// processPathData :: Array (Array (Number | String)) -> String
const processPathData = (a) => {
  switch (ramda.head(a)) {
    case 'v':
      return ramda.pipe(ramda.drop(1), ramda.prepend(0), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'V':
      return ramda.pipe(ramda.drop(1), ramda.prepend(null), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'h':
      return ramda.pipe(ramda.drop(1), ramda.append(0), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'H':
      return ramda.pipe(ramda.drop(1), ramda.append(null), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'M':
      return ramda.pipe(ramda.drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertMove)(a)
    case 'l':
      return ramda.pipe(ramda.drop(1), convertXY, dispatch(SET_RELATIVE), cgPoint, convertLine)(a)
    case 'L':
      return ramda.pipe(ramda.drop(1), convertXY, dispatch(SET_ABSOLUTE), cgPoint, convertLine)(a)
    case 'c':
      return ramda.pipe(ramda.drop(1), convertCCXY, ramda.converge(ramda.merge, [ramda.identity, dispatch(SET_RELATIVE)]), convertCubicCurve)(a)
    case 'C':
      return ramda.pipe(ramda.drop(1), convertCCXY, ramda.converge(ramda.merge, [ramda.identity, dispatch(SET_ABSOLUTE)]), convertCubicCurve)(a)
    case 'q':
      return ramda.pipe(ramda.drop(1), convertQCXY, ramda.converge(ramda.merge, [ramda.identity, dispatch(SET_RELATIVE)]), convertQuadraticCurve)(a)
    case 'Q':
      return ramda.pipe(ramda.drop(1), convertQCXY, ramda.converge(ramda.merge, [ramda.identity, dispatch(SET_ABSOLUTE)]), convertQuadraticCurve)(a)
    case 'A':
      return ramda.pipe(ramda.drop(1), convertArcXY, ramda.converge(ramda.merge, [ramda.identity, dispatch(SET_ABSOLUTE)]), convertArc)(a)
    case 'Z':
      return endShape
    default:
      return `SVG parsing for ${ramda.head(a)} data isn't supported yet`
  }
};

// convertPoints :: Array (Array (Number | String)) -> Array String
const convertPoints = (a) => {
  return a.map(processPathData)
};

// svgToSwift :: String -> Array String
module.exports = (pathData) => {
  return ramda.pipe(parse, convertPoints, ramda.prepend(beginShape()))(pathData)
};

module.exports.SET_ABSOLUTE = SET_ABSOLUTE;
module.exports.SET_RELATIVE = SET_RELATIVE;
module.exports.initialState = initialState;
module.exports.reducer = reducer;
module.exports.dispatch = dispatch;
module.exports.roundFloat = roundFloat;
module.exports.cgPoint = cgPoint;
module.exports.beginShape = beginShape;
module.exports.endShape = endShape;
module.exports.convertXY = convertXY;
module.exports.convertCCXY = convertCCXY;
module.exports.convertQCXY = convertQCXY;
module.exports.convertArcXY = convertArcXY;
module.exports.convertMove = convertMove;
module.exports.convertLine = convertLine;
module.exports.convertCubicCurve = convertCubicCurve;
module.exports.convertQuadraticCurve = convertQuadraticCurve;
module.exports.convertArc = convertArc;
module.exports.processPathData = processPathData;
module.exports.convertPoints = convertPoints;

})));
