const fs     = require('fs');
const ziti   = require('@openziti/ziti-sdk-nodejs');
const core   = require('@actions/core');
const github = require('@actions/github');
const crypto = require('crypto');

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

// stopped using this function when we switched from a presumed-identical
// service name == url.hostname to relying upon the SDK to look up the service
// by URL
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

const zitiHttpRequest = async (url, method, path, headers) => {
  return new Promise((resolve) => {
    console.log(`path: ${path}`)
    ziti.httpRequest(
      url, 
      method,
      path,
      headers,
      (obj) => { // on_req callback
          console.log('on_req callback: req is: %o', obj.req);
          return resolve(obj.req);
      },        
      (obj) => { // on_resp callback
        console.log(`on_resp status: ${obj.code} ${obj.status}`);
        if (obj.code != 200) {
          core.setFailed(`on_resp failure: ${obj.status}`);
          process.exit(-1);
        }
        process.exit(0);
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
      });
  });
};

const zitiHttpRequestData = async (req, buf) => {
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

function keyValuePairLinesToObj (string) {
  var obj = {}; 
  var stringArray = string.split("\n"); 
  for(var i = 0; i < stringArray.length; i++){ 
    var kvp = stringArray[i].split('=');
    if(kvp[1]){
      obj[kvp[0]] = kvp[1] 
    }
  }
  return obj;
}

console.log('Going async...');
(async function() {
  try {
    const zidFile       = './zid.json'
    const zitiId        = core.getInput('ziti-id');
    const webhookUrl    = core.getInput('webhook-url');
    const webhookSecret = core.getInput('webhook-secret');
    const extraKeyValuePairLines = core.getInput('data');

    console.log(`Webhook URL: ${webhookUrl}`);

    // Write zitiId to file
    fs.writeFileSync(zidFile, zitiId);

    // First make sure we can initialize Ziti
    await zitiInit(zidFile).catch((err) => {
      core.setFailed(`zitiInit failed: ${err}`);
      process.exit(-1);
    });
    let url = new URL(webhookUrl);

    // Get the JSON webhook payload for the event that triggered the workflow and merge with extra data dict from action input
    var extraData = {'data': keyValuePairLinesToObj(extraKeyValuePairLines)}
    var payloadData =  Object.assign({}, github.context.payload, extraData);
    const payload = JSON.stringify(payloadData, undefined, 2)
    var payloadBuf = Buffer.from(payload, 'utf8');
    //console.log(`The event payload: ${payload}`);

    // Sign the payload
    let sig = "sha1=" + crypto.createHmac('sha1', webhookSecret).update(payloadBuf).digest('hex');
    let sig256 = "sha256=" + crypto.createHmac('sha256', webhookSecret).update(payloadBuf).digest('hex');
    const hookshot = 'ziti-webhook-action';
    const { v4: uuidv4 } = require('uuid');
    const guid = uuidv4(); 

    // Send it over Ziti
    let headersArray = [
      `User-Agent: GitHub-Hookshot/${hookshot}`, 
      'Content-Type: application/json',
      `X-GitHub-Delivery: ${guid}`,
      `Content-Length: ${payloadBuf.length}`,
      `X-Hub-Signature: ${sig}`,
      `X-Hub-Signature-256: ${sig256}`,
      `X-GitHub-Event: ${github.context.eventName}`
    ];

    let req = await zitiHttpRequest(url.origin, 'POST', url.pathname+url.search, headersArray).catch((err) => {
      core.setFailed(`zitiHttpRequest failed: ${err}`);
      process.exit(-1);
    });

    // Send the payload
    results = await zitiHttpRequestData(req, payloadBuf).catch((err) => {
      core.setFailed(`zitiHttpRequestData failed: ${err}`);
      process.exit(-1);
    });
    ziti.Ziti_http_request_end(req);

  } catch (error) {
    core.setFailed(error.message);
  }
}());
