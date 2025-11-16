
/*
 * StackedAreaChart - ES6 Class
 * @param  parentElement 	-- the HTML element in which to draw the visualization
 * @param  data             -- the data the that's provided initially
 * @param  displayData      -- the data that will be used finally (which might vary based on the selection)
 *
 * @param  focus            -- a switch that indicates the current mode (focus or stacked overview)
 * @param  selectedIndex    -- a global 'variable' inside the class that keeps track of the index of the selected area
 */

class StackedAreaChart {

// constructor method to initialize StackedAreaChart object
constructor(parentElement, data) {
    this.parentElement = parentElement;
    
    // Validate and process input data
    this.data = data.filter(d => {
        // Check if Year is valid
        return d.Year && d.Year instanceof Date && !isNaN(d.Year.getTime());
    });
    
    this.displayData = [];

    // Generate a color scale that can handle many categories
    let generateColors = (numColors) => {
        return d3.quantize(d3.interpolateRainbow, numColors);
    };

	// Collect all unique species across all years
    let allSpecies = new Set();
    this.data.forEach(yearData => {
        Object.keys(yearData).forEach(key => {
            if (key !== "Year") allSpecies.add(key);
        });
    });
    
    // Convert to array and sort by total count
    this.dataCategories = Array.from(allSpecies).sort((a, b) => {
        // Sum up total values for each category across all years
        let sumA = d3.sum(this.data, d => +d[a] || 0);
        let sumB = d3.sum(this.data, d => +d[b] || 0);
        return sumB - sumA; // Sort by total count, descending
    });

    let colors = generateColors(this.dataCategories.length);
    
    // Map colors directly to categories (no modulo needed)
    let colorArray = this.dataCategories.map((d, i) => colors[i]);
    // Set ordinal color scale
    this.colorScale = d3.scaleOrdinal()
        .domain(this.dataCategories)
        .range(colorArray);

    this.filter = "";
    this.soloArea = null;
    this.stackedArea = null;
}


	/*
	 * Method that initializes the visualization (static content, e.g. SVG area or axes)
 	*/
	initVis(){
		let vis = this;

		vis.margin = {top: 60, right: 90, bottom: 50, left: 90};

		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Clear any existing SVG content
        d3.select("#" + vis.parentElement).selectAll("svg").remove();

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Overlay with path clipping - clip anything below x-axis
		vis.svg.append("defs").append("clipPath")
			.attr("id", "clip-stacked")
			.append("rect")
			.attr("width", vis.width)
			.attr("height", vis.height)
			.attr("transform", "translate(0,0)");  // align with the x-axis

		// Scales and axes
		// Initialize scales
		vis.x = d3.scaleTime()
			.range([0, vis.width])
			.domain(d3.extent(vis.data, d => d.Year));

		vis.y = d3.scaleLinear()
			.range([vis.height, 0])
			.domain([0, d3.max(vis.data, d => {
				let maxVal = 0;
				vis.dataCategories.forEach(cat => {
					let val = +d[cat];
					if (!isNaN(val)) maxVal += val;
				});
				return maxVal;
			})]);

		// Initialize axes
		vis.xAxis = d3.axisBottom()
			.scale(vis.x);

		vis.yAxis = d3.axisLeft()
			.scale(vis.y)
			.ticks(5);

		// Append axes
		vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")")
			.call(vis.xAxis);

		vis.svg.append("g")
			.attr("class", "y-axis axis")
			.call(vis.yAxis);

