const Mongo = require('mongodb').MongoClient;
const dataProps = require('../raw-data/country-properties.json');
const dataGeo = require('../raw-data/world-geo.json').features;

(async () => {
  const mongo = await Mongo.connect('mongodb://localhost:27017');
  const col = mongo.db('obor').collection('docs');

  await col.createIndex({ 'prop.countryId': 1 }, { unique: true });

  for (let prop of dataProps) {
    let geo = dataGeo.find(elem => elem.id == prop.countryId);
    if (geo === undefined) geo = null;

    const record = { prop: prop, geo: geo };
    await col.updateOne({ 'prop.countryId': prop.countryId }, { $set: record }, { upsert: true });
  }

  console.log('DONE');
})();