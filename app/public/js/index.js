'use strict';

const { countries, languageClassification } = locals;
const countriesOnMap = countries.filter(doc => doc.geo !== null);
delete languageClassification._id;

const mapSize = { w: 800, h: 550 };
const legendSize = {
  wSymbols: 100, wInterval: 20, wText: 300, h: 550, hInterval: 4,
  get w() { return this.wSymbols + this.wText + this.wInterval * 2; },
  get xCalibration() { return this.wInterval },
  get xText() { return this.wInterval * 2 + this.wSymbols; }
};

let zoomed;

const presentation = {
  fill_feature: '#BDC3C7',
  stroke_feature: '#ECF0F1',
  stroke_selectedFeature: '#000000',
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

const preCountryInfo = divView.append('pre')
  .attr('id', 'countryInfo');

svgMap.append('rect')
  .attr('class', 'background')
  .attr('width', mapSize.w)
  .attr('height', mapSize.h)
  .on('click', mapClicked);

const gFeatureCollection = svgMap.append('g')
  .attr('class', 'featureCollection')
  .attr('stroke', 'white');

const pathFeatures = gFeatureCollection.selectAll('path')
  .data(countriesOnMap)
  .enter()
  .append('path')
  .attr('class', 'feature')
  .attr('d', d => geoPath(d.geo))
  .on('click', mapClicked);

mapByDefault();

d3.select('#mapOption')
  .on('change', function() {
    switch (d3.select(this).property('value')) {
      case 'Default': mapByDefault(); break;
      case 'Native Language Family': mapByNativeLanguageFamily(); break;
      case 'Number of Official Languages': mapByNumOfOfficialLanguages(); break;
      case 'English as Official Language': mapByEnglishAsOfficialLanguage(); break;
      case 'Prevailing Religion': mapByPrevailingReligion(); break;
      case 'Number of Major Religions': mapByNumberOfMajorReligions(); break;
      case 'Officially Religious': mapByOfficiallyReligious(); break;
      case 'Percentage of Religious Population': mapByPercentageOfReligiousPopulation(); break;
      case 'Percentage of Christians': mapByPercentageOfChristians(); break;
      case 'Percentage of Muslims': mapByPercentageOfMuslims(); break;
      case 'Percentage of Buddhists': mapByPercentageOfBuddhists(); break;
      case 'Percentage of Jews': mapByPercentageOfJews(); break;
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

  const symbolDef = languageFamilies.reduce((result, languageFamily, idx) => {
    result[languageFamily] = d3.schemePaired[idx];
    return result;
  }, {});

  pathFeatures.attr('fill', d => {
    const nativeLanguage = d.prop.officialLanguages[0];
    return symbolDef[languageClassification[nativeLanguage]];
  });

  generateLegendDiscrete(symbolDef);
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

  const symbolDef = {};
  for (let num = min; num <= max; ++num) {
    const t = (num - min + 1.5) / (max - min + 1.5);
    symbolDef[num] = d3.interpolateBlues(t);
  }

  pathFeatures.attr('fill', d => {
    const num = d.prop.officialLanguages.length;
    return symbolDef[num];
  });

  generateLegendDiscrete(symbolDef);
}

function mapByEnglishAsOfficialLanguage() {
  const symbolDef = {
    'English Official': '#76D7C4',
    'English not Official': '#85C1E9' };

  pathFeatures.attr('fill', d => {
    const isEnglishUsed = d.prop.officialLanguages.includes('English');
    return isEnglishUsed ? symbolDef['English Official'] : symbolDef['English not Official'];
  });

  generateLegendDiscrete(symbolDef);
}

function mapByPrevailingReligion() {

}

function mapByNumberOfMajorReligions() {

}

function mapByOfficiallyReligious() {

}

function mapByPercentageOfReligiousPopulation() {

}

function mapByPercentageOfChristians() {

}

function mapByPercentageOfMuslims() {

}

function mapByPercentageOfBuddhists() {

}

function mapByPercentageOfJews() {

}

let scaleBalanced = d3.scaleLinear().domain([1, 100]).range([1, 10]);

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
    preCountryInfo.text(JSON.stringify(d.prop, null, 4));
  } else {
    // clicked on the feature already zoomed into or on the background, then zoom out
    x = mapSize.w / 2;
    y = mapSize.h / 2;
    k = 1;
    zoomed = null;
    preCountryInfo.text(null);
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
      .attr('id', 'selected');
  }

  gFeatureCollection.transition()
    .duration(750)
    .attr('transform', `translate(${mapSize.w / 2},${mapSize.h / 2})scale(${k})translate(${-x},${-y})`);
}

function clearLegend() {
  svgLegend.selectAll('*').remove();
}

function generateLegendDiscrete(symbolDef) {
  clearLegend();

  const hClass = legendSize.h / Object.keys(symbolDef).length;
  let i = 0;
  for (let className in symbolDef) {
    svgLegend.append('rect')
      .attr('x', legendSize.xCalibration)
      .attr('y', i * hClass)
      .attr('width', legendSize.wSymbols)
      .attr('height', hClass - legendSize.hInterval)
      .attr('fill', symbolDef[className]);

    svgLegend.append('text')
      .attr('x', legendSize.xText)
      .attr('y', (i + 0.5) * hClass)
      .attr('fill', presentation.fill_legendText)
      .text(className);

    ++i;
  }
}