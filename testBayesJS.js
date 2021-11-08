import * as ld from "./lib/bayes.js/distributions";
import * as mcmc from "./lib/bayes.js/mcmc";
import { plot, stack, clear } from 'nodeplotlib';

function tryExample()
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

(async () =>
{
	//tryExample();

	//Parameter values for analytic prior
	let n = 50;
	let successes = 10;
	let alphaPrior = 12;
	let betaPrior  = 12;
})();