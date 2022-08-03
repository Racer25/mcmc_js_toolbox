import * as ld from "./lib/bayes.js/distributions";
import * as mcmc from "./lib/bayes.js/mcmc";
import { plot, stack, clear } from 'nodeplotlib';
import * as TOOLS from "./tools";
import Beta from "@stdlib/stats/base/dists/beta/ctor";

function tryHelloWorldExample()
{
	// The heights of the last ten American presidents in cm, from Kennedy to Obama
	let data = [183, 192, 182, 183, 177, 185, 188, 188, 182, 185];

	let params =
		{
			mu: {type: "real"},
			sigma: {type: "real", lower: 0}
		};

	let log_post = function(state, data)
	{
		let log_post = 0;
		// Priors
		log_post += ld.norm(state.mu, 0, 100);
		log_post += ld.unif(state.sigma, 0, 100);
		// Likelihood
		for(let i = 0; i < data.length; i++) {
			log_post += ld.norm(data[i], state.mu, state.sigma);
		}
		return log_post;
	};

	// Initializing the sampler
	let sampler =  new mcmc.AmwgSampler(params, log_post, data);

	// Burning some samples to the MCMC gods and sampling 5000 draws.
	sampler.burn(1000);
	let samples = sampler.sample(5000);

	console.log(samples);

	//Plot
	let histMu = [
		[
			{
				x: samples.mu,
				name: "Estimated mu",
				type: "histogram",
				histnorm: 'probability density',
			}
		],
		{
			title: `PDF of mu`,
			showlegend: true,
			xaxis:{title: "mu"}
		}
	];
	let histSigma = [
		[
			{
				x: samples.sigma,
				name: "Estimated sigma",
				type: "histogram",
				histnorm: 'probability density',
			}
		],
		{
			title: `PDF Sigma`,
			showlegend: true,
			xaxis:{title: "Sigma"}
		}
	];
	stack(...histMu);
	stack(...histSigma);
	plot();
	clear();
}

function tryNewExample()
{
	//Parameter values for analytic prior
	let n = 50;
	let successes = 10;
	let alphaPrior = 12;
	let betaPrior  = 12;

	//Parameter values for analytic posterior
	let alphaPost = successes + alphaPrior;
	let betaPost = n - successes + betaPrior;

	let params =
		{
			prob: {type: "real", lower: 0, upper: 1},
		};

	function log_post(state)
	{
		let log_post = 0;

		//Prior parameter (Beta distribution)
		log_post += ld.beta(state.prob, alphaPrior, betaPrior);

		//Parameter used by likelihood...
		log_post += ld.binom(successes, n, state.prob);

		return log_post;
	}

	// Initializing the sampler
	let sampler =  new mcmc.AmwgSampler(params, log_post);

	// Burning some samples to the MCMC gods and sampling 5000 draws.
	sampler.burn(1000);

	let samples = sampler.sample(2e6);

	//Plot the analytic prior and posterior beta distributions
	let X = TOOLS.generateArrayOfNumbers(0.0, 1.0, 10000);

	//Plot
	let histProb = [
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
				x: samples.prob,
				name: "Estimated prob",
				type: "histogram",
				histnorm: 'probability density',
			}
		],
		{
			title: `PDF of prob`,
			showlegend: true,
			xaxis:{title: "prop"}
		}
	];
	stack(...histProb);
	plot();
	clear();
}

function efficacy(probCovVaccine, probCovPlacebo)
{
	return  100 * (1.0 - probCovVaccine / probCovPlacebo);
}

