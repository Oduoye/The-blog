import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import hljs from 'highlight.js'
import { safeSetTimeout } from './lib/utils'

// Initialize highlight.js
hljs.configure({
  languages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'sql', 'bash', 'json', 'xml', 'yaml', 'markdown', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin']
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Highlight code blocks after initial render
if (typeof window !== 'undefined') {
  safeSetTimeout(() => {
    hljs.highlightAll();
  }, 100);
}
