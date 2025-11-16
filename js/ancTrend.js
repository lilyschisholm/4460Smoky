function drawANCtrend(data, dispatcher) {
    data = data.filter(d => d.Characteristic_Name === "Acid Neutralizing Capacity (ANC)");

    data.forEach(d => {
        const match = d.Activity_ID.match(/\d{8}/);
        d.Year = match ? +match[0].slice(0, 4) : null;
        d.Result_Text = +d.Result_Text;
    });

    data = data.filter(d => d.Year && !isNaN(d.Result_Text));

    const margin = { top: 60, right: 100, bottom: 70, left: 120 };
	const width = document.getElementById('ancTrendVis').getBoundingClientRect().width - margin.left - margin.right;
	const height = document.getElementById('ancTrendVis').getBoundingClientRect().height - margin.top - margin.bottom;

    const svg = d3.select("#ancTrendVis svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.mean))
        .curve(d3.curveMonotoneX);

    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    svg.append("g").attr("class", "y-axis");

    const path = svg.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#2ca25f")
        .attr("stroke-width", 2.5);

    const trendPath = svg.append("path")
        .attr("class", "trendline")
        .attr("fill", "none")
        .attr("stroke", "#4477aa")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "4 3");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 8px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Mean ANC (µeq/L)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Park-Wide ANC Trend (1993–2023)");


    function leastSquares(xSeries, ySeries) {
        const xMean = d3.mean(xSeries);
        const yMean = d3.mean(ySeries);
        const slope = d3.sum(xSeries.map((x, i) => (x - xMean) * (ySeries[i] - yMean))) /
            d3.sum(xSeries.map(x => Math.pow(x - xMean, 2)));
        const intercept = yMean - slope * xMean;
        return { slope, intercept };
    }

    function updateChart(filtered) {
        const yearlyMean = Array.from(
            d3.rollup(filtered, v => d3.mean(v, d => d.Result_Text), d => d.Year),
            ([year, mean]) => ({ year, mean })
        ).sort((a, b) => d3.ascending(a.year, b.year));

        if (yearlyMean.length === 0) return;

        const xDomain = d3.extent(yearlyMean, d => d.year);
        x.domain(xDomain);

        const yDomain = [0, d3.max(yearlyMean, d => d.mean) * 1.05];
        y.domain(yDomain);

        svg.select(".x-axis")
            .transition().duration(600)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

        svg.select(".y-axis")
            .transition().duration(600)
            .call(d3.axisLeft(y).ticks(6));

        path.datum(yearlyMean)
            .transition()
            .duration(700)
            .attr("d", line);

        const points = svg.selectAll("circle").data(yearlyMean, d => d.year);
        points.enter()
            .append("circle")
            .merge(points)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.mean))
            .attr("r", 3)
            .attr("fill", "#2ca25f");
        points.exit().remove();

        const { slope, intercept } = leastSquares(
            yearlyMean.map(d => d.year),
            yearlyMean.map(d => d.mean)
        );
        const regLine = [
            { year: xDomain[0], mean: intercept + slope * xDomain[0] },
            { year: xDomain[1], mean: intercept + slope * xDomain[1] }
        ];

        trendPath.datum(regLine)
            .transition()
            .duration(700)
            .attr("d", line);
    }

    updateChart(data);

    dispatcher.on("yearRangeSelected.ancTrend", years => {
        if (!years) {
            updateChart(data);
            return;
        }
        const [start, end] = years;
        const filtered = data.filter(d => d.Year >= start && d.Year <= end);
        updateChart(filtered);
    });
}
