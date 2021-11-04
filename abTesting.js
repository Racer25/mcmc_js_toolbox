import betaGen from "@stdlib/random/base/beta";
import * as TOOLS from "./tools";
import Plot from "@stdlib/plot/ctor";
import { plot, stack, clear } from 'nodeplotlib';

(async ()=>
{
	let numberTrials = 120000;

	let alphaPrior = 3;
	let betaPrior = 7;

	let betaGeneratorA = betaGen.factory(36 + alphaPrior, 114 + betaPrior);
	let betaGeneratorB = betaGen.factory(50 + alphaPrior, 100 + betaPrior);

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
	let sumRatiosBonA = ratiosBonA.reduce((acc, curr) => acc + curr, 0);

	stack([
			{
				x: ratiosBonA,
				name: "Ratio B/A",
				type: "histogram",
				histnorm: 'probability density',
			}],
		{
			title: `PDF of Ratio B/A`,
			showlegend: true,
			xaxis:{title: "Ratio B/A"}
		}
	);

	stack([
			{
				x: ratiosBonA,
				name: "Ratio B/A",
				type: "histogram",
				histnorm: 'probability density',
				cumulative: {enabled: true}
			}],
		{
			title: `CDF of Ratio B/A`,
			showlegend: true,
			xaxis:{title: "Ratio B/A"}
		}
	);

	plot();

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
	let inter = TOOLS.findEstimatedCredibleInterval(0.95, hist2, "HDI", 100000);
	console.log(inter);

	//Expected value
	let expectedValue = (50/(50+100)) / (36/(36+114));
	console.log("Expected value", expectedValue);

	let median = TOOLS.findMedianImprovement(hist2);
	console.log("Median", median);

})();
