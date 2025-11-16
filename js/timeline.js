
/*
 * Timeline - ES6 Class
 * @param  parentElement 	-- the HTML element in which to draw the visualization
 * @para		// Append y-axis
        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .ticks(5);
            
        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);
	}

    // Method to update the visualization when data changes
    wrangleData() {
        let vis = this;

        // Update scales
        vis.x.domain(d3.extent(vis._displayData, d => d.Year));
        vis.y.domain([0, d3.max(vis._displayData, d => {
            let value = d.Total_Animals_Spotted;
            return isNaN(value) ? 0 : value;
        })]);

        // Update scales
        vis.x = d3.scaleTime()
            .range([0, vis.width])
            .domain(d3.extent(vis._displayData, d => d.Year));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(vis._displayData, d => {
                let value = d.Total_Animals_Spotted;
                return isNaN(value) ? 0 : value;
            })]);

        // Update axis generators
        vis.xAxis.scale(vis.x);
        vis.yAxis.scale(vis.y);

        // Update the area generator with new scales
        vis.area
            .x(d => vis.x(d.Year))
            .y0(vis.height)
            .y1(d => vis.y(d.Total_Animals_Spotted));

        // Update the area path
        vis.areaPath
            .datum(vis._displayData.filter(d => !isNaN(d.Total_Animals_Spotted)))
            .transition()
            .duration(200)
            .attr("d", vis.area);

        // Update axes with transitions
        vis.svg.select(".x-axis")
            .transition()
            .duration(200)
            .call(vis.xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45)");

        vis.svg.select(".y-axis")
            .transition()
            .duration(200)
            .call(vis.yAxis);

        // Reset brush if it exists and we're not currently brushing
        if (vis.brushGroup && !d3.event?.selection) {
            vis.brushGroup.call(vis.brush.move, null);
        }
    }
}          -- the data the timeline should use
 */

class Timeline {

	// constructor method to initialize Timeline object
	constructor(parentElement, data){
		this._parentElement = parentElement;
		this.data = data;  // Store the original data
		this.initData(data);
	}

    // Initialize or update data
    initData(data) {
		// Parse the year data into Date objects
		this._data = data.map(d => {
			let year = d.Year instanceof Date ? d.Year : new Date(+d.Year, 0);
			let value = +d.Total_Animals_Spotted;
			
			// Skip invalid entries
			if (isNaN(year.getTime()) || isNaN(value)) {
				return null;
			}
			
			return {
				Year: year,
				Total_Animals_Spotted: value
			};
		}).filter(d => d !== null); // Remove invalid entries

		// No data wrangling, no update sequence
		this._displayData = this._data;

        if (this.svg) {
            this.updateVis();
        }
    }

    // Method to update the visualization
    updateVis() {
        let vis = this;
        
        // Update scales
        vis.x = d3.scaleTime()
            .range([0, vis.width])
            .domain(d3.extent(vis._displayData, d => d.Year));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(vis._displayData, d => {
                let value = d.Total_Animals_Spotted;
                return isNaN(value) ? 0 : value;
            })]);

        // Update axis generators
        vis.xAxis.scale(vis.x);
        vis.yAxis.scale(vis.y);

        // Update the area generator with new scales
        vis.area
            .x(d => vis.x(d.Year))
            .y0(vis.height)
            .y1(d => vis.y(d.Total_Animals_Spotted));

        // Update the area path
        vis.areaPath
            .datum(vis._displayData.filter(d => !isNaN(d.Total_Animals_Spotted)))
            .transition()
            .duration(200)
            .attr("d", vis.area);

        // Update axes with transitions
        vis.svg.select(".x-axis")
            .transition()
            .duration(200)
            .call(vis.xAxis);

        vis.svg.select(".y-axis")
            .transition()
            .duration(200)
            .call(vis.yAxis);

        // Reset brush if it exists and we're not currently brushing
        if (vis.brushGroup && !d3.event?.selection) {
            vis.brushGroup.call(vis.brush.move, null);
        }
    }	// create initVis method for Timeline class
	initVis() {
		// store keyword this which refers to the object it belongs to in variable vis
		let vis = this;

		vis.margin = {top: 40, right: 90, bottom: 50, left: 90};

		vis.width = document.getElementById(vis._parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis._parentElement).getBoundingClientRect().height  - vis.margin.top - vis.margin.bottom;

        // Clear any existing SVG
        d3.select("#" + vis._parentElement).selectAll("svg").remove();

		// SVG drawing area
		vis.svg = d3.select("#" + vis._parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Scales and axes with validation
		vis.x = d3.scaleTime()
			.range([0, vis.width])
			.domain(d3.extent(vis._displayData, d => d.Year));

		vis.y = d3.scaleLinear()
			.range([vis.height, 0])
			.domain([0, d3.max(vis._displayData, d => {
				let value = d.Total_Animals_Spotted;
				return isNaN(value) ? 0 : value;
			})]);

		vis.xAxis = d3.axisBottom()
			.scale(vis.x);

		// SVG area path generator with null checks
		vis.area = d3.area()
			.defined(d => !isNaN(d.Total_Animals_Spotted)) // Skip points with NaN values
			.x(d => vis.x(d.Year))
			.y0(vis.height)
			.y1(d => vis.y(d.Total_Animals_Spotted));

		// Draw area by using the path generator
		vis.areaPath = vis.svg.append("path")
			.datum(vis._displayData.filter(d => !isNaN(d.Total_Animals_Spotted))) // Filter out invalid data
			.attr("fill", "#ccc")
			.attr("d", vis.area);

        // Initialize brush with proper scope
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function(event) {
                // If this is a brush end event with no selection, reset to show all data
                if (!event.selection) {
                    if (areachart) {
                        areachart.filter = null;
                        areachart.wrangleData();
                    }
                    return;
                }
                
                // Get the extent of the current brush
                let selectionRange = event.selection;
                
                // Convert brush extent to dates
                let selectionDomain = selectionRange.map(vis.x.invert);
                
                // Update the area chart with the new time range
                if (areachart) {
                    areachart.filter = {
                        startDate: selectionDomain[0],
                        endDate: selectionDomain[1]
                    };
                    areachart.wrangleData();
                }
            });

        // Append brush component
        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);

        // Set the height of the brush
        vis.brushGroup.selectAll("rect")
            .attr("height", vis.height);

        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

		// Append x-axis
		vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")")
			.call(vis.xAxis);
            
        // Append y-axis
        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .ticks(5);
            
        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Add X axis label
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.bottom - 10)
            .style("font-size", "10px")
            .text("Years");

        // Add Y axis label
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -vis.margin.left + 25)
            .attr("x", -vis.height / 2)
            .style("font-size", "8px")
            .text("Total Lifeforms Spotted");
        
        vis.svg.append('text')
            .attr('x', width / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Total Lifeforms Spotted Annually');
	}


}