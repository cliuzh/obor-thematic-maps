const Mongo = require('mongodb').MongoClient;
const dataProps = require('../../raw-data/country-properties.json');
const dataGeo = require('../../raw-data/world-geo.json').features;
const dataLanguages = require('../../raw-data/language-classification.json');

async function importCountries() {
  const mongo = await Mongo.connect('mongodb://localhost:27017');
  const col = mongo.db('obor').collection('countries');

  await col.createIndex({ 'prop.countryId': 1 }, { unique: true });

  for (let prop of dataProps) {
    let geo = dataGeo.find(elem => elem.id == prop.countryId);
    if (geo === undefined) geo = null;

    const record = { prop: prop, geo: geo };
    await col.updateOne({ 'prop.countryId': prop.countryId }, { $set: record }, { upsert: true });
  }

  await mongo.close();
  console.log('Import countries finished.');
}

async function importLanguages() {
  const mongo = await Mongo.connect('mongodb://localhost:27017');
  await mongo.db('obor').collection('languages').insertOne(dataLanguages);

  await mongo.close();
  console.log('Import languages finished.');
}

importCountries().catch(err => console.log(err));
importLanguages().catch(err => console.log(err));