        // Add X axis label
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.bottom - 10)
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Years");

        // Add Y axis label
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -vis.margin.left + 30)
            .attr("x", -vis.height / 2)
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Total Lifeforms Spotted by Species");

        vis.svg.append('text')
            .attr('x', width / 2)
            .attr('y', -25)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .text('Total Lifeforms Spotted Annually by Species');

	
        // Initialize stack layout with proper value accessor
        let stack = d3.stack()
            .keys(vis.dataCategories)
            .value((d, key) => {
                let val = +d[key];
                // Convert to number, default to 0 if NaN or undefined
                return isNaN(val) ? 0 : val;
            })
            .order(d3.stackOrderDescending); // Stack larger values at the bottom
            
        // Stack data
        try {
            // Ensure data is sorted by date before stacking
            vis.data.sort((a, b) => a.Year - b.Year);


            // Create stack with proper handling of missing values
            let stackData = stack(vis.data);
            
            // Validate stack data
            stackData = stackData.map(layer => {
                layer.forEach(point => {
                    // Convert NaN or undefined to 0
                    if (isNaN(point[0])) point[0] = 0;
                    if (isNaN(point[1])) point[1] = 0;
                });
                return layer;
            });
            
            vis.stackedData = stackData;


        } catch (error) {
            console.error("Error stacking data:", error);
            console.error("Stack error details:", error.stack);
            vis.stackedData = [];
        }

        // Stacked area layout with null check
        vis.stackedArea = d3.area()
            .curve(d3.curveCardinal)
            .x(d => vis.x(d.data.Year))
            .y0(d => !isNaN(d[0]) ? vis.y(d[0]) : vis.y(0))
            .y1(d => !isNaN(d[1]) ? vis.y(d[1]) : vis.y(0));

        vis.area = vis.stackedArea;

        // Solo area with null check
        vis.soloArea = d3.area()
            .x(d => vis.x(d.data.Year))
            .y0(vis.height)
            .y1(d => !isNaN(d[1] - d[0]) ? vis.y(d[1] - d[0]) : vis.y(0));            // TO-DO (Activity IV): Add Tooltip placeholder
        vis.svg.append("text")
            .attr("class", "label")
            .attr("y", 0)
            .attr("x", 10)
            .attr("font-family", "Lato, Arial, sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "#005082")
            .text("");

            // TO-DO: (Filter, aggregate, modify data)
        vis.wrangleData();
	}

	/*
 	* Data wrangling
 	*/
	wrangleData(){
		let vis = this;
        
        // Make sure we're working with valid data
        let validData = vis.data.filter(d => {
            // Basic data validation
            if (!d.Year || !(d.Year instanceof Date)) return false;
            
            // Apply time filter if it exists
            if (vis.filter && vis.filter.startDate && vis.filter.endDate) {
                return d.Year >= vis.filter.startDate && d.Year <= vis.filter.endDate;
            }
            
            return true;
        });
        
        // Recreate the stack with filtered data
        let stack = d3.stack()
            .keys(vis.dataCategories)
            .value((d, key) => {
                let val = +d[key];
                return isNaN(val) ? 0 : val;
            });
            
        vis.stackedData = stack(validData);
        vis.displayData = vis.stackedData;

        // Handle category filtering with proper data validation
        if (vis.categoryFilter && vis.categoryFilter !== "") {
            // Find the index of the filtered category
            let indexOfFilter = vis.dataCategories.findIndex(d => d === vis.categoryFilter);
            if (indexOfFilter !== -1 && vis.stackedData[indexOfFilter]) {
                // Make sure we have valid data for the filtered category
                vis.displayData = [vis.stackedData[indexOfFilter]];
                vis.area = vis.soloArea;
            } else {
                console.warn("Selected category not found in data");
                vis.displayData = vis.stackedData;
                vis.area = vis.stackedArea;
            }
        } else {
            // Show all categories
            vis.displayData = vis.stackedData;
            vis.area = vis.stackedArea;
        }


		// Update the visualization
		vis.updateVis();
	}

	/*
	 * The drawing function - should use the D3 update sequence (enter, update, exit)
 	* Function parameters only needed if different kinds of updates are needed
 	*/
	updateVis(){
		let vis = this;

		// Update domains
        // Update x domain if we have a brush filter
        if (vis.filter && vis.filter.startDate && vis.filter.endDate) {
            vis.x.domain([vis.filter.startDate, vis.filter.endDate]);
        } else {
            vis.x.domain(d3.extent(vis.data, d => d.Year));
        }
        
        // Calculate maximum value while handling invalid data
        let maxY = d3.max(vis.displayData, function(d) {
            if (!d || !Array.isArray(d)) return 0;
            return d3.max(d, function(e) {
                if (!Array.isArray(e)) return 0;
                if (vis.categoryFilter) {
                    let value = e[1] - e[0];
                    return isNaN(value) ? 0 : value;
                } else {
                    return isNaN(e[1]) ? 0 : e[1];
                }
            }) || 0;
        });
        
        // Ensure we always have a valid domain, even if maxY is 0
        vis.y.domain([0, Math.max(maxY, 1)]);

		// Draw the layers
		let categories = vis.svg.selectAll(".area")
			.data(vis.displayData, d => d.key);  // Use key for proper data binding

		// Exit selection - remove elements that are no longer in the data
		categories.exit().remove();

		// Enter selection - create new elements for new data
		let categoriesEnter = categories.enter()
			.append("path")
			.attr("class", "area")
			.attr("clip-path", "url(#clip-stacked)");

		// Update + Enter selections - apply attributes to both new and existing elements
		let categoriesAll = categories.merge(categoriesEnter)
			.on("mouseover", function(event, d) {
				d3.select(this)
					.style("opacity", 0.8);
				vis.svg.select(".label").text(d.key);
			})
			.on("mouseout", function(event, d) {
				d3.select(this)
					.style("opacity", 1);
				vis.svg.select(".label").text("");
			})
			.on("click", function(event, d) {
				if (vis.categoryFilter === "") {
					vis.categoryFilter = d.key;
				} else {
					vis.categoryFilter = "";
				}
				vis.wrangleData();
			});

		// Apply transitions for visual attributes
		categoriesAll
			.style("fill", d => vis.colorScale(d.key))
			.transition()
			.duration(200)
			.attr("d", function(d) {
				if (!d || !Array.isArray(d)) return null;
				
				if (vis.categoryFilter) {
					vis.soloArea
						.x(d => vis.x(d.data.Year))
						.y0(vis.height)
						.y1(d => vis.y(d[1] - d[0]));
					return vis.soloArea(d);
				} else {
					vis.stackedArea
						.x(d => vis.x(d.data.Year))
						.y0(d => vis.y(d[0]))
						.y1(d => vis.y(d[1]));
					return vis.stackedArea(d);
				}
			});

		// Remove old paths
		categories.exit().remove();

		// Update axes
		vis.xAxis = d3.axisBottom()
			.scale(vis.x);
		
		vis.yAxis = d3.axisLeft()
			.scale(vis.y)
			.ticks(5);

		vis.svg.select(".x-axis")
			.transition()
			.duration(200)
			.call(vis.xAxis);
			
		vis.svg.select(".y-axis")
			.transition()
			.duration(200)
			.call(vis.yAxis);
	}
}