# Pixel Refine

Professional starter website for an all-in-one image, PDF and utility tools platform.

## Included
- 16-tool responsive homepage
- Tool search and category filters
- Professional responsive UI
- Light/dark mode
- Working password generator
- QR code generator UI
- Upload modal for all other tools
- GitHub Pages-friendly static structure

## Production note
AI Background Remover, AI Upscaler, Photo Colorize/Enhancer, PDF conversion/compression/merge/split and Barcode generation need a processing engine/API to be connected. The frontend is intentionally structured so those endpoints can be added without changing the overall design.

## Run
Open `index.html` locally, or upload the three files to a GitHub repository and enable GitHub Pages.

## Suggested production architecture
Frontend: GitHub Pages / static hosting
Backend: serverless API or VPS
Storage: temporary object storage only when required
AI: background removal/upscaling/colorization API or self-hosted models
PDF: server-side PDF processing/conversion
