module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 491:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __nccwpck_require__) => {

const fs     = __nccwpck_require__(747);
const ziti   = __nccwpck_require__(846);
const core   = __nccwpck_require__(324);
const github = __nccwpck_require__(7);
const crypto = __nccwpck_require__(417);

const UV_EOF = -4095;

const zitiInit = async (zitiFile) => {
  return new Promise((resolve, reject) => {
    var rc = ziti.ziti_init(zitiFile, (init_rc) => {
        if (init_rc < 0) {
            return reject(`init_rc = ${init_rc}`);
        }
        return resolve();
    });

    if (rc < 0) {
        return reject(`rc = ${rc}`);
    }
  });
};

const zitiServiceAvailable = async (service) => {
  return new Promise((resolve, reject) => {
    ziti.ziti_service_available(service, (obj) => {
      if (obj.status != 0) {
        console.log(`service ${service} not available, status: ${status}`);
        return reject(status);
      } else {
        console.log(`service ${service} available`);
        return resolve();
      }
    });
  });
}

const zitiHttpRequest = async (url, method, headers) => {
  return new Promise((resolve) => {
    ziti.Ziti_http_request(
      url, 
      method,
      headers,
      (obj) => { // on_req callback
          console.log('on_req callback: req is: %o', obj.req);
          return resolve(obj.req);
      },        
      (obj) => { // on_resp callback
        console.log(`on_resp status: ${obj.code} ${obj.status}`);
        if (obj.code < 0) {
          core.setFailed(`on_resp failure: ${obj.status}`);
          process.exit(-1);
        }
      },
      (obj) => { // on_resp_body callback
        // not expecting any body...
        if (obj.len === UV_EOF) {
          console.log('response complete')
          process.exit(0);
        } else if (obj.len < 0) {
          core.setFailed(`on_resp failure: ${obj.len}`);
          process.exit(-1);
        }

        if (obj.body) {
          let str = Buffer.from(obj.body).toString();
          console.log(`on_resp_body len: ${obj.len}, body: ${str}`);
        } else {
          console.log(`on_resp_body len: ${obj.len}`);
        }

        // TODO: keep running count of content-length to see if done?
        // for a webhook we don't care much, so just exit
        process.exit(0);
      });
  });
};

const zitiHttpRequestData = async (req, payload) => {
  var buf = Buffer.from(payload, 'utf8');
  ziti.Ziti_http_request_data(
    req, 
    buf,
    (obj) => { // on_req_body callback
      if (obj.status < 0) {
          reject(obj.status);
      } else {
          resolve(obj);
      }
  });
};

console.log('Going async...');
(async function() {
  try {
    const zidFile       = './zid.json'
    const zitiId        = core.getInput('ziti-id');
    const webhookUrl    = core.getInput('webhook-url');
    const webhookSecret = core.getInput('webhook-secret');

    console.log(`Webhook URL: ${webhookUrl}`);

    // Write zitiId to file
    fs.writeFileSync(zidFile, zitiId);

    // First make sure we can initialize Ziti
    await zitiInit(zidFile).catch((err) => {
      core.setFailed(`zitiInit failed: ${err}`);
      process.exit(-1);
    });

    // Make sure we have ziti service available
    // Note: ziti-sdk-nodejs (currently) requires service name to match URL host
    // (TODO: write an issue to change this - no reason that should need to match, and can lead to errors)
    let url = new URL(webhookUrl);
    let serviceName = url.hostname;
    await zitiServiceAvailable(serviceName).catch((err) => {
      core.setFailed(`zitiServiceAvailable failed: ${err}`);
      process.exit(-1);
    });

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    //console.log(`The event payload: ${payload}`);

    // Sign the payload
    let sig = "sha1=" + crypto.createHmac('sha1', webhookSecret).update(payload).digest('hex');
    //console.log(`Sig: ${sig}`);

    // Send it over Ziti
    let headersArray = [
      'User-Agent: GitHub-Hookshot/7abb35b',
      'Content-Type: application/json',
      `Content-Length: ${payload.length}`,
      `X-Hub-Signature: ${sig}`,
      `X-GitHub-Event: ${github.context.eventName}`
    ];

    let req = await zitiHttpRequest(webhookUrl, 'POST',headersArray).catch((err) => {
      console.log('error sending request header');
      core.setFailed(`Ziti_http_request failed: ${err}`);
      process.exit(-1);
    });

    // Send the payload
    results = await zitiHttpRequestData(req, payload).catch((err) => {
      core.setFailed(`Ziti_http_request_data failed: ${err}`);
      process.exit(-1);
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}());


/***/ }),

/***/ 324:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 7:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 846:
/***/ ((module) => {

module.exports = eval("require")("ziti-sdk-nodejs");


/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(491);
/******/ })()
;