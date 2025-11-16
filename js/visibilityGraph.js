let svg, g, xScale, yScale, xAxis, yAxis, line, width, height, margin;
let hoverOverlay = null;
let focusGroup = null;
let tooltipDiv = null;
let focusLine = null; // vertical highlight line
const bisectByDate = d3.bisector(d => d.date).left;
const formatTooltipTime = d3.timeFormat("%b, %Y");
let currentVisData = [];
let baseVisibilityData = [];
const MIN_DATE = new Date(2000, 0, 1);
let showVisibilityLine = false; 

const PM_OPACITY_MIN = 0.12; 
const PM_OPACITY_MAX = 0.95;  
const PM_OPACITY_EXP = 0.6;
const USE_FIXED_PM_DOMAIN = true;
const PM_FIXED_DOMAIN = [0, 35];

function drawVisibilityGraph(data, svgSelector) {
    initGraph(svgSelector);
    baseVisibilityData = data || [];
    const wrangledData = wrangleData(baseVisibilityData);
    updateGraph(wrangledData);
}

function initGraph(svgSelector) {
    margin = {top: 150, right: 450, bottom: 50, left: 20};
    svg = d3.select(svgSelector);
    const container = document.querySelector(svgSelector);
	width = document.getElementById('comparisonVis').getBoundingClientRect().width - margin.left - margin.right;
	height = document.getElementById('comparisonVis').getBoundingClientRect().height - margin.top - margin.bottom;

    svg.attr("width", container.clientWidth)
    .attr("height", container.clientHeight);

    g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left + width / 2)
        .attr("y", Math.max(20, margin.top * 0.4))
        .attr("text-anchor", "middle")
        .attr("font-weight", 600)
        .text("Improvements on Air Quality Affecting Visitation Based on Particulate Matter");

    xScale = d3.scaleTime().range([0, width]);
    yScale = d3.scaleLinear().range([height, 0]);

    xAxis = g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x-axis");

    yAxis = g.append("g")
        .attr("class", "y-axis");

    line = d3.line()
        .defined(d => Number.isFinite(d.pm))
        .x(d => xScale(d.date))
        .y(d => yScale(d.pm));

    g.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    svg.append("text")
        .attr("class", "x-axis-title")
        .attr("x", margin.left + width / 2)
        .attr("y", margin.top + height + Math.max(18, margin.bottom * 0.75))
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text("Year");

    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("transform", `translate(${margin.right}, ${margin.top + height / 2}) rotate(90)`)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text("Visitors");


    hoverOverlay = g.append("rect")
        .attr("class", "hover-overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseenter", onMouseEnter)
        .on("mousemove", onMouseMove)
        .on("mouseleave", onMouseLeave);

    focusGroup = g.append("g")
        .attr("class", "vis-focus")
        .style("display", "none");

    focusGroup.append("line")
        .attr("class", "focus-xline")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.6);

    // vertical focus line (aligned in g's coordinate space)
    focusLine = g.append("line")
        .attr("class", "focus-line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("display", "none")
        .attr("pointer-events", "none");


    if (!tooltipDiv) {
        tooltipDiv = d3.select("body").append("div")
            .attr("class", "visibility-tooltip")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("background", "rgba(0,0,0,0.75)")
            .style("color", "#fff")
            .style("padding", "6px 8px")
            .style("border-radius", "4px")
            .style("font", "12px sans-serif")
            .style("display", "none");
    }
}

function wrangleData(data) {
    const hasVisits = Array.isArray(visitsOverlayData) && visitsOverlayData.length > 0;
    const visitsMax = hasVisits ? d3.max(visitsOverlayData, d => d.date) : null;
    return (data || []).filter(d => {
        if (!d.date || !Number.isFinite(d.pm)) return false;
        if (d.date < MIN_DATE) return false;
        if (visitsMax && d.date > visitsMax) return false; 
        return true;
    });
}

function updateGraph(data) {
    currentVisData = data || [];
    if (!data || data.length === 0) {
        g.select(".line").attr("d", null);
        return;
    }

    xScale.domain(d3.extent(data, d => d.date));
    yScale.domain([0, d3.max(data, d => d.pm)]);

    xAxis.transition().duration(500).call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")));
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));

    g.select(".line")
        .datum(data)
        .transition()
        .duration(500)
        .attr("d", line);
    const visPath = g.select(".line");
    visPath.style("display", showVisibilityLine ? null : "none");
    if (yAxis) yAxis.style("display", showVisibilityLine ? null : "none");
    if (typeof renderVisitsOverlay === 'function') {
        renderVisitsOverlay();
    }
}

