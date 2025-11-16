function createParksComparison() {

    const margin = {top: 50, right: 100, bottom: 100, left: 250};

	const width = document.getElementById('comparisonVis').getBoundingClientRect().width - margin.left - margin.right;
	const height = document.getElementById('comparisonVis').getBoundingClientRect().height - margin.top - margin.bottom;

    d3.select("#comparisonVis svg").html("");

    const svg = d3.select("#comparisonVis svg")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("./data/parksData.csv").then(function(data) {
        data.sort((a, b) => b.speciesTotal - a.speciesTotal);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.speciesTotal)])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.park))
            .range([0, height])
            .padding(0.1);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "middle");

        svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .attr("y", height + 40)
            .text("Number of Species");

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("text-anchor", "end");

        svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height/2)
            .text("National Park");

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14gitpx')
            .style('font-weight', '600')
            .text('Total Species Inventory for the Top Ten U.S. National Parks');

        const tooltip = d3.select("#comparisonVis")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("width", "400px");

        svg.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("y", d => y(d.park))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.speciesTotal))
            .attr("fill", "#69b3a2")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${d.park}</strong><br/>
                    Species Total: ${d.speciesTotal}<br/>
                    <em>${d.description}</em>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });
}

document.addEventListener('DOMContentLoaded', createParksComparison);