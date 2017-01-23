'use strict';

/**
 * @module open311-smssync
 * @version 0.1.0
 * @description smssync transport for open311-messages
 * @see {@link https://github.com/CodeTanzania/open311-messages}
 * @see {@link http://smssync.ushahidi.com}
 * @author lally elias <lallyelias87@gmail.com>
 * @public
 */


//dependencies
const path = require('path');
const _ = require('lodash');
const kue = require('kue');
const messages = require('open311-messages');
const smssync = require('smssync');
const noop = function () {};


/**
 * @name defaults
 * @description default configuration options
 * @type {Object}
 * @since 0.1.0
 * @private
 */
exports.defaults = {
  timeout: 5000,
  concurrency: 10,
  from: 'open311'
};


/**
 * @name queueName
 * @description name of the queue that will be used by push transport
 *              to enqueue message for sending
 * @type {String}
 * @since 0.1.0
 * @public
 */
exports.queueName = 'smssync';


/**
 * @name transport
 * @description name of the transport provided by push.
 *              This must be name of node module or file path pointing to
 *              a node module implement `send()`.
 * @type {String}
 * @since 0.1.0
 * @public
 */
exports.transport = 'open311-smssync';


/**
 * transport message send mode
 */
// exports.mode;


/**
 * @name init
 * @description initialize smssync internals
 * @since 0.1.0
 * @private
 * @example
 *
 * const smssync = require('open311-smssync');
 * smssync.options = {
 *  secret:<your_smssync_secret_key>
 * };
 * smssync.init();
 * 
 */
exports.init = function () {

  //merge options
  exports.options = _.merge({}, exports.defaults, exports.options);

  //initialize open311-message
  if (!exports.Message) {
    exports.Message = messages(exports.options);
    //sent send mode
    exports.mode = exports.Message.SEND_MODE_PULL;
  }

  //initialize worker processing queue
  //for internal usage
  if (!exports._queue) {
    exports._queue = kue.createQueue(exports.options);
  }

  //initiate smssync
  //@see {@link https://github.com/lykmapipo/smssync}
  if (!exports.smssync) {
    //import & configure handlers
    const handlers =
      require(path.join(__dirname, 'lib', 'smssync'));
    handlers.Message = exports.Message;
    handlers._queue = exports._queue;
    exports.smssync = smssync(_.merge({}, exports.options, handlers));
  }

};


/**
 * @name queue
 * @description queue message instance for sending
 * @param  {Message} message valid instance of open311-message
 * @since 0.1.0
 * @public
 * @example
 *
 * const Message = require('open311-messages')(<your_options>);
 * const smssync = require('open311-smssync');
 * const message = new Message(options);
 * smssync.queue(message);
 * 
 */
exports.queue = function (message) {
  //ensure already initialized
  exports.init();

  message.transport = exports.transport;
  message.queueName = exports.queueName;
  message.mode = exports.Message.SEND_MODE_PULL;
  message.type = exports.Message.TYPE_SMS;
  //ensure from is set-ed
  if (!message.from) {
    message.from = exports.options.from;
  }
  message.queue();
};


/**
 * @name _send
 * @description send sms message
 * @param  {Message}   message valid open311-message instance
 * @param  {Function} done    a callback to invoke on success or failure
 * @type {Function}
 * @since 0.1.0
 * @private
 */
exports._send = function (message, done) {
  //Note! for pull/poll transport just return sent state
  done(null, {
    state: exports.Message.STATE_SENT
  });

};


/**
 * @name send
 * @description implementation of open311 message send to allow send message
 *              as an sms using SMSSync 
 * @param  {Message}   message valid open311 message instance
 * @param  {Function} done    a callback to invoke on success or failure
 * @return {Object|Error}     result or error during sending sms message
 * @type {Function}
 * @since 0.1.0
 * @public
 * @example
 *
 * const Message = require('open311-messages')(<your_options>);
 * const push = require('open311-smssync');
 * const message = new Message(options);
 * push.send(message, function(error, response){
 *  ...
 * });
 */
exports.send = function (message, done) {
  //ensure initialized
  exports.init();

  //obtain message additional send options
  const options = message.options;

  //simulate send
  if (options && options.fake) {
    done(null, {
      message: 'success'
    });
  }

  //send actual gcm push
  else {
    exports._send(message, done);
  }

};


/**
 * @name stop
 * @description gracefull shutdown kue
 * @see {@link https://github.com/Automattic/kue#graceful-shutdown}
 * @param {Function} [done] a callback to invoke on succes or failure
 * @type {Function}
 * @since 0.1.0
 * @public
 * @example
 *
 * const push = require('open311-smssync');
 * push.stop();
 *  
 */
exports.stop = function stop(done) {

  //ensure callback
  if (!done && !_.isFunction(done)) {
    done = noop;
  }

  //ensure queue safe shutdown
  if (exports._queue) {
    if (exports._queue.shuttingDown) {
      done();
    } else {
      const { timeout } = exports.options;
      exports._queue.shutdown(timeout, done);
    }
  } else {
    done();
  }

};


/**
 * @name start
 * @description setup sms message(s) worker and start to process `smssync` jobs
 * @type {Function}
 * @since 0.1.0
 * @public
 * @example
 *
 * const push = require('open311-smssync');
 * push.start();
 * 
 */
exports.start = function () {

  //ensure push is initialized
  exports.init();

  //reference open311-message model
  const Message = exports.Message;

  //register worker for processing message 
  //and send it as push notification
  const { concurrency } = exports.options;
  exports._queue.process(exports.queueName, concurrency, Message.process);

  //listen for process termination
  //and gracefull shutdown push worker queue
  process.once('SIGTERM', function ( /*signal*/ ) {
    exports._queue.shutdown(function ( /*error*/ ) {
      process.exit(0);
    });
  });

};
