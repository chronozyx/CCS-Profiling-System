# How to Add CCS Logo

## Quick Steps

ur CCS logo image file** on your computer
2. **Copy the file** to: `frontend/public/ccs.png`
3. **Restart the dev server** if it's running

That's it! The logo will automatically appear in the sidebar.

## File Requirements

- **File name**: Must be exactly `ccs.png` (or update the path in App.jsx)
- **Location**: `frontend/public/` folder
- **Format**: PNG (preferred with transparent background) or JPG
- **Recommended size**: 200x200 pixels or la(square format)
- **File size**: Under 100KB for best performance

## Current Setup

The sidebar is configured in:
- **Component**: `frontend/src/App.jsx` (lines with sidebar code)
- **Styles**: `frontend/src/App.css` (sidebar and logo styles)
- **Logo path**: `/ccs.png` (references `frontend/public/ccs.png`)

## If You Don't Have the Logo Yet

The system includes a fallback SVG logo component at:
- `frontend/Logo.jsx`

To use the SVG logo instead:
1. Open `frontend/src/App.jsx`
2. Find the line: `<img src="/ccs.png" alt="CCS Logo" className="logo-image" />`
3. Replace with: `<Logo />`
4. Make sure the import exists: `import Logo from './components/Logo';`

## Sidebar Location

The sidebar code is in:
- **File**: `frontend/src/App.jsx`
- **Section**: Lines 50-75 (approximately)
- **Styles**: `frontend/src/App.css` (search for `.sidebar`)

## Need Help?

If you need to:
- Change the logo size
- Modify sidebar colors
- Adjust logo positioning

Edit these files:
- `frontend/src/App.css` (for styling)
- `frontend/src/App.jsx` (for structure)
