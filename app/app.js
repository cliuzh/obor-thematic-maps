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
  const col = mongo.db('obor').collection('docs');
  const docs = await col.find().toArray();
  await mongo.close();
  res.locals.docs = docs;
  res.render('index');
});

app.listen(config.listeningPort);

console.log(`Server listening on Port ${config.listeningPort}`);