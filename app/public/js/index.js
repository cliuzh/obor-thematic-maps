'use strict';

const { countries, languageClassification } = locals;
const countriesOnMap = countries.filter(doc => doc.geo !== null);
delete languageClassification._id;

const mapSize = { w: 800, h: 550 };
const legendSize = {
  wSymbols: 100, wInterval: 20, wText: 300,
  h: 550, hInterval: 4, hBorder: 50,
  get w() { return this.wSymbols + this.wText + this.wInterval * 2; },
  get hSymbols() { return this.h - this.hBorder * 2; },
  get xSymbols() { return this.wInterval },
  get xText() { return this.wInterval * 2 + this.wSymbols; }
};

let zoomed;

const presentation = {
  fill_feature: '#7FB3D5',
  stroke_feature: '#ECF0F1',
  stroke_selectedFeature: '#000000',
  strokeWidth_selectedFeature: 2,
  fill_legendText: '#34495E'
};

const projection = d3.geoMercator()
  .rotate([-10, 0])
  .center([120, 60])
  .scale(150);

const geoPath = d3.geoPath().projection(projection);

const divView = d3.select('body').select('#view');

const svgMap = divView.append('svg')
  .attr('id', 'map')
  .attr('width', mapSize.w)
  .attr('height', mapSize.h);

const svgLegend = divView.append('svg')
  .attr('width', legendSize.w)
  .attr('height', legendSize.h);

svgMap.append('rect')
  .attr('class', 'background')
  .attr('width', mapSize.w)
  .attr('height', mapSize.h)
  .on('click', mapClicked);

const gFeatureCollection = svgMap.append('g')
  .attr('class', 'featureCollection')
  .attr('stroke', presentation.stroke_feature);

const preCountryInfo = d3.select('body').append('pre')
  .attr('class', 'countryInfo')
  .style('display', 'none');

const pathFeatures = gFeatureCollection.selectAll('path')
  .data(countriesOnMap)
  .enter()
  .append('path')
  .attr('class', 'feature')
  .attr('d', d => geoPath(d.geo))
  .on('click', mapClicked)
  .on('mouseover', featureMouseOver)
  .on('mousemove', featureMouseMove)
  .on('mouseout', featureMouseOut);

mapByDefault();

d3.select('#mapOption')
  .on('change', function() {
    switch (d3.select(this).property('value')) {
      case 'Default': mapByDefault(); break;
      case 'Native Language Family': mapByNativeLanguageFamily(); break;
      case 'Number of Official Languages': mapByNumOfOfficialLanguages(); break;
      case 'English as Official Language': mapByEnglishAsOfficialLanguage(); break;
      case 'Prevailing Religion': mapByPrevailingReligion(); break;
      case 'Number of Popular Religions': mapByNumberOfPopularReligions(); break;
      case 'Officially Religious': mapByOfficiallyReligious(); break;
      case 'Percentage of Religious Population': mapByPercentageOfReligiousPopulation(); break;
      case 'Percentage of Christians': mapByPercentageOfSpecifiedReligion('Christianity'); break;
      case 'Percentage of Muslims': mapByPercentageOfSpecifiedReligion('Islam'); break;
      case 'Percentage of Buddhists': mapByPercentageOfSpecifiedReligion('Buddhism'); break;
      case 'Percentage of Orthodox Christians': mapByPercentageOfSpecifiedReligion('Orthodoxy'); break;
      default: break;
    }
  });

function mapByDefault() {
  pathFeatures.attr('fill', presentation.fill_feature);
  clearLegend();
}

function mapByNativeLanguageFamily() {
  const languageFamilies = Object.values(languageClassification).reduce((result, languageFamily) => {
    if (!result.includes(languageFamily)) {
      result.push(languageFamily);
    }
    return result
  }, []);

  const symbolMapping = languageFamilies.reduce((result, languageFamily, idx) => {
    result[languageFamily] = d3.schemePaired[idx];
    return result;
  }, {});

  pathFeatures.attr('fill', d => {
    const nativeLanguage = d.prop.officialLanguages[0];
    return symbolMapping[languageClassification[nativeLanguage]];
  });

  generateLegendClassified(symbolMapping);
}

function mapByNumOfOfficialLanguages() {
  let {min, max} = countriesOnMap.reduce((result, country) => {
    const num = country.prop.officialLanguages.length;
    if (num < result.min) {
      result.min = num;
    } else if (num > result.max) {
      result.max = num;
    }
    return result;
  }, {min: Infinity, max: -Infinity});

  const symbolMapping = {};
  for (let num = min; num <= max; ++num) {
    const t = (num - min + 1.5) / (max - min + 1.5);
    symbolMapping[num] = d3.interpolateBlues(t);
  }

  pathFeatures.attr('fill', d => {
    const num = d.prop.officialLanguages.length;
    return symbolMapping[num];
  });

  generateLegendClassified(symbolMapping);
}

