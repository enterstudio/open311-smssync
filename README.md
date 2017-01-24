open311-smssync
================

[![Build Status](https://travis-ci.org/CodeTanzania/open311-smssync.svg?branch=master)](https://travis-ci.org/CodeTanzania/open311-smssync)
[![Dependencies Status](https://david-dm.org/CodeTanzania/open311-smssync/status.svg?style=flat-square)](https://david-dm.org/CodeTanzania/open311-smssync)

smssync transport for open311 messages

*Note!:It highly adviced to start smssync in separate process for optiomal performance*

## Requirements
- [MongoDB 3.2+](https://www.mongodb.com/)
- [NodeJS v6.9.2+](https://nodejs.org)
- [Redis 2.8 +](https://redis.io/)

## Installation
```sh
$ npm install --save open311-smssync
```

## Usage
```js
const express = require('express');
let app = express();
const mongoose = require('mongoose');
const Message = require('open311-messages')(<options>);
const smssync = require('open311-smssync');

//queue message for sending
const message = new Message(<message_details>);
smssync.queue(message);


//start smssync worker(s) in background process(s)
//to process and send queued message(s) as smssync notification(s)
smssync.start();


//in your main process use smssync router
app.use(smssync.router);
app.listen();
```

## Options
- All [kue supported configuration options](https://github.com/Automattic/kue#redis-connection-settings)



## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## TODO
- [ ] notify on delivery report
- [ ] notify on message queued

## Licence
The MIT License (MIT)

Copyright (c) 2016 lykmapipo, CodeTanzania & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 