import * as TOOLS from "./tools";
import Plot from "@stdlib/plot/ctor";
import Beta from "@stdlib/stats/base/dists/beta/ctor";
import Binomial from "@stdlib/stats/base/dists/binomial/ctor";
import uniformGen from "@stdlib/random/base/uniform";
import normalGen from "@stdlib/random/base/normal";

function quotientPosteriors(priorDistribution, likelihoodDistribution, currentParam, newParam, successes)
{
	likelihoodDistribution.p = currentParam;
	let likelihoodCurrent = likelihoodDistribution.pmf(successes);
	likelihoodDistribution.p = newParam;
	let likelihoodNew = likelihoodDistribution.pmf(successes);

	return (priorDistribution.pdf(newParam) * likelihoodNew) / (priorDistribution.pdf(currentParam) * likelihoodCurrent);
}

function MCMC_POSTERIOR_ESTIMATION(priorDistribution, likelihoodDistribution, iterations, successes)
{
	let uniformGenerator = uniformGen.factory(0.0, 1.0);

	let currentParam;
	let newParam;
	let allAcceptedParams = [];
	for(let i = 0; i < iterations; i++)
	{
		//If first iteration, we generate currentParam
		if(currentParam === undefined)
		{
			currentParam = uniformGenerator();
		}

		//Generate newParam
		let normalGenerator = normalGen.factory(currentParam, 0.01);
		newParam = normalGenerator();

		if(newParam >= 0.0 && newParam <= 1.0)
		{
			//Acceptance prob
			let acceptanceProb = Math.min(quotientPosteriors(priorDistribution, likelihoodDistribution, currentParam, newParam, successes), 1.0);

			//
			let randNumber = uniformGenerator();
			if(randNumber < acceptanceProb)
			{
				//Adopt new prob
				currentParam = newParam;
				allAcceptedParams.push(newParam);
			}
		}
	}

	//Burn in
	let burnProportion= 0.1;
	allAcceptedParams = allAcceptedParams.filter((val, index, arr) => index > arr.length * burnProportion);

	//Use allAcceptedParams to generate histogram
	//let numberOfPins = Math.floor(Math.sqrt(allAcceptedParams.length));
	let numberOfPins = Math.ceil(Math.sqrt(allAcceptedParams.length));
	let width = (1.0 - 0.0) / numberOfPins;

	//Generate an array of arrays
	let hist = [...Array(numberOfPins).keys()]
	.map(index =>
	{
		let value = allAcceptedParams.filter(param =>
		{
			if(index === 0)
			{
				return param <= width && param > 0.0;
			}
			return (param > width * index) && (param <= width * (index + 1));
		}).length / (allAcceptedParams.length * width);
		return [width * ( 2 * index + 1) / 2, value];
	});

	/*let meanNumberOfPoints = hist.map(([x, val]) => val).reduce((a, b) => a + b) / hist.length;

	hist = hist.map(([x, value]) =>
	{
		return [x, value / meanNumberOfPoints];
	});*/

	return hist;
}

//Main function in mcmc.js
(async () =>
{
	//Parameter values for prior
	let n = 50;
	let successes = 10;
	let alphaPrior = 12;
	let betaPrior  = 12;

	//Parameter values for analytic posterior
	let alphaPost = successes + alphaPrior;
	let betaPost = n - successes + betaPrior;

	//Define our prior believe giving the prior distribution density function (pdf)
	let priorDistribution = new Beta(alphaPrior, betaPrior);
	let likelihoodDistribution = new Binomial(n, 0.0);

	//How many iterations of the Metropolis algorithm to carry out for MCMC
	let iterations = 100000;

	let hist = MCMC_POSTERIOR_ESTIMATION(priorDistribution, likelihoodDistribution, iterations, successes);


	//Plot the analytic prior and posterior beta distributions
	let X = TOOLS.generateArrayOfNumbers(0.0, 1.0, 1000);
	let plot = new Plot(
		{
			x : [X, X, hist.map(([x, ]) => x)],
			y : [X.map(x => (new Beta(alphaPrior, betaPrior)).pdf(x)),
				X.map(x => (new Beta(alphaPost, betaPost)).pdf(x)),
				hist.map(([, density]) => density)],
			labels: ["Prior distribution", "Posterior distribution", "Estimated Posterior distribution"],
			xLabel: "Theta (coin fairness)",
			yLabel: "Density",
			lineStyle: ["--", "-", ":"],
			colors: ["blue", "green", "red"],
			description: "The prior and posterior belief distributions about the fairness Theta.",
			title: "The prior and posterior belief distributions about the fairness Theta.",
			//symbols: ['closed-circle', "open-circle"],
			width: 1000,
			height: 562,
			xNumTicks: 10,
			yNumTicks: 10
		});

	//View the plot in browser
	plot.view("browser");

})();