import betaGen from "@stdlib/random/base/beta";
import * as TOOLS from "./tools";
import Plot from "@stdlib/plot/ctor";

function efficacy(probCovVaccine, probCovPlacebo)
{
	return  100 * (1.0 - probCovVaccine / probCovPlacebo);
}

//Main function
(async () =>
{
	//Prior parameter (Beta distribution)
	let alphaPrior = 0.700102;
	let betaPrior  = 1;

	//Parameter used by likelihood...
	let nVaccine = 18198;
	let nPlacebo = 18325;
	let covid19casesVaccine = 8;
	let covid19casesPlacebo = 162;

	//Parameter used by likelihood...
	/*let nVaccine = 19965;
	let nPlacebo = 20172;
	let covid19casesVaccine = 9;
	let covid19casesPlacebo = 169;*/


	//Posterior distribution generator (not scaled??)
	let betaGeneratorPlacebo = betaGen.factory(covid19casesPlacebo + alphaPrior, nPlacebo - covid19casesPlacebo + betaPrior);
	let betaGeneratorVaccine = betaGen.factory(covid19casesVaccine + alphaPrior, nVaccine - covid19casesVaccine + betaPrior);

	/*
	let testBetaBinPlacebo = betaBinomial.pdf(nPlacebo - covid19casesPlacebo, nPlacebo, alphaPrior, betaPrior);
	let testBetaBinVaccine= betaBinomial.pdf(nVaccine - covid19casesVaccine, nVaccine, alphaPrior, betaPrior);
	console.log("testBetaBinPlacebo", testBetaBinPlacebo);
	console.log("testBetaBinVaccine", testBetaBinVaccine);*/

	let numberTrials = 2000000;
	let samplesPlacebo = [];
	let samplesVaccine = [];

	//Samples gathering
	for(let i = 0; i< numberTrials; i++)
	{
		samplesPlacebo.push(betaGeneratorPlacebo());
		samplesVaccine.push(betaGeneratorVaccine());
	}

	//Compute efficacy
	let samplesEfficacy = samplesPlacebo.map((samplePlacebo, index) => efficacy(samplesVaccine[index], samplePlacebo));

	let histPDF = TOOLS.createHistFromData(samplesEfficacy, false, "classic");

	//View histogram 1
	let plotPDF = new Plot(
		{
			x : [histPDF.map(([x,])=> x)],
			y : [histPDF.map(([, value])=> value)],
			labels: ["Vaccine Efficacy Distribution"],
			xLabel: "efficacy",
			yLabel: "Density",
			lineStyle: ["none"],
			colors: ["blue"],
			description: "This histogram describes the vaccine efficacy PDF",
			title: "This histogram describes the vaccine efficacy PDF",
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
	plotPDF.render();
	plotPDF.view();

	let histCDF = TOOLS.createHistFromData(samplesEfficacy, true, "classic");

	//View histogram 1
	let plotCDF = new Plot(
		{
			x : [histCDF.map(([x,])=> x)],
			y : [histCDF.map(([, value])=> value)],
			labels: ["Vaccine efficacy Cumulative Distribution"],
			xLabel: "efficacy",
			yLabel: "Density",
			lineStyle: ["none"],
			colors: ["blue"],
			description: "This histogram describes the vaccine efficacy CDF",
			title: "This histogram describes the vaccine efficacy CDF",
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
	plotCDF.render();
	plotCDF.view();

	//Confidence interval test
	try
	{
		let inter = TOOLS.findEstimatedCredibleInterval(0.95, histCDF, "equalTailed", 10000);
		console.log(inter);
	}
	catch(e)
	{
		console.error(e);
	}

	//Expected value
	let expectedValue = efficacy(covid19casesVaccine / nVaccine, covid19casesPlacebo / nPlacebo);
	console.log("Expected value", expectedValue);

	//New Expected value
	let newExpectedValue = efficacy(
		(covid19casesVaccine + alphaPrior) / (alphaPrior + nVaccine + betaPrior),
		(covid19casesPlacebo + alphaPrior) / (alphaPrior + nPlacebo + betaPrior)
	);
	console.log("New Expected value", newExpectedValue);

	let median = TOOLS.findMedianImprovement(histCDF);
	console.log("Median", median);

	let mode = TOOLS.modeEstimation(histPDF);
	console.log("Mode", mode);

	let mean = TOOLS.meanEstimation(histPDF);
	console.log("Mean", mean);

})();