function tryVaccineExample1()
{
	//Parameter values for analytic prior
	//Prior parameter (Beta distribution)
	let alphaPrior = 0.700102;
	let betaPrior  = 1;

	//Parameter used by likelihood...
	let nVaccine = 18198;
	let nPlacebo = 18325;
	let covid19casesVaccine = 8;
	let covid19casesPlacebo = 162;

	let alphaLikelihoodVaccine = covid19casesVaccine;
	let betaLikelihoodVaccine = nVaccine - covid19casesVaccine;
	let alphaLikelihoodPlacebo = covid19casesPlacebo;
	let betaLikelihoodPlacebo = nPlacebo - covid19casesPlacebo;

	let paramsPlacebo =
		{
			probCovPlacebo: {type: "real", lower: 0, upper: 1},
		};

	let paramsVaccine =
		{
			probCovVaccine: {type: "real", lower: 0, upper: 1},
		};

	function log_post_placebo(state)
	{
		let log_post_placebo = 0;

		//Prior parameter (Beta distribution)
		log_post_placebo += ld.beta(state.probCovPlacebo, alphaPrior, betaPrior);

		//Parameter used by likelihood...
		log_post_placebo += ld.binom(covid19casesPlacebo, nPlacebo, state.probCovPlacebo);

		return log_post_placebo;
	}

	function log_post_vaccine(state)
	{
		let log_post_vaccine = 0;

		//Prior parameter (Beta distribution)
		log_post_vaccine += ld.beta(state.probCovVaccine, alphaPrior, betaPrior);

		//Parameter used by likelihood...
		log_post_vaccine += ld.binom(covid19casesVaccine, nVaccine, state.probCovVaccine);

		return log_post_vaccine;
	}

	// Initializing the sampler
	let samplerPlacebo =  new mcmc.AmwgSampler(paramsPlacebo, log_post_placebo);
	// Initializing the sampler
	let samplerVaccine =  new mcmc.AmwgSampler(paramsVaccine, log_post_vaccine);

	// Burning some samples to the MCMC gods and sampling 5000 draws.
	samplerPlacebo.burn(1000);
	// Burning some samples to the MCMC gods and sampling 5000 draws.
	samplerVaccine.burn(1000);

	let numSamples = 2e6;
	let samplesPlacebo = samplerPlacebo.sample(numSamples);
	let samplesVaccine = samplerVaccine.sample(numSamples);

	//Compute efficacy
	let samplesEfficacy = samplesPlacebo.probCovPlacebo.map((samplePlacebo, index) => efficacy(samplesVaccine.probCovVaccine[index], samplePlacebo));

	//Plot the analytic prior and posterior beta distributions
	let X = TOOLS.generateArrayOfNumbers(0.0, 1.0, 10000);

	//Plot
	let histProb = [
		[
			{
				x: samplesEfficacy,
				name: "Estimated Efficacy",
				type: "histogram",
				histnorm: 'probability density',
			}
		],
		{
			title: `PDF of efficacy`,
			showlegend: true,
			xaxis:{title: "prop"}
		}
	];

	let histProbCum = [
		[
			{
				x: samplesEfficacy,
				name: "Estimated Efficacy",
				type: "histogram",
				histnorm: 'probability density',
				cumulative: {enabled: true},
			}
		],
		{
			title: `CDF of efficacy`,
			showlegend: true,
			xaxis:{title: "prop"}
		}
	];
	stack(...histProb);
	stack(...histProbCum);
	plot();
	clear();
}

function tryVaccineExample2()
{
	//Parameter values for analytic prior
	//Prior parameter (Beta distribution)
	let alphaPrior = 0.700102;
	let betaPrior  = 1;

	//Parameter used by likelihood...
	let nVaccine = 18198;
	let nPlacebo = 18325;
	let covid19casesVaccine = 8;
	let covid19casesPlacebo = 162;

	let params =
		{
			probCovVaccination: {type: "real", lower: 0, upper: 1},
			probCovPlacebo: {type: "real", lower: 0, upper: 1},
			alphaEfficacy: {type: "int"},
			betaEfficacy: {type: "int"},
		};


	function log_post(state)
	{
		let log_post = 0;

		//Prior parameter (Beta distribution)
		log_post += ld.beta(state.probCovVaccine, alphaPrior, betaPrior);
		log_post += ld.beta(state.probCovPlacebo, alphaPrior, betaPrior);
		log_post += ld.beta(state.probCovVaccine, covid19casesVaccine, nVaccine - covid19casesVaccine);
		log_post += ld.beta(state.probCovPlacebo, covid19casesPlacebo, nPlacebo - covid19casesPlacebo);

		let test = efficacy(state.probCovVaccine, state.probCovPlacebo);

		//Parameter used by likelihood...
		log_post += ld.beta(test, state.alphaEfficacy, state.betaEfficacy);

		return log_post;
	}

	// Initializing the sampler
	let sampler =  new mcmc.AmwgSampler(params, log_post);

	// Burning some samples to the MCMC gods and sampling 5000 draws.
	sampler.burn(1000);

	let numSamples = 2e5;
	let samples = sampler.sample(numSamples);

	//Plot
	let histProb = [
		[
			{
				x: samples,
				name: "Estimated Efficacy",
				type: "histogram",
				histnorm: 'probability density',
			}
		],
		{
			title: `PDF of efficacy`,
			showlegend: true,
			xaxis:{title: "prop"}
		}
	];

	let histProbCum = [
		[
			{
				x: samples,
				name: "Estimated Efficacy",
				type: "histogram",
				histnorm: 'probability density',
				cumulative: {enabled: true},
			}
		],
		{
			title: `CDF of efficacy`,
			showlegend: true,
			xaxis:{title: "prop"}
		}
	];
	stack(...histProb);
	stack(...histProbCum);
	plot();
	clear();
}

(async () =>
{
	//tryHelloWorldExample();
	//tryNewExample();
	//tryVaccineExample1();
	tryVaccineExample2();

})();