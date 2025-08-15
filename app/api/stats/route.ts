
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Simple in-memory cache (per period)
const statsCache: { [period: string]: { data: any, timestamp: number } } = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');
    const periodKey = String(period);

    // Serve from cache if fresh
    const cached = statsCache[periodKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const scraperPath = path.join(process.cwd(), 'bakuplus_scraper.py');
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');

    return await new Promise<Response>((resolve) => {
      const scraper = spawn(pythonExecutable, [scraperPath, 'stats'], {
        cwd: process.cwd(),
        env: { ...process.env },
        shell: true,
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
            const lines = output.trim().split('\n');
            let jsonOutput = '';
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                jsonOutput = lines.slice(lines.indexOf(line)).join('\n');
                break;
              }
            }
            const py = JSON.parse(jsonOutput || output);
            const stats = py?.stats || py; // get_database_stats returns { success, stats }

            // Fetch extra computed stats (sources + monthly trend)
            const extrasScript = path.join(process.cwd(), 'scripts', 'sqlite_stats_extras.py');
            const extrasPromise: Promise<any> = new Promise((resolveExtras) => {
              const proc = spawn(pythonExecutable, [extrasScript, '--months', '6'], {
                cwd: process.cwd(),
                env: { ...process.env },
                shell: true,
              });
              let out = '';
              proc.stdout.on('data', (d) => (out += d.toString()));
              proc.on('close', () => {
                try { resolveExtras(JSON.parse(out || '{}')); } catch { resolveExtras({}); }
              });
              proc.on('error', () => resolveExtras({}));
            });
            extrasPromise.then((extras) => {
              const response = {
                lastUpdated: new Date().toISOString(),
                disclaimer: 'Statistics generated from local SQLite analysis database',
                summary: {
                  totalNews: Number(stats?.total_articles || 0), // analyzed news
                  recentPeriod: Number(stats?.gender_related_count || 0), // gender violence found
                  changeFromPrevious: 0,
                  periodDays: period,
                },
                newsBySource: Array.isArray(extras?.sources) ? extras.sources : [],
                monthlyTrend: Array.isArray(extras?.monthly_trend) ? extras.monthly_trend : [],
                period: `${period} days`,
              };

              // Store in cache
              statsCache[periodKey] = { data: response, timestamp: Date.now() };

              resolve(NextResponse.json(response));
            });
            return; // prevent fall-through
          } else {
            resolve(
              NextResponse.json(
                {
                  error: 'Failed to get statistics',
                  details: errorOutput || `Exit code: ${code}`,
                  success: false,
                },
                { status: 500 }
              )
            );
          }
        } catch (parseError) {
          resolve(
            NextResponse.json(
              {
                error: 'Failed to parse statistics response',
                details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
                rawOutput: output.slice(0, 1000),
                success: false,
              },
              { status: 500 }
            )
          );
        }
      });

      scraper.on('error', (error) => {
        resolve(
          NextResponse.json(
            {
              error: `Failed to start scraper: ${error.message}`,
              success: false,
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
