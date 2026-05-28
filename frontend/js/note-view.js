// ═══════════════════════════════════════════════════════════════════════════
// NOTE VIEW - FIXED VERSION WITH WORKING PDF VIEWER
// ═══════════════════════════════════════════════════════════════════════════

if (!Auth.isLoggedIn()) {
  window.location.href = '../index.html';
} else {
  initNoteView();
}

let currentNote = null;
let extractedText = '';
let chatHistory = [];

// ─── INITIALIZATION ──────────────────────────────────────────────────────────

async function initNoteView() {
  buildLayout('feed');
  let noteId = window.location.hash.substring(1);

  // If no noteId in query, check if it's in the path (e.g., /pages/note-view/123)
  if (!noteId) {
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (!isNaN(lastPart) && lastPart !== '') {
      noteId = lastPart;
    }
  }

  console.log('Note View Initialization - noteId:', noteId);

  if (!noteId || noteId === 'undefined' || noteId === 'null') {
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Invalid Note Request</h3>
        <p>No note ID was provided in the URL. Please go back to the feed and try again.</p>
        <a href="feed.html" class="btn btn-primary mt-4">Back to Feed</a>
      </div>`;
    return;
  }

  const res = await api.get(`/notes/${noteId}`);
  if (!res || !res.ok) {
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😕</div>
        <h3>Note not found</h3>
        <p>${res?.data?.message || 'This note may have been deleted.'}</p>
        <a href="feed.html" class="btn btn-primary mt-4">Back to Feed</a>
      </div>`;
    return;
  }

  currentNote = res.data.data;
  renderNote(currentNote);
}

// ─── RENDER NOTE ─────────────────────────────────────────────────────────────

