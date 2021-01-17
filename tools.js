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
	let xMax = Math.max(...data);
	let xMin = Math.min(...data);
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