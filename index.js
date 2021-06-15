require("dotenv/config");
const { validate: uidValidate } = require("uuid");
var MongoClient = require("mongodb").MongoClient;

let cachedDb = null;

async function connectToDatabase(uri) {
  // cachear conexão para conexões subsequentes

  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  //extraindo nome da db da url
  const dbName = "science";
  const db = client.db(dbName);

  cachedDb = db;

  return db;
}

// Require the framework and instantiate it
const fastify = require("fastify")({
  logger: false,
});

//

// Declare a route
fastify.post("/", async function (request, reply) {
  const userData = JSON.parse(request.body);
  const isNotValidUuid = uidValidate(userData.uid) !== true;

  if (isNotValidUuid) return;

  const db = await connectToDatabase(process.env.MONGO);

  var result = await db.collection("science").updateOne(
    { uid: userData.uid },
    {
      $push: { journey: userData.journey[0] },
    }
  );

  if (!result.modifiedCount) {
    await db
      .collection("science")
      .insertOne(userData)
      .then(() => console.log("[+] Inserido", userData.uid))
      .catch((e) => console.log(e));
  }
});

// Run the server!
fastify.listen(3000, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${address}`);
});
