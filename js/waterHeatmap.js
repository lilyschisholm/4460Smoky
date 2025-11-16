function drawWaterHeatmap(data, dispatcher) {
    data = data.filter(d => d.Characteristic_Name === "Acid Neutralizing Capacity (ANC)");

    data.forEach(d => {
        const match = d.Activity_ID.match(/\d{8}/);
        d.Year = match ? +match[0].slice(0, 4) : null;
        d.Result_Text = +d.Result_Text;
    });

    const grouped = d3.rollups(
        data.filter(d => d.Year && !isNaN(d.Result_Text)),
        v => d3.mean(v, d => d.Result_Text),
        d => d.Location_ID,
        d => d.Year
    );

    const flattened = [];
    grouped.forEach(([site, years]) => {
        years.forEach(([year, value]) => flattened.push({ site, year, value }));
    });

    const siteCounts = d3.rollups(flattened, v => v.length, d => d.site)
        .sort((a, b) => d3.descending(a[1], b[1]))
        .slice(0, 15)
        .map(d => d[0]);

    const filteredData = flattened.filter(d => siteCounts.includes(d.site));
    const years = Array.from(new Set(filteredData.map(d => d.year))).sort(d3.ascending);
    const sites = siteCounts;

    const margin = { top: 120, right: 100, bottom: 70, left: 120 };
	const width = document.getElementById('waterHeatmap').getBoundingClientRect().width - margin.left - margin.right;
	const height = document.getElementById('waterHeatmap').getBoundingClientRect().height - margin.top - margin.bottom;

    const svg = d3.select("#waterHeatmap svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(years).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(sites).range([0, height]).padding(0.05);
    const color = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(filteredData, d => d.value));

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("box-shadow", "0px 2px 6px rgba(0,0,0,0.1)")
        .style("z-index", 1000);

    svg.selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.site))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => d.value ? color(d.value) : "#eee")
        .on("mouseover", function (event, d) {
            tooltip.transition().style("opacity", 1);
            tooltip.html(`<strong>Site: ${(d.site).substring((d.site.length - 4), (d.site.length))}</strong><br>Year: ${d.year}</br>ANC: ${d.value ? d.value.toFixed(2) : "No data"} µeq/L`)
                .style("left", Math.min(event.pageX + 12, window.innerWidth - 150) + "px")
                .style("top", (event.pageY - 28) + "px");
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 1);
        })
        .on("mousemove", function (event, d) {
            tooltip.style("left", Math.min(event.pageX + 12, window.innerWidth - 180) + "px")
                   .style("top", (event.pageY - 28) + "px");
            tooltip.html(`<strong>Site: ${(d.site).substring((d.site.length - 4), (d.site.length))}</strong><br>Year: ${d.year}</br>ANC: ${d.value ? d.value.toFixed(2) : "No data"} µeq/L`);
        })
        .on("mouseout", function () {
            tooltip.transition().style("opacity", 0);
            d3.select(this).attr("stroke", "none");
        });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => d.replace("GRSM_F_", "Site ")))
        .selectAll("text")
        .style("font-size", "11px");

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
        .attr("y", -90)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Stream Site");


    const legendWidth = 220, legendHeight = 12;
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

    const valueExtent = d3.extent(filteredData, d => d.value);
    linearGradient.selectAll("stop")
        .data(d3.ticks(0, 1, 10))
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(valueExtent[0] + d * (valueExtent[1] - valueExtent[0])));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -75)  
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "600")
        .text("Acid Neutralizing Capacity (ANC) Across Sites and Years");

    svg.append("text")
        .attr("x", 0)
        .attr("y", -45)
        .text("ANC (µeq/L)")
        .style("font-size", "12px")
        .style("font-weight", "500");

    svg.append("rect")
        .attr("x", 0)
        .attr("y", -40)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    if (valueExtent && valueExtent[0] != null && valueExtent[1] != null) {
        const valueRange = valueExtent[1] - valueExtent[0];
        const fmt = Math.abs(valueRange) >= 10 ? d3.format('.0f') : d3.format('.2f');
        const legendScale = d3.scaleLinear()
            .domain([valueExtent[0], valueExtent[1]])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(fmt);

        svg.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(0, ${-40 + legendHeight})`)
            .call(legendAxis)
            .selectAll('text')
            .style('font-size', '10px');

        const axisY = -40 + legendHeight;
        svg.append('text')
            .attr('class', 'legend-min')
            .attr('x', -10)
            .attr('y', axisY - 3)
            .attr('text-anchor', 'start')
            .style('font-size', '11px')
            .text(`${fmt(valueExtent[0])}`);

        svg.append('text')
            .attr('class', 'legend-max')
            .attr('x', legendWidth + 25)
            .attr('y', axisY - 3)
            .attr('text-anchor', 'end')
            .style('font-size', '11px')
            .text(`${fmt(valueExtent[1])}`);
    }


    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

    svg.append("g")
        .attr("class", "x-brush")
        .call(brush);

    // Container-level hover support: some overlays (like the brush) may intercept
    // pointer events and prevent per-rect mouse handlers from firing. To ensure the
    // tooltip still appears, listen on the chart container and compute which cell
    // the pointer is over using the band scales.
    const container = d3.select('#waterHeatmap');
    let lastHighlighted = null;
    container.on('mousemove', function(event) {
        // pointer relative to the inner group (svg)
        const [mx, my] = d3.pointer(event, svg.node());
        // if outside chart area, hide
        if (mx < 0 || my < 0 || mx > width || my > height) {
            tooltip.style('opacity', 0);
            if (lastHighlighted) {
                lastHighlighted.attr('stroke', 'none');
                lastHighlighted = null;
            }
            return;
        }

        const col = Math.floor(mx / x.step());
        const row = Math.floor(my / y.step());
        if (col < 0 || col >= years.length || row < 0 || row >= sites.length) {
            tooltip.style('opacity', 0);
            if (lastHighlighted) {
                lastHighlighted.attr('stroke', 'none');
                lastHighlighted = null;
            }
            return;
        }

        const yearVal = years[col];
        const siteVal = sites[row];
        const d = filteredData.find(item => item.site === siteVal && item.year === yearVal);
        if (!d) {
            tooltip.style('opacity', 0);
            if (lastHighlighted) {
                lastHighlighted.attr('stroke', 'none');
                lastHighlighted = null;
            }
            return;
        }

        // update tooltip content & position
            tooltip.html(`<strong>Site: ${(d.site).substring((d.site.length - 4), (d.site.length))}</strong><br>Year: ${d.year}</br>ANC: ${d.value ? d.value.toFixed(2) : "No data"} µeq/L`)
            .style('left', Math.min(event.pageX + 12, window.innerWidth - 180) + 'px')
            .style('top', (event.pageY - 28) + 'px')
            .style('opacity', 1);

        // highlight the rect under the pointer
        const thisRect = svg.selectAll('rect').filter(rd => rd.site === d.site && rd.year === d.year);
        if (lastHighlighted && lastHighlighted.node() !== thisRect.node()) {
            lastHighlighted.attr('stroke', 'none');
        }
        thisRect.attr('stroke', '#333').attr('stroke-width', 1);
        lastHighlighted = thisRect;
    });

    container.on('mouseleave', function() {
        tooltip.style('opacity', 0);
        if (lastHighlighted) {
            lastHighlighted.attr('stroke', 'none');
            lastHighlighted = null;
        }
    });

    function brushed({ selection }) {
        if (!selection) {
            dispatcher.call("yearRangeSelected", null, null);
            return;
        }

        const [x0, x1] = selection;

        const bandWidth = x.step();
        const startIndex = Math.max(0, Math.floor(x0 / bandWidth));
        const endIndex = Math.min(years.length - 1, Math.floor(x1 / bandWidth));

        const startYear = years[startIndex];
        const endYear = years[endIndex];

        dispatcher.call("yearRangeSelected", null, [startYear, endYear]);
    }
}
