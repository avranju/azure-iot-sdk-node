// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var errors = require('azure-iot-common').errors;
var IotEdgedSignatureProvider = require('../lib/iotedged_signature_provider')
  .IotEdgedSignatureProvider;
var WORKLOAD_API_VERSION = require('../lib/iotedged_signature_provider')
  .WORKLOAD_API_VERSION;
var RestApiClient = require('azure-iot-http-base').RestApiClient;

describe('IotEdgedSignatureProvider', function() {
  describe('#constructor', function() {
    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_001: [ The constructor shall throw a ReferenceError if the _authConfig parameter is falsy. ]
    [null, undefined, ''].forEach(function(authConfig) {
      it("throws if the key is '" + authConfig + "'", function(testCallback) {
        assert.throws(function() {
          new IotEdgedSignatureProvider(authConfig);
        }, ReferenceError);
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_002: [ The constructor shall throw a ReferenceError if the _authConfig.workloadUri field is falsy. ]
    [null, undefined, ''].forEach(function(workloadUri) {
      it("throws if authConfig.workloadUri is '" + workloadUri + "'", function(
        testCallback
      ) {
        assert.throws(function() {
          new IotEdgedSignatureProvider({ workloadUri: workloadUri });
        }, ReferenceError);
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_003: [ The constructor shall throw a ReferenceError if the _authConfig.moduleId field is falsy. ]
    [null, undefined, ''].forEach(function(moduleId) {
      it("throws if authConfig.moduleId is '" + moduleId + "'", function(
        testCallback
      ) {
        assert.throws(function() {
          new IotEdgedSignatureProvider({
            workloadUri: 'unix:///var/run/iotedged.w.sock',
            moduleId: moduleId
          });
        }, ReferenceError);
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_004: [ The constructor shall throw a ReferenceError if the _authConfig.generationId field is falsy. ]
    [null, undefined, ''].forEach(function(generationId) {
      it(
        "throws if authConfig.generationId is '" + generationId + "'",
        function(testCallback) {
          assert.throws(function() {
            new IotEdgedSignatureProvider({
              workloadUri: 'unix:///var/run/iotedged.w.sock',
              moduleId: 'm1',
              generationId: generationId
            });
          }, ReferenceError);
          testCallback();
        }
      );
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_005: [ The constructor shall throw a TypeError if the _authConfig.workloadUri field is not a valid URI. ]
    it('throws if authConfig.workloadUri is not a valid URI', function(testCallback) {
      assert.throws(function() {
        new IotEdgedSignatureProvider({
          workloadUri: 'boo',
          moduleId: 'm1',
          generationId: 'g1'
        });
      }, TypeError);
      testCallback();
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_006: [ The constructor shall build a unix domain socket path host if the workload URI protocol is unix. ]
    it('builds a unix domain socket url', function(testCallback) {
      var provider = new IotEdgedSignatureProvider({
        workloadUri: 'unix:///var/run/iotedged.w.sock',
        moduleId: 'm1',
        generationId: 'g1'
      });

      assert.equal(
        provider._restApiClient._config.host.socketPath,
        '/var/run/iotedged.w.sock'
      );

      testCallback();
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_007: [ The constructor shall build a string host if the workload URI protocol is not unix. ]
    it('builds a http url', function(testCallback) {
      var provider = new IotEdgedSignatureProvider({
        workloadUri: 'http://localhost:8081',
        moduleId: 'm1',
        generationId: 'g1'
      });

      assert.equal(provider._restApiClient._config.host, 'localhost:8081');

      testCallback();
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_008: [ The constructor shall save the tokenValidTimeInSeconds parameter if supplied. If not, it shall default to 3600 seconds (1 hour). ]
    it('token expiry defaults to 3600 seconds', function(testCallback) {
      var provider = new IotEdgedSignatureProvider({
        workloadUri: 'http://localhost:8081',
        moduleId: 'm1',
        generationId: 'g1'
      });
      assert.equal(provider._tokenValidTimeInSeconds, 3600);
      testCallback();
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_008: [ The constructor shall save the tokenValidTimeInSeconds parameter if supplied. If not, it shall default to 3600 seconds (1 hour). ]
    it('token expiry is saved if supplied', function(testCallback) {
      var provider = new IotEdgedSignatureProvider(
        {
          workloadUri: 'http://localhost:8081',
          moduleId: 'm1',
          generationId: 'g1'
        },
        2000
      );
      assert.equal(provider._tokenValidTimeInSeconds, 2000);
      testCallback();
    });
  });

  describe('#sign', function() {
    before(function() {
      this.clock = sinon.useFakeTimers();
    });

    after(function() {
      this.clock.restore();
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_009: [ The sign method shall throw a ReferenceError if the callback parameter is falsy or is not a function. ]
    [null, undefined, '', 'not a function', 20].forEach(function(badCallback) {
      it("throws if the callback is '" + badCallback + "'", function(
        testCallback
      ) {
        var provider = new IotEdgedSignatureProvider({
          workloadUri: 'unix:///var/run/iotedged.w.sock',
          moduleId: 'm1',
          generationId: 'g1'
        });
        assert.throws(function() {
          provider.sign('key1', 'data', badCallback);
        }, ReferenceError);
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_010: [ The sign method invoke callback with a ReferenceError if the data parameter is falsy. ]
    [null, undefined, ''].forEach(function(badData) {
      it(
        "invokes callback with ReferenceError if data is '" + badData + "'",
        function(testCallback) {
          var provider = new IotEdgedSignatureProvider({
            workloadUri: 'unix:///var/run/iotedged.w.sock',
            moduleId: 'm1',
            generationId: 'g1'
          });
          provider.sign('key1', badData, function(err) {
            assert.instanceOf(err, ReferenceError);
            testCallback();
          });
        }
      );
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_011: [ The sign method shall build the HTTP request path in the format /modules/<module id>/genid/<generation id>/sign?api-version=2018-06-28. ]
    it('builds request path in expected format', function(testCallback) {
      var provider = new IotEdgedSignatureProvider({
        workloadUri: 'unix:///var/run/iotedged.w.sock',
        moduleId: 'm1',
        generationId: 'g1'
      });
      sinon
        .stub(provider._restApiClient, 'executeApiCall')
        .callsFake(function(method, path, headers, body, callback) {
          assert.equal(
            path,
            '/modules/m1/genid/g1/sign?api-version=' + WORKLOAD_API_VERSION
          );
          callback(null, { digest: 'digest1' });
        });

      provider.sign('key1', 'data', function(err) {
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_012: [ The sign method shall compute the token expiry period by adding _tokenValidTimeInSeconds to the current time. ]
    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [ The sign method shall build an object with the following schema as the HTTP request body as the sign request:
    //   interface SignRequest {
    //     keyId: string;
    //     algo: string;
    //     data: string;
    //   }
    //   ]
    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_013: [ The sign method shall build the sign request using the following values:
    //   const signRequest = {
    //     keyId: "primary"
    //     algo: "HMACSHA256"
    //     data: `${data}\n${expiry}`
    //   };
    //   ]
    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [ The sign method shall invoke this._restApiClient.executeApiCall to make the REST call on iotedged using the POST method. ]
    it('sign request is as expected', function(testCallback) {
      var provider = new IotEdgedSignatureProvider(
        {
          workloadUri: 'unix:///var/run/iotedged.w.sock',
          moduleId: 'm1',
          generationId: 'g1'
        },
        2000
      );
      sinon
        .stub(provider._restApiClient, 'executeApiCall')
        .callsFake(function(method, path, headers, body, callback) {
          assert.equal(method, 'POST');
          assert.equal(body.keyId, 'primary');
          assert.equal(body.algo, 'HMACSHA256');
          assert.equal(body.data, 'data\n2000');
          callback(null, { digest: 'digest1' });
        });

      provider.sign('key1', 'data', function(err) {
        testCallback();
      });
    });

    it('request error is handled', function(testCallback) {
      var provider = new IotEdgedSignatureProvider(
        {
          workloadUri: 'unix:///var/run/iotedged.w.sock',
          moduleId: 'm1',
          generationId: 'g1'
        },
        2000
      );
      sinon
        .stub(provider._restApiClient, 'executeApiCall')
        .callsFake(function(method, path, headers, body, callback) {
          callback('whoops');
        });

      provider.sign('key1', 'data', function(err) {
        assert.equal(err, 'whoops');
        testCallback();
      });
    });

    // Tests_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_015: [ The sign method shall build a SharedAccessSignature object and invoke callback when the signature is available. ]
    it('creates sas', function(testCallback) {
      var provider = new IotEdgedSignatureProvider(
        {
          workloadUri: 'unix:///var/run/iotedged.w.sock',
          moduleId: 'm1',
          generationId: 'g1'
        },
        2000
      );
      sinon
        .stub(provider._restApiClient, 'executeApiCall')
        .callsFake(function(method, path, headers, body, callback) {
          callback(null, { digest: 'digest1' });
        });

      provider.sign('key1', 'data', function(err, sas) {
        assert.equal(sas.sr, 'data');
        assert.equal(sas.se, 2000);
        assert.equal(sas.skn, 'primary');
        assert.equal(sas.sig, 'digest1');
        testCallback();
      });
    });
  });
});
