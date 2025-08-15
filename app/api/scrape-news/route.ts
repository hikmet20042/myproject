import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { spawn } from 'child_process';
import path from 'path';

// Global variable to track scraper process
let currentScraperProcess: any = null;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (optional - remove if you want public access)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body to check for fast mode
    let fastMode = false;
    try {
      const body = await request.json();
      fastMode = body.fastMode === true;
    } catch {
      // If no body or invalid JSON, use default mode
    }

    // Run the unified Bakuplus scraper
    const scraperPath = path.join(process.cwd(), 'bakuplus_scraper.py');
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    
    // Build arguments based on mode
    const args = fastMode ? [scraperPath, 'scrape', '--fast'] : [scraperPath, 'scrape'];
    
    return new Promise<Response>((resolve) => {
      const scraper = spawn(pythonExecutable, args, {
        cwd: process.cwd(),
        env: { ...process.env },
        shell: true  // Use shell for better Windows compatibility
      });

      // Store reference to current process
      currentScraperProcess = scraper;

      let output = '';
      let errorOutput = '';

      scraper.stdout.on('data', (data) => {
        output += data.toString();
      });

      scraper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      scraper.on('close', (code) => {
        try {
          if (code === 0 && output.trim()) {
            // Extract JSON from output (skip logging lines)
            const lines = output.trim().split('\n');
            let jsonOutput = '';
            
            // Find the JSON part (starts with {)
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                jsonOutput = lines.slice(lines.indexOf(line)).join('\n');
                break;
              }
            }
            
            const result = JSON.parse(jsonOutput || output);
            
            if (result.success) {
              resolve(NextResponse.json({
                message: result.message,
                stats: result.stats,
                timestamp: result.timestamp,
                success: true
              }));
            } else {
              resolve(NextResponse.json({
                error: result.error || 'Scraping failed',
                success: false
              }, { status: 500 }));
            }
          } else {
            resolve(NextResponse.json({
              error: 'Scraper process failed',
              details: errorOutput || `Exit code: ${code}`,
              success: false
            }, { status: 500 }));
          }
        } catch (parseError) {
          resolve(NextResponse.json({
            error: 'Failed to parse scraper response',
            details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            rawOutput: output.slice(-500),
            success: false
          }, { status: 500 }));
        }
      });

      scraper.on('error', (error) => {
        resolve(NextResponse.json({
          error: `Failed to start scraper: ${error.message}`,
          success: false
        }, { status: 500 }));
      });

      // Set timeout for long-running operations
      const timeout = setTimeout(() => {
        scraper.kill();
        resolve(NextResponse.json({
          error: 'Scraping operation timed out',
          success: false
        }, { status: 408 }));
      }, 5 * 60 * 1000); // 5 minutes timeout

      scraper.on('close', () => {
        clearTimeout(timeout);
        currentScraperProcess = null; // Clear reference when done
      });
    });
  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to stop scraper
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!currentScraperProcess) {
      return NextResponse.json({
        message: 'No scraper process is currently running',
        success: true
      });
    }

    try {
      // Kill the process tree on Windows
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${currentScraperProcess.pid} /T /F`, (error: any) => {
          if (error) {
            console.warn('Error killing process tree:', error.message);
          }
        });
      } else {
        currentScraperProcess.kill('SIGTERM');
      }
      
      currentScraperProcess = null;
      
      return NextResponse.json({
        message: 'Scraper stopped successfully',
        success: true
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to stop scraper',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Stop scraper API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for database statistics
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const scraperPath = path.join(process.cwd(), 'bakuplus_scraper.py');
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    
    return new Promise<Response>((resolve) => {
      const scraper = spawn(pythonExecutable, [scraperPath, 'stats'], {
        cwd: process.cwd(),
        env: { ...process.env },
        shell: true  // Use shell for better Windows compatibility
      });

      let output = '';
      let errorOutput = '';

      scraper.stdout.on('data', (data) => {
        output += data.toString();
      });

      scraper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      scraper.on('close', (code) => {
        try {
          if (code === 0 && output.trim()) {
            // Extract JSON from output (skip logging lines)
            const lines = output.trim().split('\n');
            let jsonOutput = '';
            
            // Find the JSON part (starts with {)
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                jsonOutput = lines.slice(lines.indexOf(line)).join('\n');
                break;
              }
            }
            
            const result = JSON.parse(jsonOutput || output);
            resolve(NextResponse.json(result));
          } else {
            resolve(NextResponse.json({
              error: 'Failed to get statistics',
              details: errorOutput || `Exit code: ${code}`,
              success: false
            }, { status: 500 }));
          }
        } catch (parseError) {
          resolve(NextResponse.json({
            error: 'Failed to parse statistics response',
            details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            rawOutput: output.slice(0, 1000),
            success: false
          }, { status: 500 }));
        }
      });

      scraper.on('error', (error) => {
        resolve(NextResponse.json({
          error: `Failed to start scraper: ${error.message}`,
          success: false
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
