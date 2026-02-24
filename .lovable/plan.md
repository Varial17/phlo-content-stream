

# Email Preview Tool for Newsletter Posts

## What This Does
Adds an "Email Preview" button to newsletter/email posts that opens a new browser tab showing the post content rendered as a clean, email-ready HTML layout. You can then copy the raw HTML and paste it directly into Beehiiv or Kit's custom HTML block.

## How It Works

1. **New "Email Preview" button** appears in the post edit panel (right side of All Posts page) when viewing any post -- but especially useful for `email` channel posts.

2. **Clicking it opens a new route** (`/admin/email-preview/:postId`) in a new browser tab showing:
   - The post content rendered as a styled email preview (white background, max-width 600px, Georgia/Arial font, inline CSS)
   - A top toolbar with:
     - **"Preview" / "HTML" toggle** to switch between the rendered view and raw HTML code
     - **"Copy HTML" button** that copies the full inline-styled HTML to clipboard with a "Copied!" toast

3. **The HTML output** uses only inline CSS (no external stylesheets) so it pastes cleanly into any email builder. It formats the post hook as a bold H2 header and the body as styled paragraphs with proper line-height and spacing.

## Files to Create / Edit

### New Files
- **`src/pages/admin/EmailPreview.tsx`** -- The full-page email preview component
  - Fetches the post by ID from the database
  - Generates email-compatible HTML with inline styles from the post's hook + body
  - Renders preview mode (iframe or dangerouslySetInnerHTML in a contained div) and HTML mode (raw code in a `<pre>` block)
  - "Copy HTML" button using `navigator.clipboard.writeText()`
  - Toggle between Preview and HTML views using Tabs component

### Edited Files
- **`src/App.tsx`** -- Add route `/admin/email-preview/:postId` pointing to the new page
- **`src/pages/admin/AllPosts.tsx`** -- Add an "Email Preview" button in the edit panel that opens the new route in a new tab via `window.open()`

## Technical Details

### Email HTML Template Structure
- Inline CSS only (no `<style>` blocks for maximum email client compatibility)
- `max-width: 600px`, centered, white background
- Font: Georgia with Arial fallback
- Line-height: 1.8
- Hook rendered as bold H2 (~22px, dark gray, underlined)
- Body text split by newlines into `<p>` tags (16px)
- Horizontal rules between logical sections
- All styling via `style=""` attributes on each element

### Route & Auth
- The new page is wrapped in `AuthGuard` like other admin routes
- Post data fetched via Supabase query using the `postId` URL param

### Copy Functionality
- Generates a complete standalone HTML string (with `<!DOCTYPE html>`, `<html>`, `<body>` wrapper)
- Uses `navigator.clipboard.writeText()` to copy
- Shows a sonner toast confirmation on success

