import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const apiKey = process.env.KNOWLEDGE_GRAPH_API_KEY || process.env.GEMINI_API_KEY;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ entities: [] });
    }

    const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('Google Knowledge Graph API error response:', data.error);
      return NextResponse.json({ error: data.error.message || 'API error' }, { status: 400 });
    }

    const entities = (data.itemListElement || []).map((item: any) => {
      const result = item.result;
      return {
        name: result.name || '',
        description: result.description || '',
        detailedDescription: result.detailedDescription?.articleBody || '',
        url: result.detailedDescription?.url || '',
        imageUrl: result.image?.contentUrl || null
      };
    });

    return NextResponse.json({ entities });
  } catch (error) {
    console.error('Knowledge Graph API route error:', error);
    return NextResponse.json({ error: 'Failed to search Knowledge Graph' }, { status: 500 });
  }
}
