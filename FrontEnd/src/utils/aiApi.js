import axios from 'axios';

// The AI microservice runs standalone on port 8000.
// (The existing frontend talks to each Spring service directly on its own port,
//  so we follow the same convention here.)
const AI_BASE_URL =
  process.env.REACT_APP_AI_BASE_URL || '${process.env.REACT_APP_AI_URL}';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 120000, // generous: LLM tool-loops can take a while on first run
});

// Attach the JWT (issued by the Spring `Secure` service) on every call.
aiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const aiApi = {
  // ----- Chat -----
  chat: ({ question, session_id }) =>
    aiClient.post('/ai/chat', { question, session_id }),

  getHistory: (session_id) =>
    aiClient.get('/ai/chat/history', { params: { session_id } }),

  // ----- Knowledge base -----
  ingest: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return aiClient.post('/ai/ingest', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listDocuments: () => aiClient.get('/ai/documents'),

  deleteDocument: (docId) => aiClient.delete(`/ai/documents/${docId}`),

  // ----- Health -----
  health: () => aiClient.get('/ai/health'),
};

export default aiApi;
