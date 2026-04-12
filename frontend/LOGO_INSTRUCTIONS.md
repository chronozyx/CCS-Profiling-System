# CCS Logo Setup Instructions

## Current Status
The system is configured to use a CCS logo. Currently, an SVG placeholder is being used.

## How to Add Your Actual CCS Logo

### Option 1: Using PNG/JPG Image
1. Place your `ccs.png` (or `ccs.jpg`) file in the `frontend/public/` folder
2. The logo will automatically be displayed in the sidebar
3. Recommended size: 200x200 pixels or larger (square format works best)
4. The image will be automatically resized to 45x45px in the sidebar

### Option 2: Keep Using the SVG Logo
The current SVG logo is already implemented and displays:
- Orange circular background
- White inner circle
- "CCS" text in orange
- Decorative dots around the circle

If you want to customize the SVG logo:
1. Open `frontend/src/components/Logo.jsx`
2. Modify the SVG code to match your design
3. You can change:
   - Colors (currently using orange palette)
   - Text
   - Shapes and decorative elements

## Logo Specifications

### Current Implementation
- **Location**: `frontend/src/components/Logo.jsx` (SVG) or `frontend/public/ccs.png` (Image)
- **Display Size**: 50x50px in sidebar
- **Background**: White rounded square (12px border radius)
- **Shadow**: `0 4px 12px rgba(0, 0, 0, 0.2)`
- **Hover Effect**: Scale(1.05) and rotate(5deg)

### Recommended Image Specs
- **Format**: PNG with transparent background (preferred) or JPG
- **Size**: 200x200px minimum (square)
- **File Size**: Under 100KB for optimal loading
- **Colors**: Should work well with orange theme

## Switching Between SVG and Image Logo

### To Use Image Logo:
In `frontend/src/App.jsx`, the code is already set to use the image:
```jsx
<img src="/ccs.png" alt="CCS Logo" className="logo-image" />
```

### To Use SVG Logo:
Replace the img tag with:
```jsx
<Logo />
```
And make sure the import is present:
```jsx
import Logo from './components/Logo';
```

## Current Setup
The system is currently configured to use the **image logo** from `/public/ccs.png`.
Simply replace the placeholder file with your actual logo image.
