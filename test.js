"use strict";

const chai = require("chai");
const parse = require("parse-svg-path");
const ramda = require("ramda");
const swiftvg = require("./index");

const expect = chai.expect;
const head = ramda.head;
const pipe = ramda.pipe;

const beginShape = swiftvg.beginShape;
const roundFloat = swiftvg.roundFloat;
const cgPoint = swiftvg.cgPoint;
const convertArc = swiftvg.convertArc;
const convertArcXY = swiftvg.convertArcXY;
const convertCCXY = swiftvg.convertCCXY;
const convertCubicCurve = swiftvg.convertCubicCurve;
const convertLine = swiftvg.convertLine;
const convertMove = swiftvg.convertMove;
const convertPoints = swiftvg.convertPoints;
const convertQCXY = swiftvg.convertQCXY;
const convertQuadraticCurve = swiftvg.convertQuadraticCurve;
const convertXY = swiftvg.convertXY;
const dispatch = swiftvg.dispatch;
const endShape = swiftvg.endShape;
const initialState = swiftvg.initialState;
const processPathData = swiftvg.processPathData;
const reducer = swiftvg.reducer;
const SET_ABSOLUTE = swiftvg.SET_ABSOLUTE;
const SET_RELATIVE = swiftvg.SET_RELATIVE;

describe("swiftvg state functions", () => {
	it("should return the state with no matching action", () => {
		const newState = reducer(initialState, "", {});

		expect(newState).to.deep.equal(initialState);
	});

	it("should set new absolute coordinates", () => {
		const newState = reducer(initialState, SET_ABSOLUTE, { x: 1, y: 2 });
		const newState2 = reducer(newState, SET_ABSOLUTE, { x: 3, y: 4 });

		expect(newState2).to.deep.equal({ x: 3, y: 4 });
	});

	it("should set new absolute coordinates when x is null", () => {
		const newState = reducer(initialState, SET_ABSOLUTE, { x: 1, y: 2 });
		const newState2 = reducer(newState, SET_ABSOLUTE, { x: null, y: 4 });

		expect(newState2).to.deep.equal({ x: 1, y: 4 });
	});

	it("should set new absolute coordinates when y is null", () => {
		const newState = reducer(initialState, SET_ABSOLUTE, { x: 1, y: 2 });
		const newState2 = reducer(newState, SET_ABSOLUTE, { x: 3, y: null });

		expect(newState2).to.deep.equal({ x: 3, y: 2 });
	});

	it("should set new relative coordinates", () => {
		const newState = reducer(initialState, SET_RELATIVE, { x: 1, y: 2 });
		const newState2 = reducer(newState, SET_RELATIVE, { x: 3, y: 4 });

		expect(newState2).to.deep.equal({ x: 4, y: 6 });
	});

	it("should set new absolute coordinates with number strings", () => {
		const newState = reducer(initialState, SET_ABSOLUTE, { x: "1", y: "2" });
		const newState2 = reducer(newState, SET_ABSOLUTE, { x: "3", y: "4" });

		expect(newState2).to.deep.equal({ x: 3, y: 4 });
	});

	it("should set new relative coordinates with number strings", () => {
		const newState = reducer(initialState, SET_RELATIVE, { x: "1", y: "2" });
		const newState2 = reducer(newState, SET_RELATIVE, { x: "3", y: "4" });

		expect(newState2).to.deep.equal({ x: 4, y: 6 });
	});

	it("should dispatch updates to state", () => {
		const absoluteState = dispatch(SET_ABSOLUTE, { x: 1, y: 2 });
		const relativeState = dispatch(SET_RELATIVE, { x: 2, y: 3 });

		expect(absoluteState).to.deep.equal({ x: 1, y: 2 });
		expect(relativeState).to.deep.equal({ x: 3, y: 5 });
	});
});

