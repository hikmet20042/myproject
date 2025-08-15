import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    
    const db = client.db('gender-equality-az');
    
    // Perform a simple database operation
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        collections: collections.length
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    return NextResponse.json(health, { status: 503 });
  }
}
