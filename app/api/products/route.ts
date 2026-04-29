import { NextResponse } from 'next/server';

export async function GET() {
  const url =
    process.env.GOOGLE_SHEET_CSV_URL ||
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?output=csv';

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  return NextResponse.json({
    status: res.status,
    first500: text.slice(0, 500)
  });
}
