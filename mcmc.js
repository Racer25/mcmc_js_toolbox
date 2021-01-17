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

function MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING(priorDistribution, likelihoodDistribution, iterations, successes, hist, progressive, plotToUpdate)
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
				if(progressive && allAcceptedParams.length % 100 === 0)
				{
					//Update data and plot
					hist = TOOLS.createHistFromData(allAcceptedParams, false, "density");
					updatePlot(plotToUpdate, hist);
				}
			}
		}
	}

	//Update data and plot
	hist = TOOLS.createHistFromData(allAcceptedParams, false,"density");
	updatePlot(plotToUpdate, hist);

	//Burn in
	//let burnProportion= 0.1;
	//allAcceptedParams = allAcceptedParams.filter((val, index, arr) => index > arr.length * burnProportion);
}

function updatePlot(plot, hist)
{
	plot.x = [plot.x[0], plot.x[1], hist.map(([x, ]) => x)];
	plot.y = [plot.y[0], plot.y[1], hist.map(([, density]) => density)];

	plot.render();
	plot.view();
}

//Main function in mcmc.js
(async () =>
{
	//Parameter values for prior
	let n = 50;
	let successes = 10;
	let alphaPrior = 12;
	let betaPrior  = 12;

	/*let n = 18198;
	let successes = n - 8;
	let alphaPrior = 0.700102;
	let betaPrior  = 1;*/

	//Parameter values for analytic posterior
	let alphaPost = successes + alphaPrior;
	let betaPost = n - successes + betaPrior;

	//Plot the analytic prior and posterior beta distributions
	let X = TOOLS.generateArrayOfNumbers(0.0, 1.0, 10000);
	let plot = new Plot(
		{
			x : [X, X, []],
			y : [X.map(x => (new Beta(alphaPrior, betaPrior)).pdf(x)),
				X.map(x => (new Beta(alphaPost, betaPost)).pdf(x)),
				[]],
			labels: ["Prior distribution", "Posterior distribution", "Estimated Posterior distribution"],
			xLabel: "Theta (coin fairness)",
			yLabel: "Density",
			lineStyle: ["--", "-", "none"],
			colors: ["blue", "green", "red"],
			description: "The prior and posterior belief distributions about the fairness Theta.",
			title: "The prior and posterior belief distributions about the fairness Theta.",
			symbols: ["none", "none", "closed-circle"],
			width: 1000,
			height: 562,
			xNumTicks: 10,
			yNumTicks: 10,
			renderFormat: "vdom",
			viewer: "browser",
			autoRender: false,
			autoView: false
		});
	plot.render();
	plot.view();


	//Define our prior believe giving the prior distribution density function (pdf)
	let priorDistribution = new Beta(alphaPrior, betaPrior);
	let likelihoodDistribution = new Binomial(n, 0.0);
	//How many iterations of the Metropolis algorithm to carry out for MCMC
	let iterations = 100000;
	let progressive = false;
	let hist = [];
	MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING(priorDistribution, likelihoodDistribution, iterations, successes, hist, progressive, plot);


	//View the plot in browser
	//plot.view("browser");

})();