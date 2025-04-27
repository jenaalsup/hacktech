// src/app/api/user/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; // Your MongoDB connection string
const client = new MongoClient(uri);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  try {
    await client.connect();
    const database = client.db('your_database_name'); // Replace with your database name
    const profiles = database.collection('profiles');

    const userProfile = await profiles.findOne({ email: `${username}@caltech.edu` }); // Fetch user by email

    if (userProfile) {
      return NextResponse.json(userProfile);
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
}