function renderNote(note) {
  const user = Auth.getUser();
  const isOwner = user && note.authorId === user.id;
  const sc = subjectColor(note.subject);

  document.title = `${note.title} – NoteSphere`;

  // Build PDF/Image viewer - FIXED VERSION
  let fileViewerHtml = '';
  if (note.hasFile && note.fileUrl) {
    const isPdf = note.fileType && note.fileType.includes('pdf');
    const isImage = note.fileType && (
      note.fileType.includes('image') ||
      note.fileType.includes('png') ||
      note.fileType.includes('jpg') ||
      note.fileType.includes('jpeg') ||
      note.fileType.includes('gif') ||
      note.fileType.includes('webp')
    );

    fileViewerHtml = `
      <div class="card fade-up" style="margin-bottom:20px">
        <h3 style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          ${icons.file} Attached File
        </h3>

        <!-- FILE INFO -->
        <div style="background:var(--bg-input);border:1px solid var(--border);
                    border-radius:var(--radius-lg);padding:20px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">${isPdf ? '📄' : '🖼️'}</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px">
            ${escapeHtml(note.fileName || 'Attached File')}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">
            ${isPdf ? 'PDF Document' : 'Image File'}
          </div>

          <!-- ACTION BUTTONS -->
          <div class="file-actions-grid">
            <a href="${note.fileUrl}"
               target="_blank"
               rel="noopener noreferrer"
               class="file-action-card">
              <div class="file-action-icon">${isPdf ? '📄' : '🖼️'}</div>
              <div class="file-action-title">Open in New Tab</div>
              <div class="file-action-desc">View in browser</div>
            </a>

            <a href="${note.fileUrl}"
               download="${note.fileName || 'file'}"
               class="file-action-card">
              <div class="file-action-icon">⬇️</div>
              <div class="file-action-title">Download</div>
              <div class="file-action-desc">Save to device</div>
            </a>

            ${isPdf ? `
            <a href="https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true"
               target="_blank"
               rel="noopener noreferrer"
               class="file-action-card">
              <div class="file-action-icon">🌐</div>
              <div class="file-action-title">Google Viewer</div>
              <div class="file-action-desc">View with Google</div>
            </a>
            ` : ''}

          </div>
        </div>

        <!-- EMBEDDED VIEWER -->
        ${isPdf ? `
        <div class="pdf-embed-container">
          <iframe
            src="${note.fileUrl}"
            class="pdf-embed-frame"
            title="PDF Viewer">
          </iframe>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px;text-align:center">
          💡 If PDF doesn't load above, click "Open in New Tab" or "Google Viewer"
        </p>
        ` : `
        <img src="${note.fileUrl}"
             alt="${escapeHtml(note.fileName || 'Attached image')}"
             class="image-viewer"
             loading="lazy"/>
        `}

        <!-- OCR STATUS -->
        <div id="ocr-status-container"></div>
        <div id="extracted-text-container"></div>
      </div>`;
  }

  const html = `
    <a href="feed.html" class="back-link fade-up">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      Back to Feed
    </a>

    <div class="note-viewer">
      <div class="note-viewer-main">

        <!-- NOTE HEADER -->
        <div class="card fade-up" style="margin-bottom:20px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                <span style="background:${sc}22;color:${sc};padding:3px 12px;border-radius:99px;font-size:12px;font-weight:700">
                  ${escapeHtml(note.subject)}
                </span>
                ${note.hasFile ? `<span class="badge badge-accent">${icons.file} Attachment</span>` : ''}
              </div>
              <h1 style="font-size:1.6rem;margin-bottom:8px">${escapeHtml(note.title)}</h1>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                ${avatarHtml(note.authorName, '#6366f1')}
                <span style="font-size:14px;font-weight:600;color:var(--text-primary)">${escapeHtml(note.authorName)}</span>
                <span class="text-muted text-sm">·</span>
                <span class="text-muted text-sm">${timeAgo(note.createdAt)}</span>
                ${note.tags?.length ? note.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : ''}
              </div>
            </div>
            ${isOwner ? `<div style="display:flex;gap:6px;flex-shrink:0">
              <a href="upload.html?edit=${note.id}" class="btn btn-secondary btn-sm">${icons.edit} Edit</a>
            </div>` : ''}
          </div>

          <!-- VOTE ROW -->
          <div style="display:flex;align-items:center;gap:8px;padding-top:16px;border-top:1px solid var(--border)">
            <button class="vote-btn ${note.userVote === 'UPVOTE' ? 'upvoted' : ''}" id="upvote-btn" ${isOwner ? 'disabled' : ''}>
              ${icons.upvote} <span id="upvote-count">${note.upvotes}</span> Upvote
            </button>
            <button class="vote-btn ${note.userVote === 'DOWNVOTE' ? 'downvoted' : ''}" id="downvote-btn" ${isOwner ? 'disabled' : ''}>
              ${icons.downvote} <span id="downvote-count">${note.downvotes}</span> Downvote
            </button>
            <span class="text-muted text-sm" style="margin-left:auto">
              ${icons.comment} <span id="comment-count">${note.commentCount}</span> comments
            </span>
          </div>
        </div>

        <!-- FILE VIEWER -->
        ${fileViewerHtml}

        <!-- CONTENT -->
        ${note.content ? `
          <div class="card fade-up" style="margin-bottom:20px">
            <h3 style="margin-bottom:14px">Note Content</h3>
            <div class="note-content-body">${escapeHtml(note.content)}</div>
          </div>` : ''}

        <!-- COMMENTS -->
        <div class="card fade-up">
          <h3 style="margin-bottom:20px">Discussion <span class="text-muted text-sm" id="comments-heading"></span></h3>
          <div style="display:flex;gap:10px;margin-bottom:20px">
            ${avatarHtml(user?.name, user?.avatarColor)}
            <div style="flex:1">
              <textarea class="form-textarea" id="comment-input"
                placeholder="Share your thoughts… (Ctrl+Enter to post)"
                style="min-height:70px;resize:none"></textarea>
              <div style="margin-top:8px;text-align:right">
                <button class="btn btn-primary btn-sm" id="post-comment-btn">Post Comment</button>
              </div>
            </div>
          </div>
          <div id="comments-list">
            <div class="ai-loading"><div class="spinner"></div> Loading…</div>
          </div>
        </div>

      </div>

      <!-- SIDEBAR -->
      <div class="note-viewer-sidebar">



        <!-- ASK AI -->
        <div class="card fade-up">
          <h3 style="margin-bottom:14px;display:flex;align-items:center;gap:8px">${icons.chat} Ask AI About This ${note.hasFile ? 'Document' : 'Note'}</h3>
          <p class="text-sm text-muted" style="margin-bottom:12px">
            ${note.hasFile ? 'Ask questions about the document content. Extract text first for best results.' : 'Ask questions about this note.'}
          </p>
          <div id="chatbot-conversation" class="chatbot-conversation hidden"></div>
          <textarea class="form-textarea" id="note-ai-q"
            placeholder="${note.hasFile ? 'e.g., What are the key points in this document?' : 'Ask about this note…'}"
            style="min-height:80px;resize:none;margin-bottom:10px"></textarea>
          <button class="btn btn-secondary w-full" id="ask-note-ai-btn">
            ${icons.send} Ask AI
          </button>
        </div>

        <!-- NOTE DETAILS -->
        <div class="card fade-up">
          <h3 style="margin-bottom:14px">Details</h3>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
            <div style="display:flex;justify-content:space-between">
              <span class="text-muted">Subject</span><strong>${escapeHtml(note.subject)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-muted">Author</span><strong>${escapeHtml(note.authorName)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-muted">Posted</span>
              <strong>${(parseDate(note.createdAt) || new Date()).toLocaleDateString()}</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-muted">Rating</span>
              <strong class="text-green">+${note.upvotes - note.downvotes}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>`;

  document.getElementById('main-content').innerHTML = html;

  // ── Event Listeners ──
  setupEventListeners();
}

