import { plot, stack, clear } from 'nodeplotlib';

function main()
{

    let numberFaces = 20;
    let faceY = 12;
    let probX = 0.5;
    let credibleIntervalProbFace12 = [0.45, 0.55];

    let X = [probX];
    let Y = [faceY];
    let credibleIntervalProbX = [credibleIntervalProbFace12];


    //Plot
    let testPlot = [
        [
            {
                x: X,
                y: Y,
                mode: 'markers',
                type: 'scatter',
                error_x: {
                    type: 'data',
                    symmetric: false,
                    array: credibleIntervalProbX.map(([down, high], index) => high - X[index]),
                    arrayminus: credibleIntervalProbX.map(([down, high], index) => X[index] - down)
                },
            }
        ],
        {
            title: `Posterior probability for each face of your dice`,
            showlegend: true,
            xaxis:{title: "Posterior probability distribution", range: [0, 1]},
            yaxis:{title: "Face of the dice", range: [0, numberFaces + 1]},
            shapes: [{
                type: 'line',
                x0: 1/numberFaces,
                y0: 0,
                x1: 1/numberFaces,
                yref: 'paper',
                y1: 1,
                line: {
                    color: 'red',
                    width: 1.5,
                    dash: 'dot'
                }
            }]
        }
    ];
    stack(...testPlot);
    plot();
    clear();

}

main();