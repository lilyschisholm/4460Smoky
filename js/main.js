// Global variables for the visualization instances
let areachart, timeline;

loadData('all');

document.getElementById('taxa-select').addEventListener('change', function(event) {
    loadData(event.target.value);
});

function loadData(taxaGroup) {
    const fileName = taxaGroup === 'all' ? 
        'biodiversityDataFinal.json' : 
        `biodiversity${taxaGroup.charAt(0).toUpperCase() + taxaGroup.slice(1)}DataFinal.json`;

    Promise.all([
        d3.csv("./data/visibility.csv"),
        d3.csv("./data/visits.csv"),
        d3.csv("./data/airQualityData.csv"),
        d3.csv("./data/waterResults.csv"),
        d3.json(`./data/${fileName}`)
    ])
    .then(([visRows, visitRows, airRows, waterRows, biodiversityData]) => {
        let preparedData = prepareData(biodiversityData);
        
        console.log('Data loaded:', {
            taxaGroup: taxaGroup,
            rawData: biodiversityData,
            preparedData: preparedData
        });

        const parseVisTime = d3.timeParse("%-m/%-d/%Y %H:%M");
        const visibilityData = visRows.map(d => {
            const date = parseVisTime(d.DATE_TIME);
            const raw = d["GRSM-LR_PM2_5B_UG_M3_LC"];
            const value = (raw === "-999" || raw === "-999.0") ? NaN : +raw;
            return { date, pm: value };
        });

        const parseYear = d3.timeParse("%Y");
        const visitsData = visitRows.map(row => {
            const keys = Object.keys(row);
            const dateKey = keys.find(k => /year|date/i.test(k)) || "Year";
            const rawYear = row[dateKey];
            const date = parseYear(String(rawYear).trim());

            const visitsKey =
                keys.find(k => /visit/i.test(k)) ||
                keys.find(k => /recreation|visitors|count|total|value/i.test(k)) ||
                keys.find(k => k !== dateKey) ||
                null;

            const rawVal = visitsKey ? String(row[visitsKey]).replace(/,/g, "") : "NaN";
            const visitsVal = +rawVal;
            return { date, visits: visitsVal };
        }).filter(d => d.date && Number.isFinite(d.visits));

        const parseAirTime = d3.timeParse("%m/%d/%Y %I:%M:%S %p");
        const airQualityData = airRows.map(d => ({
            date: parseAirTime(d.DATE_TIME),
            value: +d["GRSM-LN_NO2_PPB"]
        }));

        const dispatcher = d3.dispatch("yearRangeSelected");

        drawVisibilityGraph(visibilityData, "#visibilityGraph svg");
        if (window.setVisitsOverlayData) {
            window.setVisitsOverlayData(visitsData);
        }

        drawWaterHeatmap(waterRows, dispatcher);
        drawANCtrend(waterRows, dispatcher);

        if (!areachart || !timeline) {
            timeline = new Timeline("timeline", preparedData.years);
            timeline.initVis();
            
            areachart = new StackedAreaChart("stacked-area", preparedData.layers);
            areachart.initVis();
        } else {
            timeline.initData(preparedData.years);
            areachart.data = preparedData.layers;
            areachart.wrangleData();
        }
    })
    .catch(error => {
        console.error("Error loading data:", error);
        const svg = d3.select('#visibilityGraph svg');
        svg.selectAll('*').remove();
        svg.append('text').attr('x', 20).attr('y', 30).text('Error loading data.');
        svg.append('text').attr('x', 20).attr('y', 50).text('Open via a local server (e.g., npx http-server).');
    });
}

function prepareData(data) {
    let parseDate = d3.timeParse("%Y");
    let preparedData = {
        layers: [],
        years: []
    };

    let allSpecies = new Set();
    data.layers.forEach(yearData => {
        Object.keys(yearData).forEach(key => {
            if (key !== 'Year') allSpecies.add(key);
        });
    });

    let speciesList = Array.from(allSpecies).sort();

    preparedData.layers = data.layers
        .filter(yearData => {
            let year = +yearData.Year;
            return !isNaN(year) && year >= 1800 && year <= 2025;
        })
        .map(yearData => {
            let layerEntry = { Year: parseDate(yearData.Year.toString()) };
            let yearTotal = 0;

            speciesList.forEach(species => {
                let count = +yearData[species] || 0;
                layerEntry[species] = count;
                yearTotal += count;
            });

            preparedData.years.push({
                Year: layerEntry.Year,
                Total_Animals_Spotted: yearTotal
            });

            return layerEntry;
        });

    preparedData.layers.sort((a, b) => a.Year - b.Year);
    preparedData.years.sort((a, b) => a.Year - b.Year);

    console.log('Prepared data:', {
        speciesCount: speciesList.length,
        yearsCount: preparedData.layers.length,
        firstYear: preparedData.layers[0],
        lastYear: preparedData.layers[preparedData.layers.length - 1]
    });

    return preparedData;
}

function brushed(event) {
    if (!event.selection) {
        areachart.filter = null;
        areachart.wrangleData();
        return;
    }
    
    let selectionRange = event.selection;
    
    let selectionDomain = selectionRange.map(timeline.x.invert);
    
    areachart.filter = {
        startDate: selectionDomain[0],
        endDate: selectionDomain[1]
    };
    
    areachart.wrangleData();
}

// Initialize Bootstrap tooltips for elements using either the old `data-toggle` or the
// newer `data-bs-toggle` attribute. This makes the tooltip work even if the HTML
// still uses `data-toggle="tooltip"` (as in `index.html`).
document.addEventListener('DOMContentLoaded', function () {
    try {
        const selector = '[data-toggle="tooltip"], [data-bs-toggle="tooltip"]';
        const tooltipTriggerList = Array.prototype.slice.call(document.querySelectorAll(selector));
        tooltipTriggerList.forEach(function (el) {
            // `bootstrap` is provided by the Bootstrap bundle script included in index.html
            if (window.bootstrap && typeof window.bootstrap.Tooltip === 'function') {
                new window.bootstrap.Tooltip(el);
            }
        });
    } catch (err) {
        // Non-fatal: tooltip initialization failed (Bootstrap may be missing). Log for debugging.
        console.warn('Tooltip initialization skipped or failed:', err);
    }
});
