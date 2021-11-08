import * as TOOLS from "./tools";
import Beta from "@stdlib/stats/base/dists/beta/ctor";
import Binomial from "@stdlib/stats/base/dists/binomial/ctor";
import Normal from "@stdlib/stats/base/dists/normal/ctor";
import uniformGen from "@stdlib/random/base/uniform";
import normalGen from "@stdlib/random/base/normal";
import { plot, stack, clear } from 'nodeplotlib';

function quotientPosteriors(computePrior, computeLikelihood, currentParam, newParam)
{
	return  (computePrior(newParam) * computeLikelihood(newParam)) / (computePrior(currentParam) * computeLikelihood(currentParam)) ;
}

function adoptNewProb(currentParam, newParam, allAcceptedParams, indexIteration, burnProportion, iterations)
{
	if(indexIteration > burnProportion * iterations)
	{
		allAcceptedParams.push(newParam);
	}
	return newParam;
}

function computeLikelihoodUsingBinomialDist(param)
{
	let n = 50;
	let successes = 10;
	return computePDFOrPMF( new Binomial(n, param), successes);
}

function computePriorUsingBetaDist(param)
{
	let alphaPrior = 12;
	let betaPrior  = 12;
	return computePDFOrPMF( new Beta(alphaPrior, betaPrior), param);
}

function updateParamAndProposalDistUsingNormalDist(param)
{
	//Proposal distribution parameter
	let ecartType = 0.05;

	//Generate newParam
	let normalDistGenerator = normalGen.factory(param, ecartType);
	let newParam = normalDistGenerator();

	//Create proposal distribution for newParam
	let normalDistNewParam = new Normal(newParam, ecartType);
	let normalDistOldParam = new Normal(param, ecartType);
	return [newParam, normalDistNewParam, normalDistOldParam];
}

function computePDFOrPMF(dist, value)
{
	return dist.pmf !== undefined ? dist.pmf(value) : dist.pdf(value);
}

function MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING(computePrior, computeLikelihood, updateParamAndProposalDist, iterations, burnInProportion)
{
	console.log("MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING...");
	let uniformGenerator = uniformGen.factory(0.0, 1.0);

	let currentParam;
	let newParam;
	let oldProposalDistribution;
	let newProposalDistribution;
	let allAcceptedParams = [];

	for(let i = 0; i < iterations; i++)
	{
		//If first iteration, we generate currentParam
		if(currentParam === undefined)
		{
			currentParam = uniformGenerator();
		}

		[newParam, newProposalDistribution, oldProposalDistribution] = updateParamAndProposalDist(currentParam);

		if(newParam >= 0.0 && newParam <= 1.0)
		{
			//https://en.wikipedia.org/wiki/Metropolis%E2%80%93Hastings_algorithm#Step-by-step_instructions
			let a1 = quotientPosteriors(computePrior, computeLikelihood, currentParam, newParam);
			let a2 = computePDFOrPMF(newProposalDistribution, currentParam) / computePDFOrPMF(oldProposalDistribution, newParam);
			let a = a1 * a2;

			if(a >= 1)
			{
				//Adopt new prob with Burn in mecanism
				currentParam = adoptNewProb(currentParam, newParam, allAcceptedParams, i, burnInProportion, iterations);
			}
			else
			{
				//Prob a that the new value is chosen
				let randNumber = uniformGenerator();
				if(randNumber <= a)
				{
					//Adopt new prob with Burn in mecanism
					currentParam = adoptNewProb(currentParam, newParam, allAcceptedParams, i, burnInProportion, iterations);
				}
			}
		}
	}

	console.log("MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING finished")
	return allAcceptedParams;
}

//Main function in mcmc.js
(async () =>
{
	//Parameter values for analytic prior
	let n = 50;
	let successes = 10;
	let alphaPrior = 12;
	let betaPrior  = 12;

	//Parameter values for analytic posterior
	let alphaPost = successes + alphaPrior;
	let betaPost = n - successes + betaPrior;

	//Plot the analytic prior and posterior beta distributions
	let X = TOOLS.generateArrayOfNumbers(0.0, 1.0, 10000);

	//How many iterations of the Metropolis algorithm to carry out for MCMC
	let iterations = 2e6;
	let burnProportion = 0.05;
	let samplesUnknownDistribution = MCMC_POSTERIOR_ESTIMATION_METROPOLIS_HASTING(computePriorUsingBetaDist, computeLikelihoodUsingBinomialDist, updateParamAndProposalDistUsingNormalDist, iterations, burnProportion);

	//Plot
	let histPDFNodePlotLib = [
		[
			{
				x: X,
				y: X.map(x => new Beta(alphaPrior, betaPrior).pdf(x)),
				name: "Prior",
				type: "line",
			},
			{
				x: X,
				y: X.map(x => new Beta(alphaPost, betaPost).pdf(x)),
				name: "Posterior",
				type: "line",
			},
			{
				x: samplesUnknownDistribution,
				name: "Estimated posterior",
				type: "histogram",
				histnorm: 'probability density',
			}
			],
		{
			title: `PDF of prior, posterior and estimated posterior`,
			showlegend: true,
			xaxis:{title: "Probability"}
		}
	];
	stack(...histPDFNodePlotLib);
	plot();
	clear();

})();