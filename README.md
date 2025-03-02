# Web Navigation Assistant (works with any chrome or chromium based browser)

A Chrome extension that uses OpenAI's GPT-4o-mini to analyze websites and guide users with an animated mouse pointer [not working :(] and helpful instructions [working :)].

## Features

- Captures screenshots of the current tab
- Analyzes website content using OpenAI's GPT-4o-mini
- Provides two modes of assistance:
  - **Navigation Mode**: Shows an animated red mouse pointer to guide users through interactions
  - **General Q&A Mode**: Answers questions about the current page
- Allows users to provide specific prompts or questions
- Displays clear instructions based on the user's needs

## Installation

### Prerequisites

- Chrome browser or any chromium based browser
- OpenAI API key (with access to GPT-4o-mini)

### Development Setup

1. Clone this repository:
   ```
   git clone https://github.com/aidanandrews22/web-navigation-assistant.git
   cd web-navigation-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or if using pnpm:
   ```
   pnpm install
   ```

3. Build the extension:
   ```
   npm run build
   ```
   or if using pnpm:
   ```
   pnpm run build
   ```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the directory of this project
4. The extension should now appear in your extensions list

## Usage

1. Click on the extension icon in your browser toolbar
2. Enter your OpenAI API key and click "Save Key"
3. Choose a mode:
   - **Navigation Mode**: For help with specific tasks on the website
   - **General Q&A**: For asking questions about the page content

### Navigation Mode

1. Enter what you need help with (e.g., "Show me how to create an account", "Help me find the search button")
2. Click "Analyze Current Page"
3. The extension will show instructions and a red animated mouse pointer guiding you through the steps

### Q&A Mode

1. Enter your question about the current page (e.g., "What are the features of this product?", "What is this website about?")
2. Click "Get Answer"
3. The extension will analyze the page and provide a detailed answer to your question

## Development

- The main application logic is in `/src` directory
- TypeScript files are compiled to JavaScript using Webpack
- Content script injects the mouse pointer and instruction elements into web pages
- Background script handles communication with the OpenAI API

## Privacy & Security

- Screenshots of websites are sent to OpenAI's API for analysis
- Your API key is stored locally in your browser's storage
- No data is stored on external servers

## License

MIT 