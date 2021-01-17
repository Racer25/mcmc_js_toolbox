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