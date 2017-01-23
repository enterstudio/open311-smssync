'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const expect = require('chai').expect;
const mongoose = require('mongoose');
const faker = require('faker');
const smssync = require(path.join(__dirname, '..', '..'));
smssync.options = {
  secret: faker.random.uuid() //fake secret key
};
const Message = mongoose.model('Message');

describe('smssync', function () {

  it('should be an object', function (done) {
    expect(smssync).to.not.be.null;
    expect(smssync).to.be.an('object');
    done();
  });

  it('should have queue name', function (done) {
    expect(smssync.queueName).to.exist;
    expect(smssync.queueName).to.be.equal('smssync');
    done();
  });

  it('should be able to queue message', function (done) {
    const details = {
      from: faker.phone.phoneNumber(),
      to: faker.phone.phoneNumber(),
      body: faker.lorem.sentence()
    };

    //listen to message queue success
    smssync.init();
    smssync._queue.on('message:queue:success', function (message) {
      expect(message).to.exist;
      expect(message._id).to.exist;
      expect(message.queueName).to.be.equal('smssync');
      expect(message.transport).to.be.equal('open311-smssync');
      expect(message.state).to.be.equal(Message.STATE_UNKNOWN);
      expect(message.mode).to.be.equal(Message.SEND_MODE_PULL);
      expect(message.type).to.be.equal(Message.TYPE_SMS);
      expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
      expect(_.first(message.to)).to.be.equal(details.to);

      done(null, message);
    });


    const message = new Message(details);

    smssync.queue(message);

    expect(message.transport).to.exist;
    expect(message.transport).to.be.equal(smssync.transport);
    expect(message.queueName).to.exist;
    expect(message.queueName).to.be.equal(smssync.queueName);
    expect(message.mode).to.exists;
    expect(message.mode).to.be.equal(Message.SEND_MODE_PULL);

  });

  it('should be able to simulate message send', function (done) {
    const details = {
      from: faker.phone.phoneNumber(),
      to: faker.phone.phoneNumber(),
      body: faker.lorem.sentence(),
      options: {
        fake: true
      }
    };
    const message = new Message(details);

    smssync.send(message, function (error, result) {

      expect(error).to.not.exist;
      expect(result).to.exist;

      expect(result.message).to.exist;
      expect(result.message).to.be.equal('success');

      done();

    });

  });

  afterEach(function (done) {
    smssync.stop(done);
  });

});
