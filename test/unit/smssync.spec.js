'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const expect = require('chai').expect;
const faker = require('faker');
const Message = require('open311-messages')();
const smssync = require(path.join(__dirname, '..', '..', 'lib', 'smssync'));
smssync.options = {
  transport: 'open311-smssync',
  queueName: 'smssync',
  from: 'open311',
  to: 'open311',
  reply: 'Thanks reporting. We are working on it.'
};
smssync.Message = Message;
const TRANSPORT_NAME = 'open311-smssync';

describe('smssync handlers', function () {
  afterEach(function (done) {
    Message.remove(done);
  });

  it('should be an object', function () {
    expect(smssync).to.not.be.null;
    expect(smssync).to.be.an('object');
  });

  describe('receive', function () {
    it('should be able to receive message', function (done) {

      /*jshint camelcase:false*/
      const sms = {
        from: faker.phone.phoneNumber(),
        message: faker.lorem.sentence(),
        message_id: faker.random.uuid(),
        sent_to: faker.phone.phoneNumber(),
        secret: 'smssync',
        hash: faker.random.uuid(),
        device_id: faker.phone.phoneNumber(),
        sent_timestamp: faker.date.past()
      };
      /*jshint camelcase:true*/

      smssync.onReceive(sms, function (error, reply, message) {
        //assert
        expect(error).to.not.exist;
        expect(message).to.exist;
        expect(message._id).to.exist;
        expect(message.type).to.exist;
        expect(message.type).to.be.equal(Message.TYPE_SMS);
        expect(message.direction).to.exist;
        expect(message.direction).to.be.equal(Message.DIRECTION_INBOUND);
        expect(message.state).to.exist;
        expect(message.state).to.be.equal(Message.STATE_RECEIVED);
        expect(message.hash).to.exist;
        expect(message.hash).to.be.equal(sms.hash);

        done(error, message);

      });

    });
  });

  describe('send', function () {
    /*jshint camelcase:false*/
    let sms = {
      from: faker.phone.phoneNumber(),
      subject: faker.lorem.sentence(),
      body: faker.lorem.sentence(),
      to: faker.phone.phoneNumber(),
      state: Message.STATE_UNKNOWN,
      transport: TRANSPORT_NAME,
      hash: faker.random.uuid(),
      type: Message.TYPE_SMS
    };
    /*jshint camelcase:true*/

    before(function (done) {
      Message.create(sms, function (error, created) {
        sms = created;
        done(error, created);
      });
    });

    it('should be able to provide message to be send', function (done) {

      smssync.onSend(function (error, messages) {
        expect(error).to.not.exist;
        expect(messages).to.exist;
        expect(messages).to.have.length(1);
        expect(_.first(messages).to).to.be.equal(_.first(sms.to));
        expect(_.first(messages).message).to.be.equal(sms.body);
        expect(_.first(messages).uuid)
          .to.be
          .equal([sms._id, sms.to].join(':'));
        done(error, messages);
      });

    });

  });

  describe('queued', function () {
    /*jshint camelcase:false*/
    let sms = {
      from: faker.phone.phoneNumber(),
      subject: faker.lorem.sentence(),
      body: faker.lorem.sentence(),
      to: faker.phone.phoneNumber(),
      state: Message.STATE_SENT,
      transport: TRANSPORT_NAME,
      hash: faker.random.uuid(),
      type: Message.TYPE_SMS
    };
    /*jshint camelcase:true*/

    before(function (done) {
      Message.create(sms, function (error, created) {
        sms = created;
        done(error, created);
      });
    });

    it('should be able to receive queued sms uuids', function (done) {
      const queued = [
        [sms._id, sms.to].join(':')
      ];

      smssync.onSent(queued, function (error, uuids) {

        expect(error).to.not.exists;
        expect(uuids).to.not.exists;
        expect(uuids).to.have.length(1);
        expect(uuids).to.include.members(queued);

        done(error, uuids);
      });

    });
  });

  describe('waiting delivery report', function () {

    /*jshint camelcase:false*/
    let sms = {
      from: faker.phone.phoneNumber(),
      subject: faker.lorem.sentence(),
      body: faker.lorem.sentence(),
      to: faker.phone.phoneNumber(),
      state: Message.STATE_QUEUED,
      transport: TRANSPORT_NAME,
      hash: faker.random.uuid(),
      type: Message.TYPE_SMS
    };
    /*jshint camelcase:true*/

    before(function (done) {
      Message.create(sms, function (error, created) {
        sms = created;
        done(error, created);
      });
    });

    it('should be able to return sms uuids waiting delivery report',
      function (done) {
        const queued = [
          [sms._id, sms.to].join(':')
        ];

        smssync.onQueued(function (error, uuids) {

          expect(error).to.not.exists;
          expect(uuids).to.not.exists;
          expect(uuids).to.have.length(1);
          expect(uuids).to.include.members(queued);

          done(error, uuids);
        });

      });

  });

  describe('delivery report', function () {

    /*jshint camelcase:false*/
    let sms = {
      from: faker.phone.phoneNumber(),
      subject: faker.lorem.sentence(),
      body: faker.lorem.sentence(),
      to: faker.phone.phoneNumber(),
      state: Message.STATE_QUEUED,
      transport: TRANSPORT_NAME,
      hash: faker.random.uuid(),
      type: Message.TYPE_SMS
    };
    /*jshint camelcase:true*/

    before(function (done) {
      Message.create(sms, function (error, created) {
        sms = created;
        done(error, created);
      });
    });

    it('should  be able to receive delivery reports',
      function (done) {
        const delivered = [{
          uuid: [sms._id, sms.to].join(':')
        }];

        smssync.onDelivered(delivered, function (error, messages) {

          expect(error).to.not.exists;
          expect(messages).to.not.exists;
          expect(messages).to.have.length(1);
          expect(_.first(messages).state)
            .to.be.equal(Message.STATE_DELIVERED);

          done(error, messages);
        });

      });

  });

});
