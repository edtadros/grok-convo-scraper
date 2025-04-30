# Grok Convo Scraper

A Chrome extension to scrape conversations from Grok AI and convert them to markdown format for sharing with other AI services.

## Features

- Scrapes entire conversations from Grok AI
- Converts the conversations to readable markdown format
- Simple one-click interface to trigger the scraping process
- Download conversations as markdown files

## Installation

### Development Mode

1. Clone this repository:
   ```bash
   git clone https://github.com/edtadros/grok-convo-scraper.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by clicking the toggle in the top right corner

4. Click "Load unpacked" and select the `grok-convo-scraper` directory

The extension will now be installed in your browser in development mode.

## Usage

1. Navigate to a webpage with a Grok AI conversation
2. Click the Grok Convo Scraper icon in the Chrome toolbar
3. Click the "Scrape Conversations" button in the popup
4. The conversation will be converted to markdown format and downloaded

## Development

### Project Structure

```
grok-convo-scraper/
│
├── src/
│   ├── background.js  - Manages the extension's lifecycle
│   ├── content.js     - Handles web scraping
│   └── popup.html     - User interface
│
├── images/            - Contains extension icons (to be added)
├── manifest.json      - Extension configuration
└── README.md          - This file
```

### Todo

- [ ] Create extension icons
- [ ] Implement specific scraping logic for Grok AI conversations
- [ ] Add download functionality for the markdown files
- [ ] Improve markdown formatting for better readability

## License

This project is licensed under the MIT License - see the LICENSE file for details.
