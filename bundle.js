!(function(f) {
	if ("object" == typeof exports && "undefined" != typeof module)
		module.exports = f();
	else if ("function" == typeof define && define.amd) define([], f);
	else {
		("undefined" != typeof window
			? window
			: "undefined" != typeof global
			? global
			: "undefined" != typeof self
			? self
			: this
		).swiftvg = f();
	}
})(function() {
	return (function() {
		return function r(e, n, t) {
			function o(i, f) {
				if (!n[i]) {
					if (!e[i]) {
						var c = "function" == typeof require && require;
						if (!f && c) return c(i, !0);
						if (u) return u(i, !0);
						var a = new Error("Cannot find module '" + i + "'");
						throw ((a.code = "MODULE_NOT_FOUND"), a);
					}
					var p = (n[i] = { exports: {} });
					e[i][0].call(
						p.exports,
						function(r) {
							return o(e[i][1][r] || r);
						},
						p,
						p.exports,
						r,
						e,
						n,
						t
					);
				}
				return n[i].exports;
			}
			for (
				var u = "function" == typeof require && require, i = 0;
				i < t.length;
				i++
			)
				o(t[i]);
			return o;
		};
	})()(
		{
			1: [
				function(require, module, exports) {
					"use strict";
					const always = require("ramda/src/always"),
						append = require("ramda/src/append"),
						converge = require("ramda/src/converge"),
						curry = require("ramda/src/curry"),
						drop = require("ramda/src/drop"),
						equals = require("ramda/src/equals"),
						head = require("ramda/src/head"),
						identity = require("ramda/src/identity"),
						isNil = require("ramda/src/isNil"),
						merge = require("ramda/src/merge"),
						nth = require("ramda/src/nth"),
						pair = require("ramda/src/pair"),
						pipe = require("ramda/src/pipe"),
						prepend = require("ramda/src/prepend"),
						prop = require("ramda/src/prop"),
						when = require("ramda/src/when"),
						parse = require("parse-svg-path"),
						initialState = { x: 0, y: 0 };
					let state = Object.assign({}, initialState);
					const reducer = curry((a, b, c) => {
							switch (b) {
								case "SET_RELATIVE":
									return Object.assign({}, a, {
										x: a.x + Number(c.x),
										y: a.y + Number(c.y)
									});
								case "SET_ABSOLUTE":
									return Object.assign({}, a, {
										x: Number(when(isNil, always(a.x), c.x)),
										y: Number(when(isNil, always(a.y), c.y))
									});
								default:
									return a;
							}
						}),
						dispatch = curry((a, b) => (state = reducer(state, a, b))),
						roundFloat = a => Number(100 * a).toFixed() / 100,
						convertXY = a => {
							return { x: Number(nth(0, a)), y: Number(nth(1, a)) };
						},
						convertCCXY = a => {
							return {
								x: Number(nth(4, a)),
								y: Number(nth(5, a)),
								cp1x: Number(nth(0, a)),
								cp1y: Number(nth(1, a)),
								cp2x: Number(nth(2, a)),
								cp2y: Number(nth(3, a))
							};
						},
						convertQCXY = a => {
							return {
								x: Number(nth(2, a)),
								y: Number(nth(3, a)),
								cpx: Number(nth(0, a)),
								cpy: Number(nth(1, a))
							};
						},
						convertArcXY = a => {
							return {
								x: Number(nth(5, a)),
								y: Number(nth(6, a)),
								rx: Number(nth(0, a)),
								ry: Number(nth(1, a)),
								cw: pipe(
									nth(4),
									equals(1)
								)(a)
							};
						},
						beginShape = always("let shape = UIBezierPath()"),
						cgPoint = a =>
							`CGPoint(x: ${roundFloat(a.x)}, y: ${roundFloat(a.y)})`,
						convertMove = a => `shape.move(to: ${a})`,
						convertLine = a => `shape.addLine(to: ${a})`,
						convertCubicCurve = a => {
							return `shape.addCurve(to: ${pipe(
								converge(pair, [prop("x"), prop("y")]),
								convertXY,
								cgPoint
							)(a)}, controlPoint1: ${pipe(
								converge(pair, [prop("cp1x"), prop("cp1y")]),
								convertXY,
								cgPoint
							)(a)}, controlPoint2: ${pipe(
								converge(pair, [prop("cp2x"), prop("cp2y")]),
								convertXY,
								cgPoint
							)(a)})`;
						},
						convertQuadraticCurve = a => {
							return `shape.addCurve(to: ${pipe(
								converge(pair, [prop("x"), prop("y")]),
								convertXY,
								cgPoint
							)(a)}, controlPoint: ${pipe(
								converge(pair, [prop("cpx"), prop("cpy")]),
								convertXY,
								cgPoint
							)(a)})`;
						},
						convertArc = a => {
							return `shape.addArc(withCenter: ${pipe(
								converge(pair, [prop("x"), prop("y")]),
								convertXY,
								cgPoint
							)(a)}, radius: ${pipe(
								converge(pair, [prop("rx"), prop("ry")]),
								convertXY,
								cgPoint
							)(a)}, startAngle: 0, endAngle: 360, clockwise: ${prop(
								"cw",
								a
							)})`;
						},
						processPathData = a => {
							switch (head(a)) {
								case "v":
									return pipe(
										drop(1),
										prepend(0),
										convertXY,
										dispatch("SET_RELATIVE"),
										cgPoint,
										convertLine
									)(a);
								case "V":
									return pipe(
										drop(1),
										prepend(null),
										convertXY,
										dispatch("SET_ABSOLUTE"),
										cgPoint,
										convertLine
									)(a);
								case "h":
									return pipe(
										drop(1),
										append(0),
										convertXY,
										dispatch("SET_RELATIVE"),
										cgPoint,
										convertLine
									)(a);
								case "H":
									return pipe(
										drop(1),
										append(null),
										convertXY,
										dispatch("SET_ABSOLUTE"),
										cgPoint,
										convertLine
									)(a);
								case "M":
									return pipe(
										drop(1),
										convertXY,
										dispatch("SET_ABSOLUTE"),
										cgPoint,
										convertMove
									)(a);
								case "l":
									return pipe(
										drop(1),
										convertXY,
										dispatch("SET_RELATIVE"),
										cgPoint,
										convertLine
									)(a);
								case "L":
									return pipe(
										drop(1),
										convertXY,
										dispatch("SET_ABSOLUTE"),
										cgPoint,
										convertLine
									)(a);
								case "c":
									return pipe(
										drop(1),
										convertCCXY,
										converge(merge, [identity, dispatch("SET_RELATIVE")]),
										convertCubicCurve
									)(a);
								case "C":
									return pipe(
										drop(1),
										convertCCXY,
										converge(merge, [identity, dispatch("SET_ABSOLUTE")]),
										convertCubicCurve
									)(a);
								case "q":
									return pipe(
										drop(1),
										convertQCXY,
										converge(merge, [identity, dispatch("SET_RELATIVE")]),
										convertQuadraticCurve
									)(a);
								case "Q":
									return pipe(
										drop(1),
										convertQCXY,
										converge(merge, [identity, dispatch("SET_ABSOLUTE")]),
										convertQuadraticCurve
									)(a);
								case "A":
									return pipe(
										drop(1),
										convertArcXY,
										converge(merge, [identity, dispatch("SET_ABSOLUTE")]),
										convertArc
									)(a);
								case "Z":
									return "shape.close()";
								default:
									return `SVG parsing for ${head(a)} data isn't supported yet`;
							}
						},
						convertPoints = a => a.map(processPathData);
					(module.exports = pathData =>
						pipe(
							parse,
							convertPoints,
							prepend(beginShape())
						)(pathData)),
						(module.exports.SET_ABSOLUTE = "SET_ABSOLUTE"),
						(module.exports.SET_RELATIVE = "SET_RELATIVE"),
						(module.exports.initialState = initialState),
						(module.exports.reducer = reducer),
						(module.exports.dispatch = dispatch),
						(module.exports.roundFloat = roundFloat),
						(module.exports.cgPoint = cgPoint),
						(module.exports.beginShape = beginShape),
						(module.exports.endShape = "shape.close()"),
						(module.exports.convertXY = convertXY),
						(module.exports.convertCCXY = convertCCXY),
						(module.exports.convertQCXY = convertQCXY),
						(module.exports.convertArcXY = convertArcXY),
						(module.exports.convertMove = convertMove),
						(module.exports.convertLine = convertLine),
						(module.exports.convertCubicCurve = convertCubicCurve),
						(module.exports.convertQuadraticCurve = convertQuadraticCurve),
						(module.exports.convertArc = convertArc),
						(module.exports.processPathData = processPathData),
						(module.exports.convertPoints = convertPoints);
				},
				{
					"parse-svg-path": 2,
					"ramda/src/always": 3,
					"ramda/src/append": 4,
					"ramda/src/converge": 6,
					"ramda/src/curry": 7,
					"ramda/src/drop": 9,
					"ramda/src/equals": 10,
					"ramda/src/head": 11,
					"ramda/src/identity": 12,
					"ramda/src/isNil": 42,
					"ramda/src/merge": 46,
					"ramda/src/nth": 47,
					"ramda/src/pair": 48,
					"ramda/src/pipe": 50,
					"ramda/src/prepend": 52,
					"ramda/src/prop": 53,
					"ramda/src/when": 58
				}
			],
			2: [
				function(require, module, exports) {
					module.exports = function(path) {
						var data = [];
						return (
							path.replace(segment, function(_, command, args) {
								var type = command.toLowerCase();
								for (
									args = (function(args) {
										var numbers = args.match(number);
										return numbers ? numbers.map(Number) : [];
									})(args),
										"m" == type &&
											args.length > 2 &&
											(data.push([command].concat(args.splice(0, 2))),
											(type = "l"),
											(command = "m" == command ? "l" : "L"));
									;

								) {
									if (args.length == length[type])
										return args.unshift(command), data.push(args);
									if (args.length < length[type])
										throw new Error("malformed path data");
									data.push([command].concat(args.splice(0, length[type])));
								}
							}),
							data
						);
					};
					var length = {
							a: 7,
							c: 6,
							h: 1,
							l: 2,
							m: 2,
							q: 4,
							s: 4,
							t: 2,
							v: 1,
							z: 0
						},
						segment = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
					var number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
				},
				{}
			],
			3: [
				function(require, module, exports) {
					var always = require("./internal/_curry1")(function(val) {
						return function() {
							return val;
						};
					});
					module.exports = always;
				},
				{ "./internal/_curry1": 17 }
			],
			4: [
				function(require, module, exports) {
					var _concat = require("./internal/_concat"),
						append = require("./internal/_curry2")(function(el, list) {
							return _concat(list, [el]);
						});
					module.exports = append;
				},
				{ "./internal/_concat": 16, "./internal/_curry2": 18 }
			],
			5: [
				function(require, module, exports) {
					var _arity = require("./internal/_arity"),
						bind = require("./internal/_curry2")(function(fn, thisObj) {
							return _arity(fn.length, function() {
								return fn.apply(thisObj, arguments);
							});
						});
					module.exports = bind;
				},
				{ "./internal/_arity": 13, "./internal/_curry2": 18 }
			],
			6: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						_map = require("./internal/_map"),
						curryN = require("./curryN"),
						max = require("./max"),
						pluck = require("./pluck"),
						reduce = require("./reduce"),
						converge = _curry2(function(after, fns) {
							return curryN(reduce(max, 0, pluck("length", fns)), function() {
								var args = arguments,
									context = this;
								return after.apply(
									context,
									_map(function(fn) {
										return fn.apply(context, args);
									}, fns)
								);
							});
						});
					module.exports = converge;
				},
				{
					"./curryN": 8,
					"./internal/_curry2": 18,
					"./internal/_map": 33,
					"./max": 45,
					"./pluck": 51,
					"./reduce": 54
				}
			],
			7: [
				function(require, module, exports) {
					var _curry1 = require("./internal/_curry1"),
						curryN = require("./curryN"),
						curry = _curry1(function(fn) {
							return curryN(fn.length, fn);
						});
					module.exports = curry;
				},
				{ "./curryN": 8, "./internal/_curry1": 17 }
			],
			8: [
				function(require, module, exports) {
					var _arity = require("./internal/_arity"),
						_curry1 = require("./internal/_curry1"),
						_curry2 = require("./internal/_curry2"),
						_curryN = require("./internal/_curryN"),
						curryN = _curry2(function(length, fn) {
							return 1 === length
								? _curry1(fn)
								: _arity(length, _curryN(length, [], fn));
						});
					module.exports = curryN;
				},
				{
					"./internal/_arity": 13,
					"./internal/_curry1": 17,
					"./internal/_curry2": 18,
					"./internal/_curryN": 20
				}
			],
			9: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						_dispatchable = require("./internal/_dispatchable"),
						_xdrop = require("./internal/_xdrop"),
						slice = require("./slice"),
						drop = _curry2(
							_dispatchable(["drop"], _xdrop, function(n, xs) {
								return slice(Math.max(0, n), 1 / 0, xs);
							})
						);
					module.exports = drop;
				},
				{
					"./internal/_curry2": 18,
					"./internal/_dispatchable": 21,
					"./internal/_xdrop": 38,
					"./slice": 55
				}
			],
			10: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						_equals = require("./internal/_equals"),
						equals = _curry2(function(a, b) {
							return _equals(a, b, [], []);
						});
					module.exports = equals;
				},
				{ "./internal/_curry2": 18, "./internal/_equals": 22 }
			],
			11: [
				function(require, module, exports) {
					var head = require("./nth")(0);
					module.exports = head;
				},
				{ "./nth": 47 }
			],
			12: [
				function(require, module, exports) {
					var identity = require("./internal/_curry1")(
						require("./internal/_identity")
					);
					module.exports = identity;
				},
				{ "./internal/_curry1": 17, "./internal/_identity": 25 }
			],
			13: [
				function(require, module, exports) {
					module.exports = function(n, fn) {
						switch (n) {
							case 0:
								return function() {
									return fn.apply(this, arguments);
								};
							case 1:
								return function(a0) {
									return fn.apply(this, arguments);
								};
							case 2:
								return function(a0, a1) {
									return fn.apply(this, arguments);
								};
							case 3:
								return function(a0, a1, a2) {
									return fn.apply(this, arguments);
								};
							case 4:
								return function(a0, a1, a2, a3) {
									return fn.apply(this, arguments);
								};
							case 5:
								return function(a0, a1, a2, a3, a4) {
									return fn.apply(this, arguments);
								};
							case 6:
								return function(a0, a1, a2, a3, a4, a5) {
									return fn.apply(this, arguments);
								};
							case 7:
								return function(a0, a1, a2, a3, a4, a5, a6) {
									return fn.apply(this, arguments);
								};
							case 8:
								return function(a0, a1, a2, a3, a4, a5, a6, a7) {
									return fn.apply(this, arguments);
								};
							case 9:
								return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
									return fn.apply(this, arguments);
								};
							case 10:
								return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
									return fn.apply(this, arguments);
								};
							default:
								throw new Error(
									"First argument to _arity must be a non-negative integer no greater than ten"
								);
						}
					};
				},
				{}
			],
			14: [
				function(require, module, exports) {
					module.exports = function(iter) {
						for (var next, list = []; !(next = iter.next()).done; )
							list.push(next.value);
						return list;
					};
				},
				{}
			],
			15: [
				function(require, module, exports) {
					var _isArray = require("./_isArray");
					module.exports = function(methodname, fn) {
						return function() {
							var length = arguments.length;
							if (0 === length) return fn();
							var obj = arguments[length - 1];
							return _isArray(obj) || "function" != typeof obj[methodname]
								? fn.apply(this, arguments)
								: obj[methodname].apply(
										obj,
										Array.prototype.slice.call(arguments, 0, length - 1)
								  );
						};
					};
				},
				{ "./_isArray": 28 }
			],
			16: [
				function(require, module, exports) {
					module.exports = function(set1, set2) {
						var idx;
						set2 = set2 || [];
						var len1 = (set1 = set1 || []).length,
							len2 = set2.length,
							result = [];
						for (idx = 0; idx < len1; )
							(result[result.length] = set1[idx]), (idx += 1);
						for (idx = 0; idx < len2; )
							(result[result.length] = set2[idx]), (idx += 1);
						return result;
					};
				},
				{}
			],
			17: [
				function(require, module, exports) {
					var _isPlaceholder = require("./_isPlaceholder");
					module.exports = function(fn) {
						return function f1(a) {
							return 0 === arguments.length || _isPlaceholder(a)
								? f1
								: fn.apply(this, arguments);
						};
					};
				},
				{ "./_isPlaceholder": 30 }
			],
			18: [
				function(require, module, exports) {
					var _curry1 = require("./_curry1"),
						_isPlaceholder = require("./_isPlaceholder");
					module.exports = function(fn) {
						return function f2(a, b) {
							switch (arguments.length) {
								case 0:
									return f2;
								case 1:
									return _isPlaceholder(a)
										? f2
										: _curry1(function(_b) {
												return fn(a, _b);
										  });
								default:
									return _isPlaceholder(a) && _isPlaceholder(b)
										? f2
										: _isPlaceholder(a)
										? _curry1(function(_a) {
												return fn(_a, b);
										  })
										: _isPlaceholder(b)
										? _curry1(function(_b) {
												return fn(a, _b);
										  })
										: fn(a, b);
							}
						};
					};
				},
				{ "./_curry1": 17, "./_isPlaceholder": 30 }
			],
			19: [
				function(require, module, exports) {
					var _curry1 = require("./_curry1"),
						_curry2 = require("./_curry2"),
						_isPlaceholder = require("./_isPlaceholder");
					module.exports = function(fn) {
						return function f3(a, b, c) {
							switch (arguments.length) {
								case 0:
									return f3;
								case 1:
									return _isPlaceholder(a)
										? f3
										: _curry2(function(_b, _c) {
												return fn(a, _b, _c);
										  });
								case 2:
									return _isPlaceholder(a) && _isPlaceholder(b)
										? f3
										: _isPlaceholder(a)
										? _curry2(function(_a, _c) {
												return fn(_a, b, _c);
										  })
										: _isPlaceholder(b)
										? _curry2(function(_b, _c) {
												return fn(a, _b, _c);
										  })
										: _curry1(function(_c) {
												return fn(a, b, _c);
										  });
								default:
									return _isPlaceholder(a) &&
										_isPlaceholder(b) &&
										_isPlaceholder(c)
										? f3
										: _isPlaceholder(a) && _isPlaceholder(b)
										? _curry2(function(_a, _b) {
												return fn(_a, _b, c);
										  })
										: _isPlaceholder(a) && _isPlaceholder(c)
										? _curry2(function(_a, _c) {
												return fn(_a, b, _c);
										  })
										: _isPlaceholder(b) && _isPlaceholder(c)
										? _curry2(function(_b, _c) {
												return fn(a, _b, _c);
										  })
										: _isPlaceholder(a)
										? _curry1(function(_a) {
												return fn(_a, b, c);
										  })
										: _isPlaceholder(b)
										? _curry1(function(_b) {
												return fn(a, _b, c);
										  })
										: _isPlaceholder(c)
										? _curry1(function(_c) {
												return fn(a, b, _c);
										  })
										: fn(a, b, c);
							}
						};
					};
				},
				{ "./_curry1": 17, "./_curry2": 18, "./_isPlaceholder": 30 }
			],
			20: [
				function(require, module, exports) {
					var _arity = require("./_arity"),
						_isPlaceholder = require("./_isPlaceholder");
					module.exports = function _curryN(length, received, fn) {
						return function() {
							for (
								var combined = [], argsIdx = 0, left = length, combinedIdx = 0;
								combinedIdx < received.length || argsIdx < arguments.length;

							) {
								var result;
								combinedIdx < received.length &&
								(!_isPlaceholder(received[combinedIdx]) ||
									argsIdx >= arguments.length)
									? (result = received[combinedIdx])
									: ((result = arguments[argsIdx]), (argsIdx += 1)),
									(combined[combinedIdx] = result),
									_isPlaceholder(result) || (left -= 1),
									(combinedIdx += 1);
							}
							return left <= 0
								? fn.apply(this, combined)
								: _arity(left, _curryN(length, combined, fn));
						};
					};
				},
				{ "./_arity": 13, "./_isPlaceholder": 30 }
			],
			21: [
				function(require, module, exports) {
					var _isArray = require("./_isArray"),
						_isTransformer = require("./_isTransformer");
					module.exports = function(methodNames, xf, fn) {
						return function() {
							if (0 === arguments.length) return fn();
							var args = Array.prototype.slice.call(arguments, 0),
								obj = args.pop();
							if (!_isArray(obj)) {
								for (var idx = 0; idx < methodNames.length; ) {
									if ("function" == typeof obj[methodNames[idx]])
										return obj[methodNames[idx]].apply(obj, args);
									idx += 1;
								}
								if (_isTransformer(obj)) return xf.apply(null, args)(obj);
							}
							return fn.apply(this, arguments);
						};
					};
				},
				{ "./_isArray": 28, "./_isTransformer": 32 }
			],
			22: [
				function(require, module, exports) {
					var _arrayFromIterator = require("./_arrayFromIterator"),
						_includesWith = require("./_includesWith"),
						_functionName = require("./_functionName"),
						_has = require("./_has"),
						_objectIs = require("./_objectIs"),
						keys = require("../keys"),
						type = require("../type");
					function _uniqContentEquals(aIterator, bIterator, stackA, stackB) {
						var a = _arrayFromIterator(aIterator),
							b = _arrayFromIterator(bIterator);
						function eq(_a, _b) {
							return _equals(_a, _b, stackA.slice(), stackB.slice());
						}
						return !_includesWith(
							function(b, aItem) {
								return !_includesWith(eq, aItem, b);
							},
							b,
							a
						);
					}
					function _equals(a, b, stackA, stackB) {
						if (_objectIs(a, b)) return !0;
						var typeA = type(a);
						if (typeA !== type(b)) return !1;
						if (null == a || null == b) return !1;
						if (
							"function" == typeof a["fantasy-land/equals"] ||
							"function" == typeof b["fantasy-land/equals"]
						)
							return (
								"function" == typeof a["fantasy-land/equals"] &&
								a["fantasy-land/equals"](b) &&
								"function" == typeof b["fantasy-land/equals"] &&
								b["fantasy-land/equals"](a)
							);
						if ("function" == typeof a.equals || "function" == typeof b.equals)
							return (
								"function" == typeof a.equals &&
								a.equals(b) &&
								"function" == typeof b.equals &&
								b.equals(a)
							);
						switch (typeA) {
							case "Arguments":
							case "Array":
							case "Object":
								if (
									"function" == typeof a.constructor &&
									"Promise" === _functionName(a.constructor)
								)
									return a === b;
								break;
							case "Boolean":
							case "Number":
							case "String":
								if (
									typeof a != typeof b ||
									!_objectIs(a.valueOf(), b.valueOf())
								)
									return !1;
								break;
							case "Date":
								if (!_objectIs(a.valueOf(), b.valueOf())) return !1;
								break;
							case "Error":
								return a.name === b.name && a.message === b.message;
							case "RegExp":
								if (
									a.source !== b.source ||
									a.global !== b.global ||
									a.ignoreCase !== b.ignoreCase ||
									a.multiline !== b.multiline ||
									a.sticky !== b.sticky ||
									a.unicode !== b.unicode
								)
									return !1;
						}
						for (var idx = stackA.length - 1; idx >= 0; ) {
							if (stackA[idx] === a) return stackB[idx] === b;
							idx -= 1;
						}
						switch (typeA) {
							case "Map":
								return (
									a.size === b.size &&
									_uniqContentEquals(
										a.entries(),
										b.entries(),
										stackA.concat([a]),
										stackB.concat([b])
									)
								);
							case "Set":
								return (
									a.size === b.size &&
									_uniqContentEquals(
										a.values(),
										b.values(),
										stackA.concat([a]),
										stackB.concat([b])
									)
								);
							case "Arguments":
							case "Array":
							case "Object":
							case "Boolean":
							case "Number":
							case "String":
							case "Date":
							case "Error":
							case "RegExp":
							case "Int8Array":
							case "Uint8Array":
							case "Uint8ClampedArray":
							case "Int16Array":
							case "Uint16Array":
							case "Int32Array":
							case "Uint32Array":
							case "Float32Array":
							case "Float64Array":
							case "ArrayBuffer":
								break;
							default:
								return !1;
						}
						var keysA = keys(a);
						if (keysA.length !== keys(b).length) return !1;
						var extendedStackA = stackA.concat([a]),
							extendedStackB = stackB.concat([b]);
						for (idx = keysA.length - 1; idx >= 0; ) {
							var key = keysA[idx];
							if (
								!_has(key, b) ||
								!_equals(b[key], a[key], extendedStackA, extendedStackB)
							)
								return !1;
							idx -= 1;
						}
						return !0;
					}
					module.exports = _equals;
				},
				{
					"../keys": 43,
					"../type": 57,
					"./_arrayFromIterator": 14,
					"./_functionName": 23,
					"./_has": 24,
					"./_includesWith": 26,
					"./_objectIs": 35
				}
			],
			23: [
				function(require, module, exports) {
					module.exports = function(f) {
						var match = String(f).match(/^function (\w*)/);
						return null == match ? "" : match[1];
					};
				},
				{}
			],
			24: [
				function(require, module, exports) {
					module.exports = function(prop, obj) {
						return Object.prototype.hasOwnProperty.call(obj, prop);
					};
				},
				{}
			],
			25: [
				function(require, module, exports) {
					module.exports = function(x) {
						return x;
					};
				},
				{}
			],
			26: [
				function(require, module, exports) {
					module.exports = function(pred, x, list) {
						for (var idx = 0, len = list.length; idx < len; ) {
							if (pred(x, list[idx])) return !0;
							idx += 1;
						}
						return !1;
					};
				},
				{}
			],
			27: [
				function(require, module, exports) {
					var _has = require("./_has"),
						toString = Object.prototype.toString,
						_isArguments = (function() {
							return "[object Arguments]" === toString.call(arguments)
								? function(x) {
										return "[object Arguments]" === toString.call(x);
								  }
								: function(x) {
										return _has("callee", x);
								  };
						})();
					module.exports = _isArguments;
				},
				{ "./_has": 24 }
			],
			28: [
				function(require, module, exports) {
					module.exports =
						Array.isArray ||
						function(val) {
							return (
								null != val &&
								val.length >= 0 &&
								"[object Array]" === Object.prototype.toString.call(val)
							);
						};
				},
				{}
			],
			29: [
				function(require, module, exports) {
					var _curry1 = require("./_curry1"),
						_isArray = require("./_isArray"),
						_isString = require("./_isString"),
						_isArrayLike = _curry1(function(x) {
							return (
								!!_isArray(x) ||
								(!!x &&
									("object" == typeof x &&
										(!_isString(x) &&
											(1 === x.nodeType
												? !!x.length
												: 0 === x.length ||
												  (x.length > 0 &&
														(x.hasOwnProperty(0) &&
															x.hasOwnProperty(x.length - 1)))))))
							);
						});
					module.exports = _isArrayLike;
				},
				{ "./_curry1": 17, "./_isArray": 28, "./_isString": 31 }
			],
			30: [
				function(require, module, exports) {
					module.exports = function(a) {
						return (
							null != a &&
							"object" == typeof a &&
							!0 === a["@@functional/placeholder"]
						);
					};
				},
				{}
			],
			31: [
				function(require, module, exports) {
					module.exports = function(x) {
						return "[object String]" === Object.prototype.toString.call(x);
					};
				},
				{}
			],
			32: [
				function(require, module, exports) {
					module.exports = function(obj) {
						return null != obj && "function" == typeof obj["@@transducer/step"];
					};
				},
				{}
			],
			33: [
				function(require, module, exports) {
					module.exports = function(fn, functor) {
						for (
							var idx = 0, len = functor.length, result = Array(len);
							idx < len;

						)
							(result[idx] = fn(functor[idx])), (idx += 1);
						return result;
					};
				},
				{}
			],
			34: [
				function(require, module, exports) {
					var _has = require("./_has");
					module.exports =
						"function" == typeof Object.assign
							? Object.assign
							: function(target) {
									if (null == target)
										throw new TypeError(
											"Cannot convert undefined or null to object"
										);
									for (
										var output = Object(target),
											idx = 1,
											length = arguments.length;
										idx < length;

									) {
										var source = arguments[idx];
										if (null != source)
											for (var nextKey in source)
												_has(nextKey, source) &&
													(output[nextKey] = source[nextKey]);
										idx += 1;
									}
									return output;
							  };
				},
				{ "./_has": 24 }
			],
			35: [
				function(require, module, exports) {
					module.exports =
						"function" == typeof Object.is
							? Object.is
							: function(a, b) {
									return a === b ? 0 !== a || 1 / a == 1 / b : a != a && b != b;
							  };
				},
				{}
			],
			36: [
				function(require, module, exports) {
					module.exports = function(f, g) {
						return function() {
							return g.call(this, f.apply(this, arguments));
						};
					};
				},
				{}
			],
			37: [
				function(require, module, exports) {
					var _isArrayLike = require("./_isArrayLike"),
						_xwrap = require("./_xwrap"),
						bind = require("../bind");
					function _iterableReduce(xf, acc, iter) {
						for (var step = iter.next(); !step.done; ) {
							if (
								(acc = xf["@@transducer/step"](acc, step.value)) &&
								acc["@@transducer/reduced"]
							) {
								acc = acc["@@transducer/value"];
								break;
							}
							step = iter.next();
						}
						return xf["@@transducer/result"](acc);
					}
					function _methodReduce(xf, acc, obj, methodName) {
						return xf["@@transducer/result"](
							obj[methodName](bind(xf["@@transducer/step"], xf), acc)
						);
					}
					var symIterator =
						"undefined" != typeof Symbol ? Symbol.iterator : "@@iterator";
					module.exports = function(fn, acc, list) {
						if (
							("function" == typeof fn && (fn = _xwrap(fn)), _isArrayLike(list))
						)
							return (function(xf, acc, list) {
								for (var idx = 0, len = list.length; idx < len; ) {
									if (
										(acc = xf["@@transducer/step"](acc, list[idx])) &&
										acc["@@transducer/reduced"]
									) {
										acc = acc["@@transducer/value"];
										break;
									}
									idx += 1;
								}
								return xf["@@transducer/result"](acc);
							})(fn, acc, list);
						if ("function" == typeof list["fantasy-land/reduce"])
							return _methodReduce(fn, acc, list, "fantasy-land/reduce");
						if (null != list[symIterator])
							return _iterableReduce(fn, acc, list[symIterator]());
						if ("function" == typeof list.next)
							return _iterableReduce(fn, acc, list);
						if ("function" == typeof list.reduce)
							return _methodReduce(fn, acc, list, "reduce");
						throw new TypeError("reduce: list must be array or iterable");
					};
				},
				{ "../bind": 5, "./_isArrayLike": 29, "./_xwrap": 41 }
			],
			38: [
				function(require, module, exports) {
					var _curry2 = require("./_curry2"),
						_xfBase = require("./_xfBase"),
						XDrop = (function() {
							function XDrop(n, xf) {
								(this.xf = xf), (this.n = n);
							}
							return (
								(XDrop.prototype["@@transducer/init"] = _xfBase.init),
								(XDrop.prototype["@@transducer/result"] = _xfBase.result),
								(XDrop.prototype["@@transducer/step"] = function(
									result,
									input
								) {
									return this.n > 0
										? ((this.n -= 1), result)
										: this.xf["@@transducer/step"](result, input);
								}),
								XDrop
							);
						})(),
						_xdrop = _curry2(function(n, xf) {
							return new XDrop(n, xf);
						});
					module.exports = _xdrop;
				},
				{ "./_curry2": 18, "./_xfBase": 39 }
			],
			39: [
				function(require, module, exports) {
					module.exports = {
						init: function() {
							return this.xf["@@transducer/init"]();
						},
						result: function(result) {
							return this.xf["@@transducer/result"](result);
						}
					};
				},
				{}
			],
			40: [
				function(require, module, exports) {
					var _curry2 = require("./_curry2"),
						_xfBase = require("./_xfBase"),
						XMap = (function() {
							function XMap(f, xf) {
								(this.xf = xf), (this.f = f);
							}
							return (
								(XMap.prototype["@@transducer/init"] = _xfBase.init),
								(XMap.prototype["@@transducer/result"] = _xfBase.result),
								(XMap.prototype["@@transducer/step"] = function(result, input) {
									return this.xf["@@transducer/step"](result, this.f(input));
								}),
								XMap
							);
						})(),
						_xmap = _curry2(function(f, xf) {
							return new XMap(f, xf);
						});
					module.exports = _xmap;
				},
				{ "./_curry2": 18, "./_xfBase": 39 }
			],
			41: [
				function(require, module, exports) {
					var XWrap = (function() {
						function XWrap(fn) {
							this.f = fn;
						}
						return (
							(XWrap.prototype["@@transducer/init"] = function() {
								throw new Error("init not implemented on XWrap");
							}),
							(XWrap.prototype["@@transducer/result"] = function(acc) {
								return acc;
							}),
							(XWrap.prototype["@@transducer/step"] = function(acc, x) {
								return this.f(acc, x);
							}),
							XWrap
						);
					})();
					module.exports = function(fn) {
						return new XWrap(fn);
					};
				},
				{}
			],
			42: [
				function(require, module, exports) {
					var isNil = require("./internal/_curry1")(function(x) {
						return null == x;
					});
					module.exports = isNil;
				},
				{ "./internal/_curry1": 17 }
			],
			43: [
				function(require, module, exports) {
					var _curry1 = require("./internal/_curry1"),
						_has = require("./internal/_has"),
						_isArguments = require("./internal/_isArguments"),
						hasEnumBug = !{ toString: null }.propertyIsEnumerable("toString"),
						nonEnumerableProps = [
							"constructor",
							"valueOf",
							"isPrototypeOf",
							"toString",
							"propertyIsEnumerable",
							"hasOwnProperty",
							"toLocaleString"
						],
						hasArgsEnumBug = (function() {
							"use strict";
							return arguments.propertyIsEnumerable("length");
						})(),
						contains = function(list, item) {
							for (var idx = 0; idx < list.length; ) {
								if (list[idx] === item) return !0;
								idx += 1;
							}
							return !1;
						},
						keys =
							"function" != typeof Object.keys || hasArgsEnumBug
								? _curry1(function(obj) {
										if (Object(obj) !== obj) return [];
										var prop,
											nIdx,
											ks = [],
											checkArgsLength = hasArgsEnumBug && _isArguments(obj);
										for (prop in obj)
											!_has(prop, obj) ||
												(checkArgsLength && "length" === prop) ||
												(ks[ks.length] = prop);
										if (hasEnumBug)
											for (nIdx = nonEnumerableProps.length - 1; nIdx >= 0; )
												_has((prop = nonEnumerableProps[nIdx]), obj) &&
													!contains(ks, prop) &&
													(ks[ks.length] = prop),
													(nIdx -= 1);
										return ks;
								  })
								: _curry1(function(obj) {
										return Object(obj) !== obj ? [] : Object.keys(obj);
								  });
					module.exports = keys;
				},
				{
					"./internal/_curry1": 17,
					"./internal/_has": 24,
					"./internal/_isArguments": 27
				}
			],
			44: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						_dispatchable = require("./internal/_dispatchable"),
						_map = require("./internal/_map"),
						_reduce = require("./internal/_reduce"),
						_xmap = require("./internal/_xmap"),
						curryN = require("./curryN"),
						keys = require("./keys"),
						map = _curry2(
							_dispatchable(["fantasy-land/map", "map"], _xmap, function(
								fn,
								functor
							) {
								switch (Object.prototype.toString.call(functor)) {
									case "[object Function]":
										return curryN(functor.length, function() {
											return fn.call(this, functor.apply(this, arguments));
										});
									case "[object Object]":
										return _reduce(
											function(acc, key) {
												return (acc[key] = fn(functor[key])), acc;
											},
											{},
											keys(functor)
										);
									default:
										return _map(fn, functor);
								}
							})
						);
					module.exports = map;
				},
				{
					"./curryN": 8,
					"./internal/_curry2": 18,
					"./internal/_dispatchable": 21,
					"./internal/_map": 33,
					"./internal/_reduce": 37,
					"./internal/_xmap": 40,
					"./keys": 43
				}
			],
			45: [
				function(require, module, exports) {
					var max = require("./internal/_curry2")(function(a, b) {
						return b > a ? b : a;
					});
					module.exports = max;
				},
				{ "./internal/_curry2": 18 }
			],
			46: [
				function(require, module, exports) {
					var _objectAssign = require("./internal/_objectAssign"),
						merge = require("./internal/_curry2")(function(l, r) {
							return _objectAssign({}, l, r);
						});
					module.exports = merge;
				},
				{ "./internal/_curry2": 18, "./internal/_objectAssign": 34 }
			],
			47: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						_isString = require("./internal/_isString"),
						nth = _curry2(function(offset, list) {
							var idx = offset < 0 ? list.length + offset : offset;
							return _isString(list) ? list.charAt(idx) : list[idx];
						});
					module.exports = nth;
				},
				{ "./internal/_curry2": 18, "./internal/_isString": 31 }
			],
			48: [
				function(require, module, exports) {
					var pair = require("./internal/_curry2")(function(fst, snd) {
						return [fst, snd];
					});
					module.exports = pair;
				},
				{ "./internal/_curry2": 18 }
			],
			49: [
				function(require, module, exports) {
					var path = require("./internal/_curry2")(function(paths, obj) {
						for (var val = obj, idx = 0; idx < paths.length; ) {
							if (null == val) return;
							(val = val[paths[idx]]), (idx += 1);
						}
						return val;
					});
					module.exports = path;
				},
				{ "./internal/_curry2": 18 }
			],
			50: [
				function(require, module, exports) {
					var _arity = require("./internal/_arity"),
						_pipe = require("./internal/_pipe"),
						reduce = require("./reduce"),
						tail = require("./tail");
					module.exports = function() {
						if (0 === arguments.length)
							throw new Error("pipe requires at least one argument");
						return _arity(
							arguments[0].length,
							reduce(_pipe, arguments[0], tail(arguments))
						);
					};
				},
				{
					"./internal/_arity": 13,
					"./internal/_pipe": 36,
					"./reduce": 54,
					"./tail": 56
				}
			],
			51: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						map = require("./map"),
						prop = require("./prop"),
						pluck = _curry2(function(p, list) {
							return map(prop(p), list);
						});
					module.exports = pluck;
				},
				{ "./internal/_curry2": 18, "./map": 44, "./prop": 53 }
			],
			52: [
				function(require, module, exports) {
					var _concat = require("./internal/_concat"),
						prepend = require("./internal/_curry2")(function(el, list) {
							return _concat([el], list);
						});
					module.exports = prepend;
				},
				{ "./internal/_concat": 16, "./internal/_curry2": 18 }
			],
			53: [
				function(require, module, exports) {
					var _curry2 = require("./internal/_curry2"),
						path = require("./path"),
						prop = _curry2(function(p, obj) {
							return path([p], obj);
						});
					module.exports = prop;
				},
				{ "./internal/_curry2": 18, "./path": 49 }
			],
			54: [
				function(require, module, exports) {
					var reduce = require("./internal/_curry3")(
						require("./internal/_reduce")
					);
					module.exports = reduce;
				},
				{ "./internal/_curry3": 19, "./internal/_reduce": 37 }
			],
			55: [
				function(require, module, exports) {
					var _checkForMethod = require("./internal/_checkForMethod"),
						slice = require("./internal/_curry3")(
							_checkForMethod("slice", function(fromIndex, toIndex, list) {
								return Array.prototype.slice.call(list, fromIndex, toIndex);
							})
						);
					module.exports = slice;
				},
				{ "./internal/_checkForMethod": 15, "./internal/_curry3": 19 }
			],
			56: [
				function(require, module, exports) {
					var _checkForMethod = require("./internal/_checkForMethod"),
						tail = require("./internal/_curry1")(
							_checkForMethod("tail", require("./slice")(1, 1 / 0))
						);
					module.exports = tail;
				},
				{
					"./internal/_checkForMethod": 15,
					"./internal/_curry1": 17,
					"./slice": 55
				}
			],
			57: [
				function(require, module, exports) {
					var type = require("./internal/_curry1")(function(val) {
						return null === val
							? "Null"
							: void 0 === val
							? "Undefined"
							: Object.prototype.toString.call(val).slice(8, -1);
					});
					module.exports = type;
				},
				{ "./internal/_curry1": 17 }
			],
			58: [
				function(require, module, exports) {
					var when = require("./internal/_curry3")(function(
						pred,
						whenTrueFn,
						x
					) {
						return pred(x) ? whenTrueFn(x) : x;
					});
					module.exports = when;
				},
				{ "./internal/_curry3": 19 }
			]
		},
		{},
		[1]
	)(1);
});
