'use strict'

//Note! you must have configure smssync to use this endpoint
//i.e http://localhost:7000
//with secret smssync unless changed

//dependencies
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/open311-smssync');

const express = require('express');
let app = express();

app.use(function (request, response, next) {
  console.log(request.originalUrl);
  next();
});

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

//sending sample
//make sure to update according to your setup
const message = {
  from: '255714095061',
  subject: 'Test Send',
  body: 'Test Send',
  to: '255673506509'
};
sms.queue(message);

app.listen(7000);
