// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined'); 
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('cumble'); // <-- Replace with your real db name
    const profiles = database.collection('profiles');

    // Fetch all users
    const allUsers = await profiles.find({}).toArray();

    // Optional: only return necessary fields
    const sanitizedUsers = allUsers.map(user => ({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      country: user.country,
      city: user.city,
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
