# Feature 212: Carousel Export

## Goal

Let users export their carousels as files ready to upload to LinkedIn.

## Description

Export the completed carousel as PDF (LinkedIn's native document format), PNG (individual slide images), or ZIP (all slides as separate PNGs). The export renders each slide at the correct resolution for LinkedIn's document viewer.

## Acceptance Criteria

- [ ] User can export as PDF
- [ ] User can export as PNG (individual slides)
- [ ] User can export as ZIP (all slides)
- [ ] Exported files are at the correct resolution for LinkedIn
- [ ] Loading/progress indicator during export
- [ ] Toast confirmation on successful export

## Technical Notes

- PDF generation: consider jsPDF, pdf-lib, or server-side rendering via Puppeteer
- PNG generation: html2canvas or dom-to-image to capture each slide as an image
- ZIP generation: JSZip for bundling multiple PNGs
- LinkedIn document dimensions: 1080x1080px (square) or 1080x1350px (portrait) - confirm current spec
- Export triggered from the carousel editor toolbar
- Client-side generation preferred to avoid server costs; fall back to server if quality is insufficient
- Loading state during export with progress indication