function onMouseEnter() {
    if (!currentVisData || currentVisData.length === 0) return;
    focusGroup.style("display", null);
    if (focusLine) focusLine.style("display", null);
    if (tooltipDiv) tooltipDiv.style("display", "block");
}

function onMouseMove(event) {
    if (!currentVisData || currentVisData.length === 0) return;
    const [mx] = d3.pointer(event, g.node());
    const x0 = xScale.invert(mx);
    let i = bisectByDate(currentVisData, x0);
    i = Math.max(1, Math.min(i, currentVisData.length - 1));
    
    const cx = xScale(x0);
    const cy = yScale(currentVisData[i].pm);

    // position vertical focus line and dot in g coordinates
    if (focusLine) {
        focusLine.attr('x1', cx).attr('x2', cx);
    }

    if (tooltipDiv) {
        const bodyOffset = 12;
        // show the data-point's actual timestamp rather than the mouse-inverted time
        const dp = currentVisData[i];
        const dateToShow = dp && dp.date ? dp.date : x0;
        const pmText = (dp && Number.isFinite(dp.pm)) ? dp.pm.toFixed(1) : 'n/a';
        tooltipDiv
            .html(`${formatTooltipTime(dateToShow)}<br/>Particulate Matter: <b>${pmText} PM2.5(µg/m³)</b>`)
            .style("left", (event.pageX + bodyOffset) + "px")
            .style("top", (event.pageY + bodyOffset) + "px");
    }
}

function onMouseLeave() {
    focusGroup.style("display", "none");
    if (tooltipDiv) tooltipDiv.style("display", "none");
    if (focusLine) focusLine.style("display", "none");
}

let visitsOverlayData = null;
let yScaleVisits = null;
let yAxisVisits = null;

function ensureVisitsScales() {
    if (!yScaleVisits) {
        yScaleVisits = d3.scaleLinear().range([height, 0]);
    }
    if (!yAxisVisits) {
        yAxisVisits = g.append("g")
            .attr("class", "y-axis visits-axis")
            .attr("transform", `translate(${width},0)`);
    }
}

function renderVisitsOverlay() {
    if (!visitsOverlayData || !xScale) return;
    ensureVisitsScales();

    const [xMin, xMax] = xScale.domain();
    const data = visitsOverlayData
        .filter(d => d.date && Number.isFinite(d.visits))
        .filter(d => d.date >= Math.max(MIN_DATE, xMin) && d.date <= xMax);
    if (!data.length) return;

    yScaleVisits.domain([0, d3.max(data, d => d.visits)]).nice();
    yAxisVisits.transition().duration(500).call(d3.axisRight(yScaleVisits));

    const areaVisits = d3.area()
        .defined(d => Number.isFinite(d.visits))
        .x(d => xScale(d.date))
        .y0(() => yScaleVisits(0))
        .y1(d => yScaleVisits(d.visits));

    const fillRef = updateVisitsOpacityGradient();

    const sel = g.selectAll(".visits-area").data([data])
        .join("path")
        .attr("class", "visits-area")
        .attr("fill", fillRef || "darkgreen")
        .attr("opacity", fillRef ? null : 1)
        .attr("stroke", "none")
        .on("mouseenter", onMouseEnter)
        .on("mousemove", onMouseMove)
        .on("mouseleave", onMouseLeave)
        .transition()
        .duration(500)
        .attr("d", areaVisits);

    const lineVisitsOutline = d3.line()
        .defined(d => Number.isFinite(d.visits))
        .x(d => xScale(d.date))
        .y(d => yScaleVisits(d.visits));

    g.selectAll(".visits-area-outline").data([data])
        .join("path")
        .attr("class", "visits-area-outline")
        .attr("fill", "none")
        .attr("stroke", "darkgreen")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9)
        .transition()
        .duration(500)
        .attr("d", lineVisitsOutline);
}

