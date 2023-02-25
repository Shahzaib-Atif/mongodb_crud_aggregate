import { MongoClient, ObjectId } from "mongodb";

function circulationRepo() {
  const url = "mongodb://localhost:27017";
  const dbName = "circulation";
  const collectionName = "newspapers";

  function get(query, limit) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);

        let items = db.collection(collectionName).find(query);

        if (limit > 0) {
          items = items.limit(limit);
        }

        resolve(await items.toArray());
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function getById(id) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const item = await db
          .collection(collectionName)
          .findOne({ _id: new ObjectId(id) });
        resolve(item);
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function loadData(data) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);

        const results = await db.collection(collectionName).insertMany(data);
        resolve(results);
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function add(newItem) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const item = await db.collection(collectionName).insertOne(newItem);
        resolve(item);
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function update(id, newItem) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const item = await db
          .collection(collectionName)
          .findOneAndReplace({ _id: new ObjectId(id) }, newItem, {
            returnOriginal: false,
          });
        resolve(item.value);
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function removedById(id) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const item = await db
          .collection(collectionName)
          .deleteOne({ _id: new ObjectId(id) });
        resolve(item.deletedCount === 1);
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function averageFinalists() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const average = db.collection(collectionName).aggregate([
          {
            $group: {
              _id: null,
              avgFinalists: {
                $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014",
              },
            },
          },
        ]);

        resolve(await average.toArray());
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  function averageFinalistsByChange() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const client = new MongoClient(url);
      try {
        await client.connect();
        const db = client.db(dbName);
        const average = db.collection(collectionName).aggregate([
          {
            $project: {
              Newspaper: 1,
              "Pulitzer Prize Winners and Finalists, 1990-2014": 1,
              "Change in Daily Circulation, 2004-2013": 1,
              overallChange: {
                $cond: {
                  if: { $gte: ["$Change in Daily Circulation, 2004-2013", 0] },
                  then: "positive",
                  else: "negative",
                },
              },
            },
          },
          {
            $group: {
              _id: "$overallChange",
              avgFinalists: {
                $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014",
              },
            },
          },
        ]);

        resolve(await average.toArray());
        client.close();
      } catch (error) {
        reject(error);
      }
    });
  }

  return {
    loadData,
    get,
    getById,
    add,
    update,
    removedById,
    averageFinalists,
    averageFinalistsByChange,
  };
}

export default circulationRepo();
