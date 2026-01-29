import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Address {
  _id: string;
  userId: string;
  label: string;
  country: string;
  city: string;
  area: string;
  address1: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressPayload {
  label?: string;
  country?: string;
  city?: string;
  area?: string;
  address1?: string;
  postalCode?: string;
}

export async function listAddresses(userEmail: string): Promise<Address[]> {
  const db = await getDb();
  const docs = await db
    .collection("addresses")
    .find({ userId: userEmail })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() })) as Address[];
}

export async function createAddress(
  userEmail: string,
  payload: AddressPayload,
): Promise<{ id: string }> {
  const db = await getDb();
  const doc = {
    userId: userEmail,
    label: String(payload.label || "Home"),
    country: String(payload.country || ""),
    city: String(payload.city || ""),
    area: String(payload.area || ""),
    address1: String(payload.address1 || ""),
    postalCode: String(payload.postalCode || ""),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection("addresses").insertOne(doc);
  return { id: result.insertedId.toString() };
}

export async function updateAddress(
  userEmail: string,
  id: string,
  update: Partial<AddressPayload>,
): Promise<{ ok: boolean }> {
  const db = await getDb();
  await db
    .collection("addresses")
    .updateOne(
      { _id: new ObjectId(id), userId: userEmail },
      { $set: { ...update, updatedAt: new Date() } },
    );
  return { ok: true };
}

export async function deleteAddress(
  userEmail: string,
  id: string,
): Promise<{ ok: boolean }> {
  const db = await getDb();
  await db
    .collection("addresses")
    .deleteOne({ _id: new ObjectId(id), userId: userEmail });
  return { ok: true };
}
