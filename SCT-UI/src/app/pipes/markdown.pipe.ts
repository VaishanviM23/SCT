import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown'
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Basic markdown-to-HTML conversion
    let html = value
      // Code blocks (must be before inline code)
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="code-block"><code class="language-$1">$2</code></pre>')
      // Headers
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Bullet lists
      .replace(/^\• (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      // Wrap consecutive list items in ul tags
      .replace(/(<li>.*?<\/li>\s*)+/gs, (match) => `<ul>${match}</ul>`)
      // Horizontal rules
      .replace(/^---$/gim, '<hr>')
      // Line breaks (double newline = paragraph, single = br)
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
    
    // Wrap in paragraph if not already wrapped in a block element
    if (!html.match(/^<(h[1-6]|p|ul|ol|pre|blockquote|div)/)) {
      html = '<p>' + html + '</p>';
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}