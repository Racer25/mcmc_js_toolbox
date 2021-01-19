function getMax(arr)
{
	return arr.reduce((max, v) => max >= v ? max : v, -Infinity);
}

function getMin(arr)
{
	return arr.reduce((max, v) => max <= v ? max : v, +Infinity);
}

export function generateArrayOfNumbers(startValue, stopValue, numPoints)
{
	let arr = [];
	let step = (stopValue - startValue) / (numPoints - 1);
	for (let i = 0; i < numPoints; i++)
	{
		arr.push(startValue + (step * i));
	}
	return arr;
}

export function createHistFromData(data, cumulative, normalization)
{
	let xMax = getMax(data);
	let xMin = getMin(data);
	let numberOfPins = Math.ceil(Math.sqrt(data.length));
	let width = (xMax - xMin) / numberOfPins;

	//Generate an array of arrays
	let hist = [...Array(numberOfPins).keys()]
	.map(index =>
	{
		let value = data.filter(point =>
		{
			if(index === 0)
			{
				return xMin <= point && point < xMin + width ;
			}
			if(cumulative)
			{
				return point < xMin + width * (index + 1);
			}
			return (xMin + width * index <= point) && (point < xMin + width * (index + 1));
		}).length ;

		if(normalization === "density")
		{
			value = value / (data.length * width);
		}
		else if(normalization === "classic")
		{
			value = value / data.length;
		}
		return [xMin + width * ( 2 * index + 1) / 2, value];
	});

	return hist;
}

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

export function findEstimatedCredibleInterval(credibility, cdfHist, type, trialsIfHDI)
{
	let cdfHistXs = cdfHist.map(([x, ])=> x);
	let cdfHistValues = cdfHist.map(([, value])=> value);

	let inferiorCredibilityBound;
	let superiorCredibilityBound;
	let inferiorVariableBound;
	let superiorVariableBound;
	if(type === "equalTailed")
	{
		inferiorCredibilityBound = (1.0 - credibility) / 2;
		superiorCredibilityBound = 1.0 - inferiorCredibilityBound;

		//Find index of value which is closer to inferiorConfProbBound
		let indexNearestToInferiorLimit = findNearestValueIndex(inferiorCredibilityBound, cdfHist.map(([, value])=> value));

		//Find index of value which is closer to superiorConfProbBound
		let indexNearestToSuperiorLimit = findNearestValueIndex(superiorCredibilityBound, cdfHist.map(([, value])=> value));

		//Find the corresponding values of variable
		inferiorVariableBound = cdfHist.map(([x, ])=> x)[indexNearestToInferiorLimit];
		superiorVariableBound = cdfHist.map(([x, ])=> x)[indexNearestToSuperiorLimit];
	}
	else if(type === "HDI")
	{
		if(Number.isNaN(trialsIfHDI))
		{
			throw new Error("Bad value for parameter trialsIfHDI: must be a number !");
		}
		//Bound initialization
		inferiorVariableBound = -Infinity;
		superiorVariableBound = +Infinity;

		let allInferiorBoundTested = generateArrayOfNumbers(0.0, 1.0 - credibility, trialsIfHDI);
		for(let currInferiorBound of allInferiorBoundTested)
		{
			let currSuperiorBound = credibility + currInferiorBound;

			//Find index of value which is closer to currInferiorBound
			let currIndexNearestToInferiorLimit = findNearestValueIndex(currInferiorBound, cdfHistValues);

			//Find index of value which is closer to currSuperiorBound
			let currIndexNearestToSuperiorLimit = findNearestValueIndex(currSuperiorBound, cdfHistValues);

			//Find the corresponding values of variable
			let currInferiorVariableBound = cdfHistXs[currIndexNearestToInferiorLimit];
			let currSuperiorVariableBound = cdfHistXs[currIndexNearestToSuperiorLimit];

			if(Math.abs(currSuperiorVariableBound - currInferiorVariableBound) < Math.abs(superiorVariableBound - inferiorVariableBound))
			{
				inferiorCredibilityBound = currInferiorBound;
				superiorCredibilityBound = currSuperiorBound;
				inferiorVariableBound = currInferiorVariableBound;
				superiorVariableBound = currSuperiorVariableBound;
			}
		}
	}
	else
	{
		throw new Error("Bad value for type parameter: only 'equalTailed' and 'HDI' are supported !");
	}

	return {
		credibility: credibility,
		type,
		inferiorCredibilityBound,
		superiorCredibilityBound,
		inferiorVariableBound,
		superiorVariableBound,
	};
}

export function findMedianImprovement(cdfHist)
{
	//Find index of value which is closer to inferiorConfProbBound
	let indexNearestToMedian = findNearestValueIndex(0.5, cdfHist.map(([, value])=> value));

	return cdfHist.map(([x, ])=> x)[indexNearestToMedian];
}