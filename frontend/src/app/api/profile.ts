// pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const profiles = db.collection('profiles');
    const result = await profiles.insertOne(req.body);
    return res.status(200).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error saving profile' });
  } finally {
    await client.close();
  }
}
