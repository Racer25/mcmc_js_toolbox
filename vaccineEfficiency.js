import betaSampler from "@stdlib/random/base/beta";
import * as TOOLS from "./tools";
import { plot, stack, clear } from 'nodeplotlib';

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
	let betaGeneratorPlacebo = betaSampler.factory(covid19casesPlacebo + alphaPrior, nPlacebo - covid19casesPlacebo + betaPrior);
	let betaGeneratorVaccine = betaSampler.factory(covid19casesVaccine + alphaPrior, nVaccine - covid19casesVaccine + betaPrior);

	let numberTrials = 100_000;
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

	//Plots
	let histPDFNodePlotLib = [
		[
		{
			x: samplesEfficacy,
			name: "Efficacy of vaccine",
			type: "histogram",
			histnorm: 'probability density',
		}],
		{
			title: `PDF of vaccine efficacy`,
			showlegend: true,
			xaxis:{title: "Vaccine efficacy"}
		}
		];
	let histCDFNodePlotLib = [
		[
		{
			x: samplesEfficacy,
			name: "Efficacy of vaccine",
			type: "histogram",
			cumulative: {enabled: true},
			histnorm: 'probability density',
		}],
		{
			title: `CDF of vaccine efficacy`,
			showlegend: true,
			xaxis:{title: "Vaccine efficacy"}
		}
		];
	stack(...histPDFNodePlotLib);
	stack(...histCDFNodePlotLib);
	plot();

	let histPDF = TOOLS.createHistFromData(samplesEfficacy, false, "classic");
	let histCDF = TOOLS.createHistFromData(samplesEfficacy, true, "classic");

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