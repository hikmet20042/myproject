import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');
    const parsedPage = Number.parseInt(rawPage ?? '');
    const parsedLimit = Number.parseInt(rawLimit ?? '');
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50 ? parsedLimit : 10;
    const search = (searchParams.get('search') || '').trim();
    const source = (searchParams.get('source') || '').trim();

    const scriptPath = path.join(process.cwd(), 'scripts', 'query_sqlite_news.py');
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');

    const args = [scriptPath, '--page', String(page), '--limit', String(limit), '--gender-only', '1'];
    if (search) {
      args.push('--search', search);
    }
    if (source) {
      args.push('--source', source);
    }

    const result = await new Promise<any>((resolve, reject) => {
      const proc = spawn(pythonExecutable, args, {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => (stdout += d.toString('utf-8')));
      proc.stderr.on('data', (d) => (stderr += d.toString('utf-8')));
      proc.on('error', (err) => reject(err));
      proc.on('close', (code) => {
        if (code === 0) {
          try {
            // Find JSON from output (strip logs)
            const lines = stdout.trim().split('\n');
            let jsonOutput = '';
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                jsonOutput = lines.slice(lines.indexOf(line)).join('\n');
                break;
              }
            }
            const parsed = JSON.parse(jsonOutput || stdout);
            resolve(parsed);
          } catch (e) {
            console.error('Parse error:', e);
            console.error('Raw stdout:', stdout);
            reject(new Error(`Failed to parse Python output: ${(e as Error).message}`));
          }
        } else {
          console.error('Python stderr:', stderr);
          reject(new Error(stderr || `Python exited with code ${code}`));
        }
      });
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching news articles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to fetch news articles',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Manual creation of news articles is disabled. News is ingested only by the admin-run scraper.' },
    { status: 405 }
  );
}
