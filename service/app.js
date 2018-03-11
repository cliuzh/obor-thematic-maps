'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path');
const config = require('./config.json');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', async (req, res) => {
  const mongo = await MongoClient.connect(config.mongoConnectionUrl);
  const countries = await mongo.db('obor').collection('countries').find().toArray();
  const languageClassification = (await mongo.db('obor').collection('languages').find().toArray())[0];
  await mongo.close();

  res.locals = {
    countries: countries,
    languageClassification: languageClassification
  };

  res.render('index');
});

app.listen(config.listeningPort);

console.log(`Server listening on Port ${config.listeningPort}`);