import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/** Escape raw HTML so atom bodies can never inject markup. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Markdown → HTML for content atoms (headings, lists, emphasis, links). Raw HTML in the source is escaped. */
export function renderMarkdown(md: string): string {
  return marked.parse(escapeHtml(md), { async: false }) as string;
}
