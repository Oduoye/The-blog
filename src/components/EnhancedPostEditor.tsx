import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadBlogImage } from "@/lib/imageUpload"; // This utility needs to be updated
import { X, Link, AlertCircle, Type, Heading1, Heading2, Heading3, Table, Plus, Minus, Code, Copy, Image as ImageIcon, Video } from "lucide-react"; // Renamed Image to ImageIcon to avoid conflict with interface
import DOMPurify from 'dompurify'; // Assuming DOMPurify is installed for sanitization on save/render

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  paragraphText?: string;
}

interface EnhancedPostEditorProps {
  content: string;
  mediaItems: MediaItem[];
  onContentChange: (content: string) => void;
  onMediaChange: (mediaItems: MediaItem[]) => void;
}

const EnhancedPostEditor = ({ content, mediaItems, onContentChange, onMediaChange }: EnhancedPostEditorProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [headingText, setHeadingText] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeContent, setCodeContent] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    setIsUploading(true);
    try {
      console.log('Starting image upload for blog post...');
      // uploadBlogImage needs to be updated to use the correct bucket in lib/imageUpload.ts
      const imageUrl = await uploadBlogImage(file);
      
      const newMediaItem: MediaItem = {
        id: Date.now().toString(),
        type: 'image',
        url: imageUrl,
        caption: ''
      };
      
      onMediaChange([...mediaItems, newMediaItem]);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      
      console.log('Image uploaded and added to media items');
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addYouTubeVideo = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    const newMediaItem: MediaItem = {
      id: Date.now().toString(),
      type: 'video',
      url: youtubeUrl,
      caption: ''
    };

    onMediaChange([...mediaItems, newMediaItem]);
    setYoutubeUrl("");
    
    toast({
      title: "Success",
      description: "YouTube video added successfully!",
    });
  };

  const removeMediaItem = (id: string) => {
    onMediaChange(mediaItems.filter(item => item.id !== id));
    
    toast({
      title: "Removed",
      description: "Media item removed from post.",
    });
  };

  const updateMediaCaption = (id: string, caption: string) => {
    onMediaChange(mediaItems.map(item => 
      item.id === id ? { ...item, caption } : item
    ));
  };

  const updateMediaParagraph = (id: string, paragraphText: string) => {
    onMediaChange(mediaItems.map(item => 
      item.id === id ? { ...item, paragraphText } : item
    ));
  };

  const insertLinkText = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both link text and URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(linkUrl);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    const linkMarkup = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${linkText}</a>`;
    onContentChange(content + linkMarkup);
    setLinkText("");
    setLinkUrl("");
    
    toast({
      title: "Success",
      description: "Link inserted into content!",
    });
  };

  const insertHeading = (level: 1 | 2 | 3) => {
    if (!headingText.trim()) {
      toast({
        title: "Error",
        description: "Please enter heading text.",
        variant: "destructive",
      });
      return;
    }

    const headingTag = `h${level}`;
    const headingMarkup = `<${headingTag} class="text-${level === 1 ? '2xl' : level === 2 ? 'xl' : 'lg'} font-bold text-gray-900 mt-8 mb-4">${headingText}</${headingTag}>`;
    
    // Add some spacing before the heading if content exists
    const spacing = content.trim() ? '\n\n' : '';
    onContentChange(content + spacing + headingMarkup);
    setHeadingText("");
    
    toast({
      title: "Success",
      description: `H${level} heading inserted!`,
    });
  };

  const insertTable = () => {
    if (tableRows < 1 || tableCols < 1 || tableRows > 10 || tableCols > 10) {
      toast({
        title: "Error",
        description: "Table must have 1-10 rows and 1-10 columns.",
        variant: "destructive",
      });
      return;
    }

    // Create table HTML with proper styling
    let tableHTML = '<table class="w-full border-collapse border border-gray-300 my-6">\n';
    
    // Create header row
    tableHTML += '  <thead>\n    <tr class="bg-gray-100">\n';
    for (let col = 0; col < tableCols; col++) {
      tableHTML += `      <th class="border border-gray-300 px-4 py-2 text-left font-semibold">Header ${col + 1}</th>\n`;
    }
    tableHTML += '    </tr>\n  </thead>\n';
    
    // Create body rows
    tableHTML += '  <tbody>\n';
    for (let row = 0; row < tableRows - 1; row++) { // -1 because header is already created
      tableHTML += '    <tr>\n';
      for (let col = 0; col < tableCols; col++) {
        tableHTML += `      <td class="border border-gray-300 px-4 py-2">Cell ${row + 1}-${col + 1}</td>\n`;
      }
      tableHTML += '    </tr>\n';
    }
    tableHTML += '  </tbody>\n</table>';

    // Add some spacing before the table if content exists
    const spacing = content.trim() ? '\n\n' : '';
    onContentChange(content + spacing + tableHTML);
    
    toast({
      title: "Success",
      description: `Table (${tableRows}x${tableCols}) inserted successfully!`,
    });
  };

  const insertCodeBlock = () => {
    if (!codeContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter code content.",
        variant: "destructive",
      });
      return;
    }

    // Escape HTML in code content to prevent XSS
    const escapedCode = codeContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const codeBlockHTML = `
