// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(req: Request) {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    const { _id, ...profile } = await req.json();
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const profiles = db.collection('profiles');

    if (!profile.firebase_id) {
      return NextResponse.json(
        { success: false, message: 'Missing firebase_id' },
        { status: 400 }
      );
    }

    await profiles.updateOne(
      { firebase_id: profile.firebase_id },
      { $set: profile },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
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

export async function GET(request: Request) {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    const { searchParams } = new URL(request.url);
    const firebase_id = searchParams.get('firebase_id');

    if (!firebase_id) {
      return NextResponse.json(
        { success: false, message: 'Missing firebase_id' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const profiles = db.collection('profiles');
    const profile = await profiles.findOne({ firebase_id });

    if (!profile) {
      return NextResponse.json({ success: true, exists: false });
    }

    return NextResponse.json({ success: true, exists: true, profile });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: 'Error fetching profile' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
