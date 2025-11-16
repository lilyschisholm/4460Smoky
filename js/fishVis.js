// js/fishVis.js
// Minimal visualization for GRSM_FISH_IBI.csv
// Renders a simple bar chart of IBI_SCORE counts

(function(){
    const CONTAINER = '#fishVis';
    const SVG_SEL = `${CONTAINER} svg`;
    const CSV = 'data/GRSM_FISH_IBI.csv';

    const svg = d3.select(SVG_SEL);
    if (svg.empty()) return;

    const width = +svg.attr('width') - 80;
    const height = +svg.attr('height') - 80;
    const g = svg.append('g').attr('transform','translate(60,40)');

    d3.csv(CSV).then(data => {
        const counts = d3.rollups(data, v => v.length, d => d.IBI_SCORE)
            .map(([k,v]) => ({score:k, count:v}))
            .sort((a,b)=>d3.descending(a.count,b.count));

        const x = d3.scaleBand().domain(counts.map(d=>d.score)).range([0,width]).padding(0.2);
        const y = d3.scaleLinear().domain([0,d3.max(counts,d=>d.count)||1]).range([height,0]);

        g.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x));
        g.append('g').call(d3.axisLeft(y));

        g.selectAll('rect').data(counts).join('rect')
            .attr('x',d=>x(d.score))
            .attr('y',d=>y(d.count))
            .attr('width',x.bandwidth())
            .attr('height',d=>height-y(d.count))
            .attr('fill','#6baed6')
            .on('mouseenter', (event,d)=>{
                const tip = d3.select('body').append('div').attr('class','tooltip').html(`<strong>${d.score}</strong><br/>${d.count} samples`)
                    .style('position','absolute').style('background','#fff').style('padding','6px').style('border','1px solid #ccc');
                tip.style('left', (event.pageX+10)+'px').style('top',(event.pageY+10)+'px');
            })
            .on('mouseleave', ()=>d3.selectAll('.tooltip').remove());

        g.append('text').attr('x',0).attr('y',-10).text('Counts by IBI score').style('font-weight','600');
    }).catch(err=>{
        console.error(err);
        svg.selectAll('*').remove();
        svg.append('text').attr('x',20).attr('y',30).text('Error loading GRSM_FISH_IBI.csv.');
        svg.append('text').attr('x',20).attr('y',50).text('If you opened this file locally, serve the folder over HTTP (e.g., `npx http-server`).');
    });
})();
