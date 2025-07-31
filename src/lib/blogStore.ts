// Blog store types and utilities for enhanced content management

// The primary BlogPost interface is now sourced from Supabase types (Database['blog']['Tables']['posts']['Row'])
// We will keep other related interfaces and utilities here.

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  paragraphText?: string;
}

export interface SocialHandles {
  twitter?: string;
  youtube?: string;
  facebook?: string;
  telegram?: string;
  linkedin?: string; // Included based on BlogFooter and ContactManagement
  instagram?: string; // Included based on BlogFooter and ContactManagement
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  title?: string;
  description?: string;
}

// Supported programming languages for syntax highlighting
export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'java', label: 'Java', color: '#ed8b00' },
  { value: 'cpp', label: 'C++', color: '#00599c' },
  { value: 'c', label: 'C', color: '#00599c' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#1572b6' },
  { value: 'sql', label: 'SQL', color: '#336791' },
  { value: 'bash', label: 'Bash/Shell', color: '#4eaa25' },
  { value: 'json', label: 'JSON', color: '#000000' },
  { value: 'xml', label: 'XML', color: '#0060ac' },
  { value: 'yaml', label: 'YAML', color: '#cb171e' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
  { value: 'php', label: 'PHP', color: '#777bb4' },
  { value: 'ruby', label: 'Ruby', color: '#cc342d' },
  { value: 'go', label: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', color: '#ce422b' },
  { value: 'swift', label: 'Swift', color: '#fa7343' },
  { value: 'kotlin', label: 'Kotlin', color: '#7f52ff' },
  { value: 'plaintext', label: 'Plain Text', color: '#333333' }
];

// Utility functions for code block management
export const codeBlockUtils = {
  // Generate a unique ID for code blocks
  generateId: (): string => {
    return `code-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  },

  // Escape HTML in code content
  escapeHtml: (code: string): string => {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Generate HTML for a code block
  generateCodeBlockHtml: (language: string, code: string, title?: string): string => {
    const escapedCode = codeBlockUtils.escapeHtml(code);
    const blockId = codeBlockUtils.generateId();
    
    return `
<div class="code-block-container" data-code-id="${blockId}">
  <div class="code-header">
    <span class="code-language ${language}">${language}${title ? ` - ${title}` : ''}</span>
    <button class="copy-code-button" onclick="copyCodeToClipboard(this)" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    </button>
  </div>
  <pre><code class="language-${language}">${escapedCode}</code></pre>
</div>`;
  },

  // Extract code blocks from HTML content
  extractCodeBlocks: (htmlContent: string): CodeBlock[] => {
    const codeBlocks: CodeBlock[] = [];
    // Ensure DOMParser is available in the environment (e.g., browser)
    if (typeof DOMParser === 'undefined') {
      console.warn('DOMParser not available, cannot extract code blocks.');
      return [];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const codeContainers = doc.querySelectorAll('.code-block-container');

    codeContainers.forEach((container) => {
      const languageElement = container.querySelector('.code-language');
      const codeElement = container.querySelector('code');
      const codeId = container.getAttribute('data-code-id');

      if (languageElement && codeElement && codeId) {
        const language = Array.from(languageElement.classList).find(cls => cls !== 'code-language') || 'plaintext'; // New: use Array.from for classList
        const code = codeElement.textContent || '';
        
        codeBlocks.push({
          id: codeId,
          language,
          code,
        });
      }
    });

    return codeBlocks;
  },

  // Get language info by value
  getLanguageInfo: (language: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.value === language) || SUPPORTED_LANGUAGES[0];
  }
};