// ─── SETUP EVENT LISTENERS ───────────────────────────────────────────────────

function setupEventListeners() {
  // Votes
  document.getElementById('upvote-btn')?.addEventListener('click', () => doVote('UPVOTE'));
  document.getElementById('downvote-btn')?.addEventListener('click', () => doVote('DOWNVOTE'));

  // Comments
  loadComments();
  document.getElementById('post-comment-btn').addEventListener('click', postComment);
  document.getElementById('comment-input').addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') postComment();
  });

  // AI Features
  document.getElementById('gen-summary-btn')?.addEventListener('click', generateSummary);
  document.getElementById('ask-note-ai-btn')?.addEventListener('click', askNoteAi);

  // OCR Extraction
  document.getElementById('extract-text-btn')?.addEventListener('click', extractTextFromFile);
}

// ─── VOTING ──────────────────────────────────────────────────────────────────

async function doVote(type) {
  const res = await api.post(`/notes/${currentNote.id}/vote?type=${type}`);
  if (!res || !res.ok) {
    Toast.error(res?.data?.message || 'Vote failed');
    return;
  }
  const n = res.data.data;
  document.getElementById('upvote-count').textContent = n.upvotes;
  document.getElementById('downvote-count').textContent = n.downvotes;
  document.getElementById('upvote-btn').classList.toggle('upvoted', n.userVote === 'UPVOTE');
  document.getElementById('downvote-btn').classList.toggle('downvoted', n.userVote === 'DOWNVOTE');
  currentNote = n;
}

// ─── COMMENTS ────────────────────────────────────────────────────────────────

async function loadComments() {
  const res = document.getElementById('comments-list');
  const data = await api.get(`/notes/${currentNote.id}/comments`);
  if (!data || !data.ok) {
    res.innerHTML = '<p class="text-muted text-sm">Failed to load comments</p>';
    return;
  }
  const comments = data.data.data;
  const user = Auth.getUser();
  document.getElementById('comments-heading').textContent = `(${comments.length})`;
  document.getElementById('comment-count').textContent = comments.length;

  if (!comments.length) {
    res.innerHTML = '<p class="text-muted text-sm" style="text-align:center;padding:20px 0">No comments yet. Be the first!</p>';
    return;
  }

  res.innerHTML = comments.map(c => `
    <div class="comment-item">
      ${avatarHtml(c.authorName, '#6366f1')}
      <div class="comment-body">
        <div>
          <span class="comment-author">${escapeHtml(c.authorName)}</span>
          <span class="comment-time">${timeAgo(c.createdAt)}</span>
          ${(user && (c.authorId === user.id || user.role === 'ADMIN'))
            ? `<span class="comment-delete" data-id="${c.id}">Delete</span>` : ''}
        </div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
      </div>
    </div>`).join('');

  document.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this comment?')) return;
      const r = await api.delete(`/notes/comments/${btn.dataset.id}`);
      if (r && r.ok) {
        Toast.success('Comment deleted');
        loadComments();
      } else {
        Toast.error(r?.data?.message || 'Failed');
      }
    });
  });
}

