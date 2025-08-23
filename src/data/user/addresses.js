import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function listAddresses(userEmail) {
  const db = await getDb();
  const docs = await db
    .collection("addresses")
    .find({ userId: userEmail })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
}

export async function createAddress(userEmail, payload) {
  const db = await getDb();
  const doc = {
    userId: userEmail,
    label: String(payload.label || "Home"),
    country: String(payload.country || ""),
    city: String(payload.city || ""),
    area: String(payload.area || ""),
    address1: String(payload.address1 || ""),
    address2: String(payload.address2 || ""),
    postalCode: String(payload.postalCode || ""),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection("addresses").insertOne(doc);
  return { id: result.insertedId.toString() };
}

export async function updateAddress(userEmail, id, update) {
  const db = await getDb();
  await db
    .collection("addresses")
    .updateOne({ _id: new ObjectId(id), userId: userEmail }, { $set: { ...update, updatedAt: new Date() } });
  return { ok: true };
}

export async function deleteAddress(userEmail, id) {
  const db = await getDb();
  await db.collection("addresses").deleteOne({ _id: new ObjectId(id), userId: userEmail });
  return { ok: true };
}
