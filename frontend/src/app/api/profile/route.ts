// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(req: Request) {
  try {
    const profile = await req.json();
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const profiles = db.collection('profiles');
    const result = await profiles.insertOne(profile);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: 'Error saving profile' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
