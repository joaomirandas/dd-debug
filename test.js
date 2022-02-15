const _region = 'sa-east-1';
const _accountID = '************';

const __SNS = function(_e){
	const AWS = require('aws-sdk'); 
	const SNS = new AWS.SNS({apiVersion: '2010-03-31', region: _region});
  return SNS.publish({
    Message: JSON.stringify(_e.body),
    MessageAttributes : {
      "event": {
        "DataType": "String",
        "StringValue": _e.event || 'logger:save' 
      },
      "businessUnit":{
        "DataType": "String",
        "StringValue": _e.bu || 'DEVELOPER'
      }
    },
    TopicArn: `arn:aws:sns:${_region}:${_accountID}:debugger-hml`
  }).promise()
};

async function injectEvent() {
  console.log(`#Notify SNS`);
  let pushEvent = await __SNS({
    event: 'debugger:event',
    bu: 'DEBUGGER',
    body: {
      "eventID": "433b86e4-0c5c-4ef0-b155-43c83d15762a",
    }
  })
  console.log(pushEvent);
};

injectEvent();