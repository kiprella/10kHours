import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/utils/mongodb';

type CollectionName = 'activities' | 'timeLogs' | 'goals' | 'timerState';

function resolveCollection(type: string): CollectionName {
  switch (type) {
    case 'activities':
    case 'timeLogs':
    case 'goals':
    case 'timerState':
      return type;
    default:
      throw new Error('Invalid storage type');
  }
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (!type) {
    return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
  }

  try {
    const collection = resolveCollection(type);
    const db = await getDb();
    if (collection === 'timerState') {
      const state = await db.collection(collection).findOne({ key: 'singleton' });
      return NextResponse.json(state ? state.value : null);
    }
    const items = await db.collection(collection).find({}).toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (!type) {
    return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
  }

  try {
    const collection = resolveCollection(type);
    const newItem = await request.json();
    const db = await getDb();
    if (collection === 'timerState') {
      await db.collection(collection).updateOne(
        { key: 'singleton' },
        { $set: { value: newItem }, $setOnInsert: { key: 'singleton' } },
        { upsert: true }
      );
      return NextResponse.json(newItem);
    }
    await db.collection(collection).insertOne(newItem);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const id = request.nextUrl.searchParams.get('id');
  if (!type) {
    return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
  }

  try {
    const collection = resolveCollection(type);
    const updatedItem = await request.json();
    const db = await getDb();
    if (collection === 'timerState') {
      await db.collection(collection).updateOne(
        { key: 'singleton' },
        { $set: { value: updatedItem }, $setOnInsert: { key: 'singleton' } },
        { upsert: true }
      );
      return NextResponse.json(updatedItem);
    }
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    const result = await db.collection(collection).updateOne({ id }, { $set: updatedItem });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const id = request.nextUrl.searchParams.get('id');
  if (!type || (type !== 'timerState' && !id)) {
    return NextResponse.json({ error: 'Type parameter is required, and ID is required for non-timerState types' }, { status: 400 });
  }

  try {
    const collection = resolveCollection(type);
    const db = await getDb();
    if (collection === 'timerState') {
      await db.collection(collection).deleteOne({ key: 'singleton' });
      return NextResponse.json({ success: true });
    }
    await db.collection(collection).deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
} 