import React from 'react';
import { SimpleEditor } from './tiptap-templates/simple/simple-editor';

/**
 * Tiptap Simple Editor Component
 * Official Tiptap Simple Template with rich toolbar, SEO-ready semantic HTML output,
 * search & replace, image upload, text alignment, highlight, and hidden form input sync.
 */
export default function TiptapEditor(props) {
  return <SimpleEditor {...props} />;
}

export { SimpleEditor };
