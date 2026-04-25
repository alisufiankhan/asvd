import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('download-form');
  const urlInput = document.getElementById('video-url');
  const loadingState = document.getElementById('loading-state');
  const resultArea = document.getElementById('result-area');
  const errorMsg = document.getElementById('error-message');

  // Result Elements
  const videoTitle = document.getElementById('video-title');
  const videoMeta = document.getElementById('video-meta');
  const videoThumb = document.getElementById('video-thumbnail');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    // Reset UI
    resultArea.classList.add('hidden');
    errorMsg.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
      // Detect if in development or production to set the API base URL
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      
      // Real API CALL - calls our Node.js backend
      const response = await fetch(`${API_BASE}/api/download?url=${encodeURIComponent(url)}`);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Network response was not ok');
      }
      
      // Populate Data
      videoTitle.textContent = data.title;
      videoMeta.textContent = `${data.platform} • ${data.duration} • ${data.quality}`;
      videoThumb.src = data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"; // Fallback thumbnail
      
      // Update Download Links
      const directDlBtn = document.getElementById('direct-dl-btn');
      const audioDlBtn = document.getElementById('audio-dl-btn');
      
      const setupDownloadBtn = (btn, url) => {
        btn.onclick = (e) => {
          e.preventDefault();
          // Directly navigate to the proxy URL which has Content-Disposition: attachment
          // This prevents strict mobile browsers from blocking pop-ups.
          const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
          const proxyUrl = API_BASE + "/api/proxy?url=" + encodeURIComponent(url);
          window.location.href = proxyUrl;
        };
      };
      
      if (data.downloadUrl) {
        directDlBtn.removeAttribute('href');
        setupDownloadBtn(directDlBtn, data.downloadUrl);
        directDlBtn.style.display = 'inline-flex';
      } else {
        directDlBtn.style.display = 'none';
      }

      if (data.audioUrl) {
        audioDlBtn.removeAttribute('href');
        setupDownloadBtn(audioDlBtn, data.audioUrl);
        audioDlBtn.style.display = 'inline-flex';
      } else {
        audioDlBtn.style.display = 'none';
      }
      
      // Update UI
      loadingState.classList.add('hidden');
      resultArea.classList.remove('hidden');
      
    } catch (err) {
      console.error(err);
      loadingState.classList.add('hidden');
      document.getElementById('error-text').textContent = err.message || 'Failed to fetch video. Please check the URL and try again.';
      errorMsg.classList.remove('hidden');
    }
  });

});
