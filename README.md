# Wedding Website

A simple, framework-free wedding website built with pure HTML, CSS and JavaScript.

## Run locally
Open `index.html` in any modern browser. No build step required.

## Customization
- **Assets:** Replace `hero.mp4`, `hero.webm`, and `poster.jpg` in the project root with your own media.
- **Theme:** Edit CSS variables in `styles.css` under `:root` to change colors, spacing, or fonts. An optional Google Fonts import is commented near the top.
- **Copy:** Update names, dates, venue details, timeline text, and form labels directly in `index.html`.

## RSVP backend
1. Create a Google Sheet and note its ID.
2. Open the sheet → Extensions → Apps Script and paste the contents of `apps-script.gs`.
3. Replace `SHEET_ID` and `SHEET_NAME` at the top of the script.
4. Deploy → **New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
5. Copy the Web App URL and set `APPS_SCRIPT_URL` in `script.js`.
6. Reload the site and send a test submission. Check the Google Sheet and the Apps Script Execution log for debugging.

If you see an "opaque" response due to missing CORS headers, the client still treats it as success. To read a JSON response, add an `Access-Control-Allow-Origin` header in `apps-script.gs`.

## Performance tips
- Compress video files and provide the `poster.jpg` for faster loads.
- Lazy‑load any additional images by setting `loading="lazy"`.
- If enabling web fonts, use `preconnect` to the font host and specify `display=swap`.

## Accessibility checklist
- Ensure focus order follows the visual flow. Use the provided skip link.
- Verify color contrast meets WCAG AA; adjust CSS variables if needed.
- Provide text alternatives for all media.
- If users prefer reduced motion, animations and autoplay video are disabled.

## Troubleshooting
- Form not submitting? Check the browser console for errors and the Apps Script Execution log.
- No spreadsheet row? Confirm `SHEET_ID`, `SHEET_NAME`, and deployment permissions.
- Autoplay blocked? Users may need to tap the hero video; the poster image will display otherwise.