async function postComment() {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;
  const btn = document.getElementById('post-comment-btn');
  btn.disabled = true;
  btn.textContent = 'Posting…';
  const res = await api.post(`/notes/${currentNote.id}/comments`, { content });
  btn.disabled = false;
  btn.textContent = 'Post Comment';
  if (res && res.ok) {
    input.value = '';
    Toast.success('Comment added');
    loadComments();
  } else {
    Toast.error(res?.data?.message || 'Failed to post');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OCR & TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

async function extractTextFromFile() {
  if (!currentNote.fileUrl) {
    Toast.error('No file attached to this note');
    return;
  }

  const isPdf = currentNote.fileType && currentNote.fileType.includes('pdf');
  const isImage = currentNote.fileType && (
    currentNote.fileType.includes('image') ||
    currentNote.fileType.includes('png') ||
    currentNote.fileType.includes('jpg') ||
    currentNote.fileType.includes('jpeg')
  );

  if (!isPdf && !isImage) {
    Toast.error('Only PDF and image files are supported for text extraction');
    return;
  }

  const btn = document.getElementById('extract-text-btn');
  const statusContainer = document.getElementById('ocr-status-container');
  const textContainer = document.getElementById('extracted-text-container');

  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.innerHTML = `
    <div class="file-action-icon"><div class="spinner" style="width:24px;height:24px;margin:0 auto"></div></div>
    <div class="file-action-title">Extracting...</div>
    <div class="file-action-desc">Please wait</div>
  `;

  statusContainer.innerHTML = `
    <div class="ocr-status processing">
      <div class="spinner" style="width:14px;height:14px"></div>
      <span>Processing ${isPdf ? 'PDF' : 'image'}...</span>
      <div class="ocr-progress">
        <div class="ocr-progress-bar" id="ocr-progress-bar" style="width:0%"></div>
      </div>
    </div>
  `;

  try {
    let text = '';

    if (isPdf) {
      text = await extractTextFromPDF(currentNote.fileUrl);
    } else if (isImage) {
      text = await extractTextFromImage(currentNote.fileUrl);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    extractedText = text;

    statusContainer.innerHTML = `
      <div class="ocr-status success">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Text extracted successfully! (${text.length} characters)</span>
      </div>
    `;

    textContainer.innerHTML = `
      <div class="extracted-text-preview">${escapeHtml(text.substring(0, 500))}${text.length > 500 ? '...\n\n[Click "Analyze & Summarize" to process full text]' : ''}</div>
    `;

    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerHTML = `
      <div class="file-action-icon">✅</div>
      <div class="file-action-title">Text Extracted</div>
      <div class="file-action-desc">Ready to use</div>
    `;

    Toast.success('Text extracted! You can now use AI Summary and Ask AI features.');

  } catch (error) {
    console.error('Text extraction error:', error);

    statusContainer.innerHTML = `
      <div class="ocr-status error">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>Extraction failed: ${error.message}</span>
      </div>
    `;

    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerHTML = `
      <div class="file-action-icon">📝</div>
      <div class="file-action-desc">Try again</div>
    `;

    Toast.error('Failed to extract text. Please try again.');
  }
}

// ─── PDF TEXT EXTRACTION ─────────────────────────────────────────────────────

async function extractTextFromPDF(pdfUrl) {
  const progressBar = document.getElementById('ocr-progress-bar');

  try {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Load PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';

      // Update progress
      if (progressBar) {
        const progress = (pageNum / totalPages) * 100;
        progressBar.style.width = `${progress}%`;
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. The file might be scanned or corrupted.');
  }
}

// ─── IMAGE OCR EXTRACTION ────────────────────────────────────────────────────

async function extractTextFromImage(imageUrl) {
  const progressBar = document.getElementById('ocr-progress-bar');

  try {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text' && progressBar) {
            progressBar.style.width = `${Math.round(m.progress * 100)}%`;
          }
        }
      }
    );

    return result.data.text.trim();
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to perform OCR on image. The image might be too low quality.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI SUMMARY (WITH OCR CONTENT)
// ═══════════════════════════════════════════════════════════════════════════

async function generateSummary() {
  const btn = document.getElementById('gen-summary-btn');
  const loading = document.getElementById('summary-loading');
  const result = document.getElementById('summary-result');

  // Prepare content for summary
  let contentToSummarize = '';

  if (extractedText) {
    contentToSummarize = `EXTRACTED FILE CONTENT:\n${extractedText}\n\n`;
  }

  if (currentNote.content) {
    contentToSummarize += `NOTE CONTENT:\n${currentNote.content}`;
  }

  if (!contentToSummarize.trim()) {
    Toast.error('No content available to summarize. Please add note content or extract text from the file first.');
    return;
  }

  btn.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    // If we have extracted text, send it to the backend for summary
    const res = await api.post('/ai/summarize-content', {
      noteId: currentNote.id,
      content: contentToSummarize,
      hasExtractedText: !!extractedText
    });

    loading.classList.add('hidden');

    if (res && res.ok) {
      const summary = res.data.data.summary;
      result.classList.remove('hidden');
      result.innerHTML = `
        <div class="summary-enhanced">
          <div class="summary-enhanced-title">
            ${icons.ai} AI-Generated Summary
          </div>
          <div class="summary-enhanced-content">${escapeHtml(summary)}</div>
          ${extractedText ? `
            <div class="summary-source-info">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Summary includes extracted ${currentNote.fileType.includes('pdf') ? 'PDF' : 'image'} content
            </div>
          ` : ''}
        </div>
      `;
      Toast.success('Summary generated successfully!');
    } else {
      btn.classList.remove('hidden');
      const errorMsg = res?.data?.message || 'AI service unavailable';

      if (errorMsg.includes('unavailable') || errorMsg.includes('API key')) {
        Toast.error('⚠️ AI service unavailable. Please add your OpenAI API key to application.properties and restart the backend.');
      } else {
        Toast.error(errorMsg);
      }
    }
  } catch (error) {
    loading.classList.add('hidden');
    btn.classList.remove('hidden');
    console.error('Summary generation error:', error);
    Toast.error('Failed to generate summary. Please try again.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CHATBOT (WITH OCR CONTENT)
// ═══════════════════════════════════════════════════════════════════════════

async function askNoteAi() {
  const questionInput = document.getElementById('note-ai-q');
  const question = questionInput.value.trim();

  if (!question) {
    Toast.error('Please enter a question');
    return;
  }

  const btn = document.getElementById('ask-note-ai-btn');
  const conversationDiv = document.getElementById('chatbot-conversation');

  // Show conversation area
  conversationDiv.classList.remove('hidden');

  // Add user question to chat
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = question;
  conversationDiv.appendChild(userBubble);
  conversationDiv.scrollTop = conversationDiv.scrollHeight;

  // Clear input and disable button
  questionInput.value = '';
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:14px;height:14px"></div> Asking AI...`;

  // Prepare context for AI
  let contextContent = '';

  if (extractedText) {
    contextContent = `DOCUMENT CONTENT:\n${extractedText}\n\n`;
  }

  if (currentNote.content) {
    contextContent += `NOTE CONTENT:\n${currentNote.content}\n\n`;
  }

  if (!contextContent.trim()) {
    contextContent = 'No content available. ';
  }

  const fullMessage = `${contextContent}USER QUESTION: ${question}`;

  try {
    const res = await api.post('/ai/chat', {
      message: fullMessage,
      noteId: currentNote.id
    });

    btn.disabled = false;
    btn.innerHTML = `${icons.send} Ask AI`;

    if (res && res.ok) {
      const answer = res.data.data.reply;

      // Add AI response to chat
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble ai';
      aiBubble.textContent = answer;
      conversationDiv.appendChild(aiBubble);
      conversationDiv.scrollTop = conversationDiv.scrollHeight;

      // Store in history
      chatHistory.push({ question, answer });
    } else {
      const errorMsg = res?.data?.message || 'AI service unavailable';

      const errorBubble = document.createElement('div');
      errorBubble.className = 'chat-bubble ai';
      errorBubble.style.borderColor = 'var(--red)';
      errorBubble.style.background = 'var(--red-subtle)';
      errorBubble.textContent = errorMsg.includes('unavailable') || errorMsg.includes('API key')
        ? '⚠️ AI service unavailable. Please add your OpenAI API key to application.properties and restart the backend.'
        : `Error: ${errorMsg}`;
      conversationDiv.appendChild(errorBubble);
      conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = `${icons.send} Ask AI`;
    console.error('AI chat error:', error);

    const errorBubble = document.createElement('div');
    errorBubble.className = 'chat-bubble ai';
    errorBubble.style.borderColor = 'var(--red)';
    errorBubble.style.background = 'var(--red-subtle)';
    errorBubble.textContent = 'Failed to get AI response. Please try again.';
    conversationDiv.appendChild(errorBubble);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }
}