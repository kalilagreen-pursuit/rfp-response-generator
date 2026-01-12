import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Proxy video request to Gemini API with server-side authentication
 * GET /api/video/proxy?url=<encoded_video_url>
 */
export const proxyVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({
        error: 'Missing URL',
        message: 'Video URL parameter is required'
      });
      return;
    }

    // Decode the video URL
    const videoUrl = decodeURIComponent(url);

    // Add API key to the URL server-side
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'Server configuration error',
        message: 'GEMINI_API_KEY not configured'
      });
      return;
    }

    // Construct the authenticated video URL
    const separator = videoUrl.includes('?') ? '&' : '?';
    const authenticatedUrl = `${videoUrl}${separator}key=${apiKey}`;

    // Fetch the video from Gemini API
    const videoResponse = await fetch(authenticatedUrl);

    if (!videoResponse.ok) {
      res.status(videoResponse.status).json({
        error: 'Video fetch failed',
        message: `Failed to fetch video: ${videoResponse.statusText}`
      });
      return;
    }

    // Get the video content type
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the video to the client
    const videoBuffer = await videoResponse.arrayBuffer();
    res.send(Buffer.from(videoBuffer));
  } catch (error) {
    console.error('Video proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

