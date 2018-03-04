'use strict';

const docs = locals.docs;

const width = 900;
const height = 550;

const projection = d3.geoMercator()
  .rotate([-10, 0])
  .center([105, 60])
  .scale(150);

const geoPath = d3.geoPath().projection(projection);

const divView = d3.select('body').select('#view');

const svgMap = divView.append('svg')
  .attr('id', 'map')
  .attr('width', width)
  .attr('height', height);

const preCountryInfo = divView.append('pre')
  .attr('id', 'countryInfo');

svgMap.append('rect')
  .attr('class', 'background')
  .attr('width', width)
  .attr('height', height)
  .on('click', clicked);

const g = svgMap.append('g');

const pathFeatures = g.selectAll('path')
  .data(docs)
  .enter()
  .append('path')
  .attr('class', 'feature')
  .attr('d', d => geoPath(d.geo))
  .on('click', clicked);

let centered;

function clicked(d) {
  let x, y, k;
  if (d && centered !== d) {
    const centroid = geoPath.centroid(d.geo);
    x = centroid[0];
    y = centroid[1];

    const bounds = geoPath.bounds(d.geo);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];

    k = d.prop.countryId === 'RUS' ? 1.5 : k = 0.75 / Math.max(dx / width, dy / height);

    centered = d;
    preCountryInfo.text(() => JSON.stringify(d.prop, null, 4));
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
    preCountryInfo.text(() => null);
  }

  g.selectAll('path')
    .classed('active', centered && (d => d === centered));

  g.transition()
    .duration(750)
    .attr('transform', `translate(${width / 2},${height / 2})scale(${k})translate(${-x},${-y})`);
}