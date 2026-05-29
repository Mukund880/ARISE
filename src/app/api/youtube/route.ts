import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY env variable is not set');
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // Append 'tutorial' or 'education' to get higher quality learning guides
    const searchQuery = `${query} education tutorial`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=6&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error('YouTube API Response error:', errText);
      throw new Error(`YouTube API returned status ${res.status}`);
    }

    const data = await res.json();
    
    const videos = (data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('API Route Error (youtube):', error);
    return NextResponse.json({ error: 'Failed to search YouTube videos' }, { status: 500 });
  }
}