<div class="code-block-container">
  <div class="code-header">
    <span class="code-language ${codeLanguage}">${codeLanguage}</span>
    <button class="copy-code-button" onclick="copyCodeToClipboard(this)" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    </button>
  </div>
  <pre><code class="language-${codeLanguage}">${escapedCode}</code></pre>
</div>`;

    // Add some spacing before the code block if content exists
    const spacing = content.trim() ? '\n\n' : '';
    onContentChange(content + spacing + codeBlockHTML);
    setCodeContent("");
    
    toast({
      title: "Success",
      description: `${codeLanguage} code block inserted successfully!`,
    });
  };

  const renderMediaItem = (item: MediaItem) => {
    if (item.type === 'image') {
      return (
        <img 
          src={item.url} 
          alt={item.caption || "Post image"} 
          className="w-full h-48 object-cover rounded-lg"
          onError={(e) => {
            console.error('Failed to load image:', item.url);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    } else {
      const videoId = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return (
        <div className="relative w-full h-48">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            className="w-full h-full rounded-lg"
            allowFullScreen
          />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write your post content here..."
          rows={10}
          required
        />
        <p className="text-xs text-gray-500">
          You can use HTML tags for formatting. Links and media items will be added separately below.
        </p>
      </div>

      {/* Heading Insertion */}
      <div className="space-y-4">
        <Label>Insert Headings</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Heading text"
            value={headingText}
            onChange={(e) => setHeadingText(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => insertHeading(1)}
            disabled={!headingText.trim()}
            title="Insert H1 Heading"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => insertHeading(2)}
            disabled={!headingText.trim()}
            title="Insert H2 Heading"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => insertHeading(3)}
            disabled={!headingText.trim()}
            title="Insert H3 Heading"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Enter heading text and click H1, H2, or H3 to insert structured headings into your article.
        </p>
      </div>

      {/* Table Creation */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Table className="h-4 w-4" />
          Create Table
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="table-rows" className="text-sm">Rows (1-10)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                disabled={tableRows <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                id="table-rows"
                type="number"
                min="1"
                max="10"
                value={tableRows}
                onChange={(e) => setTableRows(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTableRows(Math.min(10, tableRows + 1))}
                disabled={tableRows >= 10}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-cols" className="text-sm">Columns (1-10)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                disabled={tableCols <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                id="table-cols"
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTableCols(Math.min(10, tableCols + 1))}
                disabled={tableCols >= 10}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={insertTable}
            className="flex items-center gap-2"
          >
            <Table className="h-4 w-4" />
            Insert Table ({tableRows}x{tableCols})
          </Button>
          <div className="text-xs text-gray-500">
            Creates a table with {tableRows} rows and {tableCols} columns
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Tables are created with placeholder content that you can edit directly in the content area after insertion.
        </p>
      </div>

      {/* Code Block Insertion */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Insert Code Block
        </Label>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code-language" className="text-sm">Programming Language</Label>
            <Select value={codeLanguage} onValueChange={setCodeLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="bash">Bash/Shell</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="swift">Swift</SelectItem>
                <SelectItem value="kotlin">Kotlin</SelectItem>
                <SelectItem value="plaintext">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-content" className="text-sm">Code Content</Label>
            <Textarea
              id="code-content"
              placeholder="Enter your code here..."
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              style={{ fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={insertCodeBlock}
            disabled={!codeContent.trim()}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            Insert Code Block
          </Button>
          <div className="text-xs text-gray-500">
            Code will be syntax highlighted for {codeLanguage}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Code blocks include syntax highlighting and a copy-to-clipboard button for better user experience.
        </p>
      </div>

      {/* Link Text Insertion */}
      <div className="space-y-4">
        <Label>Insert Link Text</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="URL (https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={insertLinkText}
            disabled={!linkText.trim() || !linkUrl.trim()}
          >
            <Link className="h-4 w-4 mr-2" />
            Insert Link
          </Button>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-4">
        <Label>Additional Media</Label>
        
        {/* Upload Controls */}
        <div className="flex flex-wrap gap-4">
          <div>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <ImageIcon className="h-4 w-4 mr-2" /> {/* Used ImageIcon */}
                  {isUploading ? "Uploading..." : "Add Image"}
                </span>
              </Button>
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={addYouTubeVideo}
              disabled={!youtubeUrl.trim()}
              className="w-full sm:w-auto"
            >
              <Video className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </div>

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Uploading image...</span>
          </div>
        )}

        {/* Media Items Display */}
        {mediaItems.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Media Items ({mediaItems.length})</h4>
            {mediaItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {renderMediaItem(item)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMediaItem(item.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Caption (optional)"
                  value={item.caption || ''}
                  onChange={(e) => updateMediaCaption(item.id, e.target.value)}
                />
                <Textarea
                  placeholder="Additional paragraph text (optional)"
                  value={item.paragraphText || ''}
                  onChange={(e) => updateMediaParagraph(item.id, e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Media Upload Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Images are automatically optimized and stored securely</li>
                <li>Supported formats: JPG, PNG, GIF, WebP, SVG (max 10MB)</li>
                <li>YouTube videos are embedded responsively</li>
                <li>Captions and additional text are optional but recommended for accessibility</li>
                <li>Use headings (H1, H2, H3) to structure your content for better readability</li>
                <li>Tables are created with placeholder content that you can edit after insertion</li>
                <li>Code blocks support 20+ programming languages with syntax highlighting</li>
                <li>All code blocks include a copy-to-clipboard feature for readers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPostEditor;
