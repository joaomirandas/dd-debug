const mongoose = require("/opt/node_modules/mongoose");
var cachedDBS = {};

function connectToDatabase(_tenant, _mongoDB) {
  return new Promise(async (resolve) => {
    console.log(
      JSON.stringify({
        state: "[CACHED-CONNECTIONS]",
        cachedConnection: Object.keys(cachedDBS),
      })
    );
    if (cachedDBS[_tenant]) {
      console.log(JSON.stringify({ state: "[USING_CACHE_MONGO_CONN]" }));
      return resolve(cachedDBS[_tenant]);
    }
    console.log(JSON.stringify({ state: "[CREATE_NEW_MONGO_CONN]" }));
    const conn_db = mongoose.createConnection(_mongoDB, {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      poolSize: 1,
      socketTimeoutMS: 2000000,
      keepAlive: true,
    });
    await conn_db;
    conn_db.model(
      "DB_LOGS",
      new mongoose.Schema(
        {
          eventAction: { type: String, require: true },
          eventID: { type: String, require: true },
        },
        { collection: "logs", minimize: false }
      )
    );
    cachedDBS[_tenant] = conn_db;
    return resolve(cachedDBS[_tenant]);
  });
}

module.exports.handler = async function (event, context, callback) {
  console.log(event, context);
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    //Connecting to database
    let $conn = await connectToDatabase(
      "application_id_1",
      process.env.MONGODB_URI
    );

    // Simulating error to forwarder events to DLQ
    // throw new Error('FORCING_ERROR_TO_DLQ');

    //Example of save 
    let _preSavingTTL = $conn.model('DB_LOGS')({
      eventAction: 'dd_debug_action',
      eventID: 1,
    });
    let _savingEvent = await _preSavingTTL.save();
    console.log(JSON.stringify({state: "[LOG_SAVE_SUCCESS]"}));
    console.log(JSON.stringify(_savingEvent));

    //Calling callback 
    return callback(null, {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ status: true }),
    });
  } catch(err){
    console.log(err);
    throw new Error(err);
  }
};
