'use strict'

//Note! you must have configure smssync to use this endpoint
//i.e http://localhost:7000
//with secret smssync unless changed

//dependencies
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/open311-smssync');

const express = require('express');
let app = express();

//listen to received sms
const kue = require('kue');
const queue = kue.createQueue();
queue.process('issue', function (job, done) {
  console.log('receiving new issue', job.data);
  done();
});

const sms = require('open311-smssync');
sms.start();
app.use(sms.smssync);


app.listen(7000);
