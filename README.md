# Grok Convo Scraper

Grok Convo Scraper is a Chrome extension designed to seamlessly extract and convert conversations from Grok AI into markdown format. This tool is perfect for users who want to archive, share, or further process their AI interactions in a structured and readable format.

## Features

- **Comprehensive Scraping**: Capture entire conversations from Grok AI with ease.
- **Markdown Conversion**: Automatically convert conversations into a clean, readable markdown format.
- **User-Friendly Interface**: Initiate the scraping process with a simple click.
- **Downloadable Output**: Save conversations as markdown files for easy sharing and storage.

## Limitations

- The current version of the Grok Convo Scraper does not support scraping or embedding images in the markdown output. Images are skipped during the scraping process. This feature may be considered for future updates.

## Installation

### Development Mode

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/edtadros/grok-convo-scraper.git
   ```

2. **Enable Developer Mode in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" on in the top right corner.

3. **Load the Extension**:
   - Click "Load unpacked" and select the `grok-convo-scraper` directory.

The extension is now ready to use in your browser in development mode.

## Usage

1. **Navigate to a Grok AI Conversation**: Open a webpage containing a Grok AI conversation.
2. **Activate the Extension**: Click the Grok Convo Scraper icon in the Chrome toolbar.
3. **Scrape the Conversation**: Click the "Scrape Conversations" button in the popup.
4. **Download the Markdown**: The conversation will be converted and downloaded as a markdown file.

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

## AI-Assisted Development

This project was primarily developed using various AI tools, with human guidance and direction. The development process leveraged the strengths of multiple AI systems:

- **Grok AI**: Assisted with planning and conceptual tasks.
- **ChatGPT**: Helped with specific code optimization and problem-solving.
- **Claude**: Contributed to documentation and code refinement.

The human role involved directing the AI systems, defining requirements, making key decisions, and ensuring the final product met the intended functionality. This project demonstrates how AI tools can be effectively utilized to create software with minimal manual coding.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
