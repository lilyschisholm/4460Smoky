

(function(){
    const SVG_SEL = '#visitsVis svg';
    const CSV = 'data/visits.csv';
    const svg = d3.select(SVG_SEL);
    if (svg.empty()) return;

    const margin = {top:40,right:70,bottom:80,left:85};
    const container = d3.select('#visitsVis').node();
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.min(400, container.clientWidth * 0.5) - margin.top - margin.bottom;
    svg.attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    d3.csv(CSV, d3.autoType).then(raw=>{
        const data = raw.map(d=>({year:+d.Year, visits: +String(d['Recreation Visits']).replace(/,/g,'')})).filter(d=>!isNaN(d.year));
        data.sort((a,b)=>a.year-b.year);

        const x = d3.scaleLinear().domain(d3.extent(data,d=>d.year)).range([0,width]);
        const y = d3.scaleLinear().domain([0,d3.max(data,d=>d.visits)||1]).range([height,0]);

        g.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format('d')));
        g.append('g').call(d3.axisLeft(y).tickFormat(d3.format('.2s')));

        const line = d3.line().x(d=>x(d.year)).y(d=>y(d.visits));

        g.append('path').datum(data).attr('fill','none').attr('stroke','#2E8B57').attr('stroke-width',2).attr('d',line);

        g.selectAll('circle').data(data).join('circle')
            .attr('cx',d=>x(d.year)).attr('cy',d=>y(d.visits)).attr('r',2.5).attr('fill','#2E8B57')
            .on('mouseover',(e,d)=>{
                d3.select('body').append('div').attr('class','tooltip').html(`<b>Year: ${d.year}</b><br/>Number of Visits: ${d.visits.toLocaleString()}`)
                    .style('position','absolute').style('background','#fff').style('padding','6px').style('border','1px solid #ccc')
                    .style('left',(e.pageX+8)+'px').style('top',(e.pageY+8)+'px');
            }).on('mouseout',()=>d3.selectAll('.tooltip').remove());

        // --- Axis Labels ---
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + 35)
            .attr('text-anchor', 'middle')
            .style("font-size", "13px")
            .style("font-weight", "500")
            .style('fill', '#555')
            .text('Year');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style("font-size", "13px")
            .style("font-weight", "500")
            .style('fill', '#555')
            .text('Number of Visitors');

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .text('Annual Recreation Visits to Great Smoky Mountains National Park');


    }).catch(err=>{
        console.error(err);
        svg.selectAll('*').remove();
        svg.append('text').attr('x',20).attr('y',30).text('Error loading visits.csv');
        svg.append('text').attr('x',20).attr('y',50).text('Serve the folder over HTTP (e.g., `npx http-server`) to allow data loading.');
    });
})();
