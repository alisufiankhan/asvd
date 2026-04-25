import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/download', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let processedUrl = url;
    if (processedUrl.includes('x.com/')) {
      processedUrl = processedUrl.replace('x.com/', 'twitter.com/');
    }

    // Format duration helper
    const formatDuration = (seconds) => {
      if (!seconds) return 'Unknown';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    let platform = 'Unknown';
    if (url.includes('instagram')) platform = 'Instagram';
    else if (url.includes('tiktok')) platform = 'TikTok';
    else if (url.includes('twitter') || url.includes('x.com')) platform = 'X (Twitter)';
    else if (url.includes('youtube') || url.includes('youtu.be')) platform = 'YouTube';
    else if (url.includes('facebook') || url.includes('fb.watch')) platform = 'Facebook';

    let videoData;

    if (platform === 'TikTok') {
      console.log(`Using TikWM API for TikTok: ${processedUrl}`);
      const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(processedUrl)}`);
      const apiData = await apiRes.json();
      
      if (apiData.code === 0 && apiData.data) {
        videoData = {
          title: apiData.data.title || 'TikTok Video',
          platform: 'TikTok',
          duration: formatDuration(apiData.data.duration),
          quality: 'HD',
          thumbnail: apiData.data.cover || null,
          downloadUrl: apiData.data.play || apiData.data.wmplay,
          audioUrl: apiData.data.music || null
        };
      } else {
        throw new Error('Failed to extract TikTok video via API.');
      }
    } else {
      console.log(`Fetching data via yt-dlp for: ${processedUrl}`);
      
      // We use youtube-dl-exec to get the JSON metadata, which contains direct media links
      const output = await youtubedl(processedUrl, {
        dumpSingleJson: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
      });

      let downloadUrl = output.url; // Basic direct URL
      let quality = 'Standard';

      if (!downloadUrl && output.formats && output.formats.length > 0) {
        const videoFormats = output.formats.filter(f => f.ext === 'mp4' && f.vcodec !== 'none');
        if (videoFormats.length > 0) {
          videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
          downloadUrl = videoFormats[0].url;
          quality = `${videoFormats[0].height || 'HD'}p`;
        } else {
          downloadUrl = output.formats[output.formats.length - 1].url;
        }
      }

      let audioUrl = null;
      if (output.formats) {
        const audioFormats = output.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        if (audioFormats.length > 0) {
           audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
           audioUrl = audioFormats[0].url;
        } else {
           const formatsWithAudio = output.formats.filter(f => f.acodec !== 'none');
           if (formatsWithAudio.length > 0) {
               formatsWithAudio.sort((a, b) => (b.abr || 0) - (a.abr || 0));
               audioUrl = formatsWithAudio[0].url;
           } else {
               audioUrl = output.url;
           }
        }
      } else {
        audioUrl = output.url;
      }

      videoData = {
        title: output.title || 'Video Download',
        platform: platform,
        duration: formatDuration(output.duration),
        quality: quality || (output.resolution ? output.resolution : 'HD'),
        thumbnail: output.thumbnail || null,
        downloadUrl: downloadUrl || output.url,
        audioUrl: audioUrl
      };
    }

    res.json(videoData);
    
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch video details.' });
  }
});

app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    let referer = 'https://google.com/';
    if (url.includes('twimg') || url.includes('twitter') || url.includes('x.com')) referer = 'https://twitter.com/';
    else if (url.includes('tiktok') || url.includes('tikwm')) referer = 'https://www.tiktok.com/';
    else if (url.includes('instagram')) referer = 'https://www.instagram.com/';
    else if (url.includes('facebook') || url.includes('fbcdn')) referer = 'https://www.facebook.com/';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': referer
      }
    });
    
    if (!response.ok) {
      console.warn(`Proxy fetch failed with status ${response.status}. Redirecting to direct URL.`);
      return res.redirect(url);
    }

    // Force download by setting Content-Disposition
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const randomNum = Math.floor(Math.random() * 100000);
    res.setHeader('Content-Disposition', `attachment; filename="asvd_video_${randomNum}.mp4"`);
    res.setHeader('Content-Type', contentType);

    // Stream the response body
    const { Readable } = await import('stream');
    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Proxy streaming error:', error);
    res.status(500).send('Error downloading media file');
  }
});

app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
});
