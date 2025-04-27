// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const database = client.db('cumble'); // <-- Replace with your real db name
    const profiles = database.collection('profiles');

    // Fetch all users
    const allUsers = await profiles.find({}).toArray();

    // Optional: only return necessary fields (not the whole Mongo _id and internal stuff)
    const sanitizedUsers = allUsers.map(user => ({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      neighborhoods: user.neighborhoods || [],
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}