function mapByEnglishAsOfficialLanguage() {
  const symbolMapping = {
    'English Official': '#76D7C4',
    'English not Official': '#85C1E9' };

  pathFeatures.attr('fill', d => {
    const isEnglishOfficial = d.prop.officialLanguages.includes('English');
    return isEnglishOfficial ? symbolMapping['English Official'] : symbolMapping['English not Official'];
  });

  generateLegendClassified(symbolMapping);
}

function mapByPrevailingReligion() {
  const religions = countriesOnMap.reduce((result, country) => {
    const religion = country.prop.dominantReligion;
    if (religion != null && !result.includes(religion.name)) {
      result.push(religion.name);
    }
    return result
  }, []);
  religions.push('Non-religious');

  const symbolMapping = religions.reduce((result, religion, idx) => {
    result[religion] = d3.schemePaired[idx];
    return result;
  }, {});

  pathFeatures.attr('fill', d => {
    const prevailingReligion = d.prop.dominantReligion;
    const className = prevailingReligion == null ? 'Non-religious' : prevailingReligion.name;
    return symbolMapping[className];
  });

  generateLegendClassified(symbolMapping);
}

function mapByNumberOfPopularReligions() {
  let {min, max} = countriesOnMap.reduce((result, country) => {
    const num = Object.keys(country.prop.religionComposition).length;
    console.log(num);
    if (num < result.min) {
      result.min = num;
    } else if (num > result.max) {
      result.max = num;
    }
    return result;
  }, {min: Infinity, max: -Infinity});

  const symbolMapping = {};
  for (let num = min; num <= max; ++num) {
    const t = (num - min + 1) / (max - min + 1);
    symbolMapping[num] = d3.interpolateBlues(t);
  }

  pathFeatures.attr('fill', d => {
    const num = Object.keys(d.prop.religionComposition).length;
    return symbolMapping[num];
  });

  generateLegendClassified(symbolMapping);
}

function mapByOfficiallyReligious() {
  const symbolMapping = {
    'Officially Religious': '#76D7C4',
    'Not Officially Religious': '#85C1E9' };

  pathFeatures.attr('fill', d => {
    const prevailingReligion = d.prop.dominantReligion;
    const isOfficiallyReligious = prevailingReligion == null ? false : prevailingReligion.isOfficial;
    return isOfficiallyReligious ? symbolMapping['Officially Religious'] : symbolMapping['Not Officially Religious'];
  });

  generateLegendClassified(symbolMapping);
}

function mapByPercentageOfReligiousPopulation() {
  const min = 0;
  const max = 1;

  const thresholds = steppedThresholds(min, max, 0.1);
  const symbols = [];
  for (let i = 0; i < thresholds.length - 1; ++i) {
    const classMid = (thresholds[i] + thresholds[i + 1]) * 0.5;
    const t = (classMid - min + 0.3) / (max - min + 0.3);
    symbols.push(d3.interpolateBlues(t));
  }
  const colorMapping = d3.scaleThreshold()
    .domain(thresholds.slice(1, -1))
    .range(symbols);

  pathFeatures.attr('fill', d => {
    const population = sumReligiousPercentage(d.prop);
    return colorMapping(population);
  });

  generateLegendThresholded(thresholds, symbols, num => printPercentage(num, 0));
}

function mapByPercentageOfSpecifiedReligion(religion) {
  const min = 0;
  const max = 1;

  const thresholds = steppedThresholds(min, max, 0.1);
  const symbols = [];
  for (let i = 0; i < thresholds.length - 1; ++i) {
    const classMid = (thresholds[i] + thresholds[i + 1]) * 0.5;
    const t = (classMid - min + 0.3) / (max - min + 0.3);
    symbols.push(d3.interpolateBlues(t));
  }
  const colorMapping = d3.scaleThreshold()
    .domain(thresholds.slice(1, -1))
    .range(symbols);

  pathFeatures.attr('fill', d => {
    const population = getSpecifiedReligiousPercentage(d.prop, religion);
    return colorMapping(population);
  });

  generateLegendThresholded(thresholds, symbols, num => printPercentage(num, 0));
}

let scaleBalanced = d3.scaleLinear().domain([1, 100]).range([1, 10]);

function mouseOverFeature(d) {
  svgMap.append('text')
    .attr('class', 'tip')
    .attr('x', d3.event.pageX)
    .attr('y', d3.event.pageY)
    .text(d.prop);
}

function mouseOutFeature(d) {
  console.log('out');
}

