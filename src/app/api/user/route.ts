// src/app/api/user/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json(
      { message: 'Missing username parameter' },
      { status: 400 }
    );
  }

  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB || 'cumble';
    const db = client.db(dbName);
    const profiles = db.collection('profiles');

    // look up by email = "<username>@caltech.edu"
    const email = `${username}@caltech.edu`;
    const userProfile = await profiles.findOne({ email });

    if (!userProfile) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
