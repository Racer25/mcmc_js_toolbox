import betaGen from "@stdlib/random/base/beta";
import * as TOOLS from "./tools";
import Plot from "@stdlib/plot/ctor";

function findNearestValueIndex(value, values)
{
	return values
	.reduce((acc, curr, currIndex, arr) =>
	{
		if(Math.abs(curr - value) < Math.abs(arr[acc] - value))
		{
			acc = currIndex;
		}
		return acc;
	}, 0);
}

function findConfidenceInterval(confidence, cdfHist)
{
 	let inferiorConfProbBound = (1.0 - confidence) / 2;
 	let superiorConfProbBound = 1.0 - inferiorConfProbBound;

 	//Find index of value which is closer to inferiorConfProbBound
	let indexNearestToInferiorLimit = findNearestValueIndex(inferiorConfProbBound, cdfHist.map(([, value])=> value));

	//Find index of value which is closer to superiorConfProbBound
	let indexNearestToSuperiorLimit = findNearestValueIndex(superiorConfProbBound, cdfHist.map(([, value])=> value));

	let inferiorVariableBound = cdfHist.map(([x, ])=> x)[indexNearestToInferiorLimit];
	let superiorVariableBound = cdfHist.map(([x, ])=> x)[indexNearestToSuperiorLimit];

	let confidenceInterval = {
		confidence,
		inferiorConfProbBound,
		superiorConfProbBound,
		inferiorVariableBound,
		superiorVariableBound,
	};
	return confidenceInterval;
}

function findMedianImprovement(cdfHist)
{
	//Find index of value which is closer to inferiorConfProbBound
	let indexNearestToMedian = findNearestValueIndex(0.5, cdfHist.map(([, value])=> value));

	let medianVariable = cdfHist.map(([x, ])=> x)[indexNearestToMedian];

	return medianVariable;
}

(async ()=>
{
	let numberTrials = 120000;

	/*let alphaPrior = 3;
	let betaPrior = 7;

	let betaGeneratorA = betaGen.factory(36 + alphaPrior, 114 + betaPrior);
	let betaGeneratorB = betaGen.factory(50 + alphaPrior, 100 + betaPrior);*/

	let alphaPrior = 0.700102;
	let betaPrior = 1;
	let nA = 18325;
	let nB = 18198;
	let failuresA = 162
	let failuresB = 8;

	let betaGeneratorA = betaGen.factory(nA - failuresA + alphaPrior, failuresA + betaPrior);
	let betaGeneratorB = betaGen.factory(nB - failuresB + alphaPrior, failuresB + betaPrior);

	let samplesA = [];
	let samplesB = [];

	//Samples gathering
	for(let i = 0; i< numberTrials; i++)
	{
		samplesA.push(betaGeneratorA());
		samplesB.push(betaGeneratorB());
	}

	//Sample analysis of superiority of B on A
	let pValue = samplesB.reduce((acc, curr, currIndex) =>
	{
		if(samplesB[currIndex] > samplesA[currIndex])
		{
			acc += 1.0;
		}
		return acc;
	}, 0.0) / numberTrials;

	console.log("pValue", pValue);

	//Compute Ratio B/A
	let ratiosBonA = samplesB.map((sampleB, index) => sampleB / samplesA[index]);

	let hist1 = TOOLS.createHistFromData(ratiosBonA, false, "none");

	//View histogram 1
	let plot1 = new Plot(
		{
			x : [hist1.map(([x,])=> x)],
			y : [hist1.map(([, value])=> value)],
			labels: ["SampleB / Sample A"],
			xLabel: "Ratio",
			yLabel: "Frequency",
			lineStyle: ["none"],
			colors: ["blue"],
			description: "This histogram describes all the possible differences between A and B",
			title: "This histogram describes all the possible differences between A and B",
			symbols: ["closed-circle"],
			width: 1000,
			height: 562,
			xNumTicks: 10,
			yNumTicks: 10,
			renderFormat: "vdom",
			viewer: "browser",
			autoRender: false,
			autoView: false
		});
	plot1.render();
	plot1.view();

	//View histogram 2
	let hist2 = TOOLS.createHistFromData(ratiosBonA, true, "classic");
	let plot2 = new Plot(
		{
			x : [hist2.map(([x,])=> x)],
			y : [hist2.map(([, value])=> value)],
			labels: ["SampleB / Sample A (cumulative)"],
			xLabel: "Ratio",
			yLabel: "Cumulative Probability",
			lineStyle: ["--"],
			colors: ["red"],
			description: "CDF of samplesB/samplesA",
			title: "CDF of samplesB/samplesA",
			symbols: ["none"],
			width: 1000,
			height: 562,
			xNumTicks: 10,
			yNumTicks: 10,
			renderFormat: "vdom",
			viewer: "browser",
			autoRender: false,
			autoView: false
		});
	plot2.render();
	plot2.view();

	//View histogram 2 but quantile version
	let plot3 = new Plot(
		{
			y : [hist2.map(([x,])=> x)],
			x : [hist2.map(([, value])=> value)],
			labels: ["SampleB / Sample A (quantile)"],
			xLabel: "Cumulative Probability",
			yLabel: "Ratio",
			lineStyle: ["--"],
			colors: ["green"],
			description: "Quantile of samplesA/samplesB",
			title: "Quantile of samplesA/samplesB",
			symbols: ["none"],
			width: 1000,
			height: 562,
			xNumTicks: 10,
			yNumTicks: 10,
			renderFormat: "vdom",
			viewer: "browser",
			autoRender: false,
			autoView: false
		});
	plot3.render();
	plot3.view();

	//Confidence interval test
	let inter = findConfidenceInterval(0.95, hist2);
	console.log(inter);

	//Median
	let median = findMedianImprovement(hist2);
	console.log("median", median);
})();
