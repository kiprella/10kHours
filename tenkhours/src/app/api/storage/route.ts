import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Activity, TimeLog } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const TIME_LOGS_FILE = path.join(DATA_DIR, 'timeLogs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure JSON files exist
if (!fs.existsSync(ACTIVITIES_FILE)) {
  fs.writeFileSync(ACTIVITIES_FILE, '[]');
}
if (!fs.existsSync(TIME_LOGS_FILE)) {
  fs.writeFileSync(TIME_LOGS_FILE, '[]');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'activities') {
      const data = fs.readFileSync(ACTIVITIES_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } else if (type === 'timeLogs') {
      const data = fs.readFileSync(TIME_LOGS_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const data = await request.json();

  try {
    if (type === 'activities') {
      const activities = JSON.parse(fs.readFileSync(ACTIVITIES_FILE, 'utf-8'));
      const existingIndex = activities.findIndex((a: Activity) => a.id === data.id);
      
      if (existingIndex >= 0) {
        activities[existingIndex] = data;
      } else {
        activities.push(data);
      }
      
      fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
      return NextResponse.json({ success: true });
    } else if (type === 'timeLogs') {
      const logs = JSON.parse(fs.readFileSync(TIME_LOGS_FILE, 'utf-8'));
      logs.push(data);
      fs.writeFileSync(TIME_LOGS_FILE, JSON.stringify(logs, null, 2));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
} 