function updateVisitsOpacityGradient() {
    const vis = currentVisData || [];
    if (!vis.length) return null;
    const vals = vis.map(d => d.pm).filter(v => Number.isFinite(v));
    if (!vals.length) return null;

    const PM_LINEAR_MAX = 35; 
    const opacityFromPM = (pm) => {
        const t = Math.max(0, Math.min(1, pm / PM_LINEAR_MAX));
        return PM_OPACITY_MIN + t * (PM_OPACITY_MAX - PM_OPACITY_MIN);
    };

    const maxStops = 80;
    const step = Math.max(1, Math.floor(vis.length / maxStops));
    const stops = [];
    for (let i = 0; i < vis.length; i += step) {
        const d = vis[i];
        if (!d.date || !Number.isFinite(d.pm)) continue;
        const xPos = xScale(d.date); // pixels in [0,width]
        const offset = Math.max(0, Math.min(1, xPos / Math.max(1, width)));
        const opacity = opacityFromPM(d.pm);
        stops.push({ offset, opacity });
    }

    if (!stops.length) return null;

    const last = vis[vis.length - 1];
    if (last && last.date && Number.isFinite(last.pm)) {
        const lastOffset = Math.max(0, Math.min(1, xScale(last.date) / Math.max(1, width)));
        if (stops[stops.length - 1].offset < lastOffset) {
            stops.push({ offset: lastOffset, opacity: opacityFromPM(last.pm) });
        }
    }
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");
    let grad = defs.select("#visitsOpacityGradient");
    if (grad.empty()) {
        grad = defs.append("linearGradient").attr("id", "visitsOpacityGradient");
    }
    grad
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("gradientUnits", "objectBoundingBox");

    grad.selectAll("stop").remove();
    grad.selectAll("stop")
        .data(stops)
        .enter()
        .append("stop")
        .attr("offset", d => `${(d.offset * 100).toFixed(2)}%`)
        .attr("stop-color", "darkgreen")
        .attr("stop-opacity", d => d.opacity);

    return "url(#visitsOpacityGradient)";
}

function setVisitsOverlayData(data) {
    visitsOverlayData = data || [];
    const wrangled = wrangleData(baseVisibilityData || []);
    updateGraph(wrangled);
}

if (typeof window !== 'undefined') {
    window.setVisitsOverlayData = setVisitsOverlayData;
}
function setVisibilityLineVisible(visible) {
    showVisibilityLine = !!visible;
    const visPath = g ? g.select(".line") : null;
    if (visPath) visPath.style("display", showVisibilityLine ? null : "none");
    if (yAxis) yAxis.style("display", showVisibilityLine ? null : "none");
}
if (typeof window !== 'undefined') {
    window.setVisibilityLineVisible = setVisibilityLineVisible;
}

window.addEventListener('resize', () => {
    if (!baseVisibilityData || !svg) return;

    const container = svg.node().parentNode;
    width = container.clientWidth - margin.left - margin.right;
    height = container.clientHeight - margin.top - margin.bottom;

    svg.attr("width", container.clientWidth)
       .attr("height", container.clientHeight);

    xScale.range([0, width]);
    yScale.range([height, 0]); 
    if (yScaleVisits) yScaleVisits.range([height, 0]);

    xAxis.attr("transform", `translate(0,${height})`);
    if (yAxisVisits) yAxisVisits.attr("transform", `translate(${width},0)`);

    svg.select(".chart-title")
        .attr("x", margin.left + width / 2);

    svg.select(".x-axis-title")
        .attr("x", margin.left + width / 2)
        .attr("y", margin.top + height + Math.max(18, margin.bottom * 0.75));

    svg.select(".y-axis-title")
        .attr("transform", `translate(${margin.right + width}, ${margin.top + height / 2}) rotate(90)`);

    hoverOverlay.attr("width", width)
                .attr("height", height);
    focusGroup.select(".focus-xline").attr("y2", height);
    if (focusLine) focusLine.attr("y2", height);

    const wrangledData = wrangleData(baseVisibilityData);

    g.select(".line")
        .datum(wrangledData)
        .attr("d", line);

    if (typeof renderVisitsOverlay === 'function') {
        renderVisitsOverlay();
    }

    xAxis.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")));
    yAxis.call(d3.axisLeft(yScale));
    if (yAxisVisits) yAxisVisits.call(d3.axisRight(yScaleVisits));
});