describe("swiftvg helper functions", () => {
	it("should round large numbers", () => {
		expect(roundFloat("-9.84503095e-15")).to.equal(0);
		expect(roundFloat("0.80")).to.equal(0.8);
		expect(roundFloat("0.084")).to.equal(0.08);
		expect(roundFloat("5")).to.equal(5);
		expect(roundFloat(-9.84503095e-15)).to.equal(0);
		expect(roundFloat(0.8)).to.equal(0.8);
		expect(roundFloat(0.084)).to.equal(0.08);
		expect(roundFloat(5)).to.equal(5);
	});

	it("should convert an array to x and y coordinates", () => {
		expect(convertXY([1, 2])).to.deep.equal({ x: 1, y: 2 });
		expect(convertXY(["1", "2"])).to.deep.equal({ x: 1, y: 2 });
	});

	it("should convert an array to cubic curve coordinates", () => {
		expect(convertCCXY([1, 2, 3, 4, 5, 6])).to.deep.equal({
			x: 5,
			y: 6,
			cp1x: 1,
			cp1y: 2,
			cp2x: 3,
			cp2y: 4
		});
		expect(convertCCXY(["1", "2", "3", "4", "5", "6"])).to.deep.equal({
			x: 5,
			y: 6,
			cp1x: 1,
			cp1y: 2,
			cp2x: 3,
			cp2y: 4
		});
	});

	it("should convert an array to quadratic curve coordinates", () => {
		expect(convertQCXY([1, 2, 3, 4])).to.deep.equal({
			x: 3,
			y: 4,
			cpx: 1,
			cpy: 2
		});
		expect(convertQCXY(["1", "2", "3", "4"])).to.deep.equal({
			x: 3,
			y: 4,
			cpx: 1,
			cpy: 2
		});
	});

	it("should convert an array to arc curve coordinates", () => {
		expect(convertArcXY([1, 2, 0, 0, 0, 6, 7])).to.deep.equal({
			x: 6,
			y: 7,
			rx: 1,
			ry: 2,
			cw: false
		});
		expect(convertArcXY(["1", "2", "0", "0", "0", "6", "7"])).to.deep.equal({
			x: 6,
			y: 7,
			rx: 1,
			ry: 2,
			cw: false
		});
	});
});

describe("Core Graphic functions", () => {
	const pointData = convertXY([1, 2]);
	const point = cgPoint(pointData);

	it("should produce a UIBezierPath initiator", () => {
		expect(beginShape()).to.equal("let shape = UIBezierPath()");
	});

	it("should produce a CGPoint", () => {
		expect(cgPoint(pointData)).to.equal("CGPoint(x: 1, y: 2)");
	});

	it("should produce a move call", () => {
		expect(convertMove(point)).to.equal(`shape.move(to: ${point})`);
	});

	it("should produce an addLine call", () => {
		expect(convertLine(point)).to.equal(`shape.addLine(to: ${point})`);
	});

	it("should produce an addCurve call for cubic curves", () => {
		const anchors = [1, 2];
		const controls1 = [3, 4];
		const controls2 = [5, 6];
		const curveData = convertCCXY([].concat(controls1, controls2, anchors));
		const convert = pipe(
			convertXY,
			cgPoint
		);
		const anchorsCP = convert(anchors);
		const control1CP = convert(controls1);
		const control2CP = convert(controls2);

		expect(convertCubicCurve(curveData)).to.equal(
			`shape.addCurve(to: ${anchorsCP}, controlPoint1: ${control1CP}, controlPoint2: ${control2CP})`
		);
	});

	it("should produce an addCurve call for quadratic curves", () => {
		const anchors = [1, 2];
		const controls = [3, 4];
		const curveData = convertQCXY([].concat(controls, anchors));
		const convert = pipe(
			convertXY,
			cgPoint
		);
		const anchorsCP = convert(anchors);
		const controlCP = convert(controls);

		expect(convertQuadraticCurve(curveData)).to.equal(
			`shape.addCurve(to: ${anchorsCP}, controlPoint: ${controlCP})`
		);
	});

	it("should produce an addArc call", () => {
		const center = [1, 2];
		const radius = [3, 4];
		const clockwise = [0];
		const arcData = convertArcXY([].concat(radius, [0, 0], clockwise, center));
		const convert = pipe(
			convertXY,
			cgPoint
		);
		const centerCP = convert(center);
		const radiusCP = convert(radius);

		expect(convertArc(arcData)).to.equal(
			`shape.addArc(withCenter: ${centerCP}, radius: ${radiusCP}, startAngle: 0, endAngle: 360, clockwise: ${Boolean(
				head(clockwise)
			)})`
		);
	});

	it("should return various calls based on the data", () => {
		expect(processPathData(head(parse("M37,17")))).to.include("move(");
		expect(processPathData(head(parse("h37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("H37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("v37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("V37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("l37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("L37,17")))).to.include("addLine(");
		expect(processPathData(head(parse("c27,17 37,17 37,17")))).to.include(
			"addCurve("
		);
		expect(processPathData(head(parse("C27,17 37,17 37,17")))).to.include(
			"addCurve("
		);
		expect(processPathData(head(parse("q27,17 37,17")))).to.include(
			"addCurve("
		);
		expect(processPathData(head(parse("Q27,17 37,17")))).to.include(
			"addCurve("
		);
		expect(processPathData(head(parse("A37,17 37 0,0 37,17")))).to.include(
			"addArc("
		);
		expect(processPathData(head(parse("Z")))).to.equal(endShape);
		expect(processPathData(["yolo"])).to.equal(
			`SVG parsing for yolo data isn't supported yet`
		);
	});

	it("should convert all the points to strings", () => {
		const points = convertPoints(parse("M37,17 L10,15 Z"));

		expect(points).to.be.an("array");
		expect(points).to.have.length(3);
	});

	it("should export the full swift code from a data string", () => {
		const points = swiftvg("M37,17 L10,15 Z");

		expect(points).to.be.an("array");
		expect(points).to.have.length(4);
	});
});
