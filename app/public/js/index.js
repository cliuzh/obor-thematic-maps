'use strict';

const docs = locals.docs;
const countries = docs.filter(doc => doc.geo != null);

const width = 900;
const height = 550;

let zoomed;

const featureStyles = {
  fillDefault: '#85929E',
  fillActive: '#F0B27A',
  strokeDefault: 'white'
};

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
  .on('click', mapClicked);

const g = svgMap.append('g')
  .attr('class', 'featureCollection')
  .attr('stroke', 'white');

const pathFeatures = g.selectAll('path')
  .data(countries)
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
  pathFeatures.attrs(function (d) {
      const attrToChange = d3.select(this).attr('active') === '1' ? 'fillPrevious' : 'fill';
      return { [attrToChange]: featureStyles.fillDefault }
    });
}

// function mapByNativeLanguage() {
//   const nativeLanguages = countries.reduce((result, country) => {
//     const native = country.prop.officialLanguages[0];
//     if (!result.includes(native)) {
//       result.push(native);
//     }
//     return result
//   }, []);
//
//   const propRange = nativeLanguages.length - 1;
//
//   pathFeatures.attrs(function (d) {
//     const attrToChange = d3.select(this).attr('active') === '1' ? 'fillPrevious' : 'fill';
//
//     const t = nativeLanguages.indexOf(d.prop.officialLanguages[0]) / propRange;
//     const clr = d3.interpolatePlasma(t);
//
//     return { [attrToChange]: clr }
//   });
// }

function mapByNativeLanguageFamily() {
  // To be developed...
}

function mapByNumOfOfficialLanguages() {
  let {min, max} = countries.reduce((result, country) => {
    const num = country.prop.officialLanguages.length;
    if (num < result.min) {
      result.min = num;
    } else if (num > result.max) {
      result.max = num;
    }
    return result;
  }, {min: Infinity, max: -Infinity});

  min -= 1;
  const propRange = max - min;

  pathFeatures.attrs(function (d) {
      const attrToChange = d3.select(this).attr('active') === '1' ? 'fillPrevious' : 'fill';

      const t = (d.prop.officialLanguages.length - min) / propRange;
      const clr =  d3.interpolateBlues(t);

      return { [attrToChange]: clr };
    });
}

function mapByEnglishAsOfficialLanguage() {
  pathFeatures.attrs(function (d) {
    const attrToChange = d3.select(this).attr('active') === '1' ? 'fillPrevious' : 'fill';

    const isEnglishUsed = d.prop.officialLanguages.includes('English');
    const clr = isEnglishUsed ? '#76D7C4' : '#85C1E9';

    return { [attrToChange]: clr };
  });
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

    k = d.prop.countryId === 'RUS' ? 1.5 : k = 0.75 / Math.max(dx / width, dy / height);

    zoomed = d;
    preCountryInfo.text(() => JSON.stringify(d.prop, null, 4));
  } else {
    // clicked on the feature already zoomed into or on the background, then zoom out
    x = width / 2;
    y = height / 2;
    k = 1;
    zoomed = null;
    preCountryInfo.text(() => null);
  }


  pathFeatures.attrs(function (d) {
    const thisPathFeature = d3.select(this);

    if (zoomed && d === zoomed) {
      // for the feature to be zoomed into when zooming in
      return {
        active: '1',
        fillPrevious: thisPathFeature.attr('fill'),
        fill: featureStyles.fillActive
      };
    } else {
      // for other features when zooming in, or for all features when zooming out
      if (thisPathFeature.attr('active') === '1') {
        return {
          active: '0',
          fillPrevious: null,
          fill: thisPathFeature.attr('fillPrevious')
        };
      }
    }
  });

  g.transition()
    .duration(750)
    .attr('transform', `translate(${width / 2},${height / 2})scale(${k})translate(${-x},${-y})`);
}