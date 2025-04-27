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
     // pull body in, but strip out any _id before we update
    const { _id, ...profile } = req.body;
    if (!profile.firebase_id) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing firebase_id' });
    }

    // upsert by firebase_id without ever touching _id
    await profiles.updateOne(
      { firebase_id: profile.firebase_id },
      { $set: profile },
      { upsert: true }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error saving profile' });
  } finally {
    await client.close();
  }
}
