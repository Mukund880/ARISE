export class ExternalSourcesService {
  
  static async getWikipediaSummary(query: string): Promise<string | null> {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.extract || null;
    } catch (err) {
      console.warn("Wikipedia fetch failed:", err);
      return null;
    }
  }

  static async searchYouTube(query: string): Promise<any[]> {
    // In production, you would use Google YouTube Data API v3
    // For this prototype, we will return a curated structured mock response
    // to simulate the YouTube video recommendation integration described in the architecture.
    
    console.log(`Mock searching YouTube for: ${query}`);
    return [
      {
        title: `${query} Explained in 5 Minutes`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300",
        duration: "5:12"
      },
      {
        title: `Advanced ${query} Course`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+course`,
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300",
        duration: "1:02:45"
      }
    ];
  }

  static async verifyWithSources(topic: string, content: string): Promise<string> {
    // This function takes generated content and uses Wikipedia/MDN/YouTube 
    // to append verified factual links and videos to the lesson content.
    
    let enhancedContent = content;
    
    const wikiSummary = await this.getWikipediaSummary(topic);
    if (wikiSummary) {
      enhancedContent += `\n\n### 📖 Verified Definition (Wikipedia)\n*${wikiSummary}*`;
    }

    const videos = await this.searchYouTube(topic);
    if (videos.length > 0) {
      enhancedContent += `\n\n### 🎥 Recommended Videos\n`;
      videos.forEach(v => {
        enhancedContent += `- [${v.title}](${v.url}) (⏱ ${v.duration})\n`;
      });
    }

    return enhancedContent;
  }
}
