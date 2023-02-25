import { MongoClient } from "mongodb";
import circulationRepo from "./repos/circulationRepo.js";
import assert from "assert";
import data from "./circulation.json" assert { type: "json" };

const url = "mongodb://localhost:27017";
const dbName = "circulation";

async function main() {
  const client = new MongoClient(url);
  await client.connect();

  try {
    const results = await circulationRepo.loadData(data);
    assert.equal(data.length, results.insertedCount);

    const getData = await circulationRepo.get();
    assert.equal(data.length, getData.length);

    const filterData = await circulationRepo.get({
      Newspaper: getData[4].Newspaper,
    });
    assert.deepEqual(filterData[0], getData[4]);

    const limitData = await circulationRepo.get({}, 3);
    assert.equal(limitData.length, 3);

    const id = getData[4]._id.toString();
    const byId = await circulationRepo.getById(id);
    assert.deepEqual(byId, getData[4]);

    const newItem = {
      Newspaper: "My paper",
      "Daily Circulation, 2004": 1,
      "Daily Circulation, 2013": 2,
      "Change in Daily Circulation, 2004-2013": 100,
      "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
      "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
      "Pulitzer Prize Winners and Finalists, 1990-2014": 0,
    };
    const addedItem = await circulationRepo.add(newItem);
    assert(addedItem.insertedId);
    const addedItemQuery = await circulationRepo.getById(addedItem.insertedId);
    assert.deepEqual(addedItemQuery, newItem);

    const updatedItem = await circulationRepo.update(addedItemQuery._id, {
      ...addedItemQuery,
      Newspaper: "My New paper",
    });
    assert(updatedItem.Newspaper, "My New paper");

    const removed = await circulationRepo.removedById(addedItem.insertedId);
    assert(removed);

    const avgFinalists = await circulationRepo.averageFinalists();
    console.log("averageFinalists", avgFinalists);

    const avgByChange = await circulationRepo.averageFinalistsByChange();
    console.log("averageByChange", avgByChange);

    console.log("...all assertions passed...");
  } catch (error) {
    console.log("???some assertion failed???");
    console.log(error);
  } finally {
    const admin = client.db(dbName).admin();

    await client.db(dbName).dropDatabase();
    // console.log(await admin.listDatabases());

    client.close();
  }
}

main();
