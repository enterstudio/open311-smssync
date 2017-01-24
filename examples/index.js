'use strict'


//dependencies
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/open311-smssync');
const express = require('express');
let app = express();

const sms = require('open311-smssync');
sms.start();
app.use(sms.smssync);


app.listen(7000);
