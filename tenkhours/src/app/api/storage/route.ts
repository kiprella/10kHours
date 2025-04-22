import { NextRequest, NextResponse } from 'next/server';
import { Activity, TimeLog, Goal, TimerState } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const TIME_LOGS_FILE = path.join(DATA_DIR, 'timeLogs.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const TIMER_STATE_FILE = path.join(DATA_DIR, 'timerState.json');

// Helper function to get storage data
const getStorageData = (type: string): any[] | any => {
  try {
    let filePath;
    switch (type) {
      case 'activities':
        filePath = ACTIVITIES_FILE;
        break;
      case 'timeLogs':
        filePath = TIME_LOGS_FILE;
        break;
      case 'goals':
        filePath = GOALS_FILE;
        break;
      case 'timerState':
        filePath = TIMER_STATE_FILE;
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, 'null', 'utf8');
          return null;
        }
        const timerData = fs.readFileSync(filePath, 'utf8');
        return timerData === 'null' ? null : JSON.parse(timerData);
      default:
        throw new Error('Invalid storage type');
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${type} data:`, error);
    return type === 'timerState' ? null : [];
  }
};

// Helper function to save storage data
const setStorageData = (type: string, data: any[] | any): void => {
  try {
    let filePath;
    switch (type) {
      case 'activities':
        filePath = ACTIVITIES_FILE;
        break;
      case 'timeLogs':
        filePath = TIME_LOGS_FILE;
        break;
      case 'goals':
        filePath = GOALS_FILE;
        break;
      case 'timerState':
        filePath = TIMER_STATE_FILE;
        break;
      default:
        throw new Error('Invalid storage type');
    }

    // Ensure the directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const content = type === 'timerState' && data === null ? 'null' : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing ${type} data:`, error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (!type) {
    return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
  }

  try {
    const data = getStorageData(type);
    return NextResponse.json(data);
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
    const newItem = await request.json();
    if (type === 'timerState') {
      setStorageData(type, newItem);
      return NextResponse.json(newItem);
    }
    const items = getStorageData(type);
    items.push(newItem);
    setStorageData(type, items);
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
    const updatedItem = await request.json();
    if (type === 'timerState') {
      setStorageData(type, updatedItem);
      return NextResponse.json(updatedItem);
    }
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    const items = getStorageData(type);
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    items[index] = updatedItem;
    setStorageData(type, items);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const id = request.nextUrl.searchParams.get('id');
  if (!type || !id) {
    return NextResponse.json({ error: 'Type and ID parameters are required' }, { status: 400 });
  }

  try {
    if (type === 'timerState') {
      setStorageData(type, null);
      return NextResponse.json({ success: true });
    }
    const items = getStorageData(type);
    const filteredItems = items.filter((item: any) => item.id !== id);
    setStorageData(type, filteredItems);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
} 