function mapClicked(d) {
  let x, y, k;
  if (d && zoomed !== d) {
    // clicked on a feature not zoomed into, then zoom into it
    const centroid = geoPath.centroid(d.geo);
    x = centroid[0];
    y = centroid[1];

    const bounds = geoPath.bounds(d.geo);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];

    k = d.prop.countryId === 'RUS' ? 1.5 : k = 0.75 / Math.max(dx / mapSize.w, dy / mapSize.h);
    k = scaleBalanced(k);

    zoomed = d;
  } else {
    // clicked on the feature already zoomed into or on the background, then zoom out
    x = mapSize.w / 2;
    y = mapSize.h / 2;
    k = 1;
    zoomed = null;
  }

  // pathFeatures.attrs(function (d) {
  //   const thisPathFeature = d3.select(this);
  //
  //   if (zoomed && d === zoomed) {
  //     // for the feature to be zoomed into when zooming in
  //     return { stroke: 'black' };
  //   } else {
  //     // for other features when zooming in, or for all features when zooming out
  //     return { stroke: 'white' }
  //   }
  // });

  gFeatureCollection.select('#selected').remove();
  if (zoomed) {
    gFeatureCollection.append('path')
      .attr('d', () => geoPath(zoomed.geo))
      .attr('fill', 'none')
      .attr('stroke', presentation.stroke_selectedFeature)
      .attr('stroke-width', presentation.strokeWidth_selectedFeature)
      .attr('id', 'selected');
  }

  gFeatureCollection.transition()
    .duration(750)
    .attr('transform', `translate(${mapSize.w / 2},${mapSize.h / 2})scale(${k})translate(${-x},${-y})`);
}

function clearLegend() {
  svgLegend.selectAll('*').remove();
}

function generateLegendClassified(symbolMapping) {
  clearLegend();

  const classNames = Object.keys(symbolMapping);
  const hClass = legendSize.hSymbols / classNames.length;

  for (let i = 0; i < classNames.length; ++i) {
    const className = classNames[i];

    svgLegend.append('text')
      .attr('x', legendSize.xText)
      .attr('y', legendSize.hBorder + (i + 0.5) * hClass)
      .attr('fill', presentation.fill_legendText)
      .text(className);

    svgLegend.append('rect')
      .attr('x', legendSize.xSymbols)
      .attr('y', legendSize.hBorder + i * hClass)
      .attr('width', legendSize.wSymbols)
      .attr('height', hClass - legendSize.hInterval)
      .attr('fill', symbolMapping[className]);
  }
}

function generateLegendThresholded(thresholds, symbols, printNum) {
  clearLegend();

  const hClass = legendSize.hSymbols / symbols.length;

  for (let i = 0; i < thresholds.length; ++i) {
    svgLegend.append('text')
      .attr('x', legendSize.xText)
      .attr('y', legendSize.hBorder + (i + 0.1) * hClass)
      .attr('fill', presentation.fill_legendText)
      .text(printNum == null ? thresholds[i] : printNum(thresholds[i]))

    if (i === thresholds.length - 1) break;

    svgLegend.append('rect')
      .attr('x', legendSize.xSymbols)
      .attr('y', legendSize.hBorder + i * hClass)
      .attr('width', legendSize.wSymbols)
      .attr('height', hClass)
      .attr('fill', symbols[i]);
  }
}

function sumReligiousPercentage(countryProp) {
  if (countryProp.religionComposition == null) return 0;

  const sum = Object.values(countryProp.religionComposition)
    .reduce((result, population) => result + population, 0)

  return sum <= 1 ? sum : 1;
}

function getSpecifiedReligiousPercentage(countryProp, religion) {
  if (countryProp.religionComposition == null) return 0;

  const pop = countryProp.religionComposition[religion];
  return pop || 0;
}

function toFixedDecimals(num, dec, func) {
  const mult = Math.pow(10, dec);
  return func(num * mult) / mult;
}

function steppedThresholds(start, end, step) {
  const thr = [];
  for (let x = start; x <= end; x = x + step) {
    thr.push(x);
  }
  return thr;
}

function printPercentage(num, dec) {
  return `${(num * 100).toFixed(dec)}%`;
}

function featureMouseOver(d) {
  preCountryInfo
    .style('display', 'inline')
    .text(printCountryInfo(d.prop));
}

function featureMouseMove(d) {
  preCountryInfo
    .style("left", (d3.event.pageX + 5) + "px")
    .style("top", (d3.event.pageY - 10) + "px");
}

function featureMouseOut() {
  preCountryInfo.style('display', 'none');
}

function printCountryInfo(countryProp) {
  let infoText = '';

  infoText += `Country:\t\t\t\t${countryProp.countryName}`;
  infoText += `\nNative Language:\t\t${countryProp.officialLanguages[0]}`;
  infoText += `\nPrevailing Religion:\t\t${
    countryProp.dominantReligion == null ? 'Non-religious' : countryProp.dominantReligion.name
  }`;
  infoText += `\nReligious Population:\t${
    printPercentage(sumReligiousPercentage(countryProp), 1)
  }`;

  return infoText;
}