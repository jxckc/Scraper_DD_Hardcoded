# DoorDash Homepage Scraper Extension PRD

## Description

The DoorDash Homepage Scraper Extension is a browser extension designed for internal use at DoorDash. Its primary goal is to automate the daily collection of data from the DoorDash homepage across multiple zip codes to monitor and compare what users are seeing versus what is displayed in the demo environment. The extension will:

* Open a hidden browser tab daily at a scheduled time
* Log into the DoorDash website using predefined secure credentials
* Iterate through a list of 20 specified zip codes by swapping the delivery address
* Scrape listings from the first five carousels on the homepage, excluding any carousel named "Recently Viewed"
* Collect detailed data for each listing, including merchant name, image URL, description, pricing, promotions, and carousel name
* Store the collected data in a structured database
* Provide an interactive dashboard within the extension to view, filter, analyze, and export the data
* Utilize AgentQL for robust and adaptable DOM exploration and data extraction

By leveraging AgentQL and a well-structured extension architecture, this tool will offer a reliable and maintainable solution for tracking homepage listings across different regions.

## Core Features

### 1. Automated Daily Scraping

#### Scheduling:
* The extension will perform the scraping task automatically once per day at a configurable time (default is 3:00 AM local time)
* Users can adjust the scheduled time via the extension's settings interface

#### Headless Operation:
* Scraping occurs in a hidden or background tab to avoid interrupting the user's browsing experience
* The extension minimizes resource usage during operation to prevent system slowdowns

### 2. Secure Login Mechanism

#### Credential Storage:
* DoorDash account credentials are securely stored using the browser's encrypted storage APIs
* Credentials are encrypted using the Web Cryptography API to prevent unauthorized access

#### Automatic Login:
* The extension logs into the DoorDash account programmatically before data collection begins
* Implements error handling for login failures, such as incorrect credentials or network issues

#### Credential Update:
* Users can update login credentials via the extension settings when necessary

### 3. Zip Code Management

#### Predefined Zip Codes:
* The extension comes preconfigured with a list of 20 zip codes to monitor
* Users can add, remove, or modify zip codes through the extension settings

#### Address Swapping Mechanism:
* For each zip code, the extension changes the delivery address on the DoorDash website to simulate a user in that location
* Handles any prompts or confirmations required by the website when changing addresses

### 4. Data Collection

#### Carousel Identification:
* Identifies the first five carousels on the homepage for each zip code
* Skips any carousel named "Recently Viewed" and selects the next available carousel to ensure five unique carousels are processed

#### AgentQL Queries:
* Utilizes AgentQL for DOM exploration and data extraction
* Queries are designed to be robust against UI changes and to adapt if the website structure changes

Sample AgentQL Query:
```javascript
{
  carousels[1..5] {
    if name != "Recently Viewed" {
      name
      listings[] {
        merchant_name
        image_url
        description
        price_info
        promotions
      }
    }
  }
}
```

#### Data Points Collected:
* Merchant Name: Name of the restaurant or merchant
* Image URL: URL of the listing's image
* Description: Brief description of the listing
* Price Info: Pricing details, such as delivery fees or item prices
* Promotions: Any promotional offers, discounts, or badges (e.g., "Free Delivery," "New," "Popular")
* Carousel Name: Name of the carousel the listing appears in
* Carousel Position: The position of the carousel on the page (1-5)
* Zip Code: The zip code associated with the data
* Timestamp: Date and time when the data was collected

### 5. Data Storage

#### Database Selection:
* Local Storage: Uses IndexedDB for secure and efficient client-side storage
* Remote Storage (Optional): Option to integrate with a remote database like Firebase Firestore or a company-hosted database for centralized data management

#### Data Model:
* Structures data to associate each listing with the zip code, carousel name, and timestamp
* Ensures data is easily queryable and supports efficient retrieval for the dashboard

#### Data Retention Policy:
* Data older than a configurable retention period (default is 30 days) is automatically archived or deleted
* Users can adjust the retention period in the extension settings

### 6. Dashboard Interface

#### Accessing the Dashboard:
* Accessible via the extension's icon in the browser toolbar
* Opens in a new tab or a popup window, depending on user preference

#### User Interface:
* Clean, intuitive UI built with a modern framework like React
* Responsive design to support various screen sizes and resolutions

#### Features:
* Data Visualization:
  * Displays listings in sortable and filterable tables
  * Provides charts and graphs to visualize trends over time, such as merchant appearance frequency
* Search and Filters:
  * Search functionality by zip code, merchant name, carousel name, and date range
  * Advanced filters to refine data views
* Export Functionality:
  * Allows exporting data in CSV or Excel formats for external analysis
* Settings Access:
  * Users can modify zip codes, scheduling, credentials, and data retention policies
* Log Viewing:
  * Access logs of scraping activities and errors for transparency and debugging

### 7. AgentQL Integration

#### API Key Management:
* Securely stores the AgentQL API key using encrypted storage
* Provides an interface to update the API key when necessary

#### Error Handling:
* Implements error handling for AgentQL query failures due to API issues or website changes
* Includes retry mechanisms and fallback procedures to maintain reliability

### 8. Error Handling and Logging

#### Logging:
* Maintains detailed logs of scraping activities, successes, failures, and errors
* Logs are timestamped and categorized for easy reference

#### Notifications:
* Sends browser notifications or emails (if configured) when critical errors occur, such as login failures or scraping issues

#### Retry Mechanism:
* Implements retries for transient errors like network timeouts or temporary server issues
* Configurable number of retry attempts before logging an error

### 9. Extension Settings

#### User Interface:
* Accessible via the dashboard or a dedicated settings page
* Organized into categories for easy navigation (e.g., General, Account, Schedule)

#### Configurable Options:
* Schedule Time: Set the daily scraping time
* Zip Codes: Manage the list of zip codes to monitor
* Credentials: Update DoorDash login credentials securely
* Data Retention: Define how long data is retained before archiving or deletion
* AgentQL API Key: Update the API key securely
* Notification Preferences: Enable or disable notifications for specific events

### 10. Security Considerations

#### Data Protection:
* Encrypts all sensitive data, including credentials and API keys, using strong encryption standards
* Regularly audits code for security vulnerabilities

#### Permissions:
* Limits extension permissions to the minimum necessary (e.g., access to doordash.com domain)
* Clearly declares all required permissions in the manifest.json file

#### Best Practices:
* Follows OWASP guidelines for secure coding
* Implements secure error handling to prevent information leakage

### 11. Testing and Quality Assurance

#### Unit Tests:
* Covers core functionalities with automated tests to ensure reliability

#### Integration Tests:
* Tests the complete scraping process, including login, address swapping, and data collection

#### User Acceptance Testing:
* Conducts beta testing with select users to gather feedback and identify issues

#### Continuous Integration:
* Uses CI tools to automate testing and code analysis on each commit

### 12. Documentation

#### User Guide:
* Provides detailed instructions on installing, configuring, and using the extension
* Includes troubleshooting tips and FAQs

#### Developer Documentation:
* Documents the codebase, architecture, and design decisions
* Includes setup instructions for development and contribution guidelines

#### API References:
* Details on AgentQL queries used and how to modify them if needed

## Data Structures and Tech Stack

### Data Structures

#### Database Schema

##### Listings Collection/Table:

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier (UUID) |
| timestamp | DateTime | When the data was collected |
| zip_code | String | The zip code associated with the data |
| carousel_name | String | Name of the carousel |
| carousel_position | Integer | Position of the carousel on the page (1-5) |
| merchant_name | String | Name of the merchant or restaurant |
| image_url | String | URL of the listing's image |
| description | Text | Description of the listing |
| price_info | JSON/Object | Pricing details |
| promotions | JSON/Array | List of promotions or badges |

##### Settings Collection/Table:

| Field | Type | Description |
|-------|------|-------------|
| user_id | String | Unique identifier for the user (if multi-user) |
| zip_codes | Array | List of zip codes to monitor |
| schedule_time | Time | Daily scraping time |
| data_retention_days | Integer | Number of days to retain data |
| credentials | Encrypted | Encrypted DoorDash login credentials |
| agentql_api_key | Encrypted | Encrypted AgentQL API key |
| notification_prefs | JSON/Object | User's notification preferences |

##### Logs Collection/Table:

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier (UUID) |
| timestamp | DateTime | When the event occurred |
| event_type | String | Type of event (e.g., scrape_success) |
| message | Text | Description of the event |
| details | JSON | Additional data related to the event |

### Tech Stack

#### Languages and Frameworks
* TypeScript: Primary language for its type safety and modern features
* React: For building the dashboard and settings UI
* Redux or Context API: For state management across components
* CSS Modules or Styled Components: For component-scoped styling
* AgentQL SDK: JavaScript SDK for DOM querying and data extraction

#### Tools and Libraries
* Bundler: Webpack for bundling extension files
* Transpiler: Babel for transpiling modern JavaScript/TypeScript features
* Linting: ESLint with TypeScript support for code quality
* Formatting: Prettier for consistent code formatting
* Testing:
  * Jest: For unit and integration tests
  * React Testing Library: For testing React components
* Data Visualization:
  * Chart.js or Recharts for rendering charts and graphs
* Storage:
  * IndexedDB: For client-side database storage
  * Dexie.js: A wrapper for IndexedDB to simplify operations
* Encryption:
  * Web Cryptography API: For encrypting sensitive data like credentials
* Scheduling:
  * Browser Alarms API: For scheduling the daily scraping tasks
* HTTP Requests:
  * Fetch API or Axios: For any network requests (if needed)

#### Development Tools
* IDE: Visual Studio Code with relevant extensions for TypeScript and React
* Version Control: Git with repositories hosted on GitHub or an internal system
* Continuous Integration: GitHub Actions or Jenkins for automated testing and builds
* Package Management: NPM or Yarn for managing dependencies

#### Security Tools
* Dependency Management: Tools like npm audit to check for vulnerabilities
* Code Scanning: Use security analyzers like Snyk or Dependabot

#### Documentation
* JSDoc or TypeDoc: For generating code documentation
* Markdown: For README, contribution guidelines, and other text-based docs

### Desired Project Structure

```
project-root/
├── manifest.json
├── package.json
├── webpack.config.js
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── README.md
├── src/
│   ├── background/
│   │   └── background.ts
│   ├── content/
│   │   └── contentScript.ts
│   ├── popup/
│   │   ├── Popup.tsx
│   │   ├── Popup.css
│   │   └── index.html
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.css
│   │   ├── index.html
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ListingsTable.tsx
│   │       ├── Charts.tsx
│   │       ├── Filters.tsx
│   │       └── Logs.tsx
│   ├── scripts/
│   │   ├── scrapeManager.ts
│   │   ├── login.ts
│   │   ├── addressChanger.ts
│   │   ├── dataCollector.ts
│   │   └── agentqlQueries.ts
│   ├── storage/
│   │   ├── database.ts
│   │   └── models/
│   │       ├── Listing.ts
│   │       ├── Settings.ts
│   │       └── Log.ts
│   ├── utils/
│   │   ├── encryptor.ts
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   └── scheduler.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   └── assets/
│       ├── icons/
│       │   ├── icon16.png
│       │   ├── icon48.png
│       │   └── icon128.png
│       └── images/
├── tests/
│   ├── unit/
│   └── integration/
└── public/
    └── index.html
```

#### Project Structure Notes:
* manifest.json: Defines the extension's permissions, background scripts, content scripts, and other metadata
* package.json: Manages project dependencies and scripts
* webpack.config.js: Configuration for bundling the extension code
* tsconfig.json: TypeScript configuration
* .eslintrc.js & .prettierrc: Configuration files for linting and formatting
* src/: Contains all source code
* background/: Background script managing alarms and background tasks
* content/: Content scripts injected into web pages if needed
* popup/: Code for the extension's popup UI
* dashboard/: Code for the dashboard interface, including components and styles
* scripts/: Modules for scraping logic, including login, address swapping, and data collection
* storage/: Database interaction and data models
* utils/: Utility functions for encryption, logging, error handling, and scheduling
* styles/: Global CSS styles and variables
* assets/: Icons and images used in the extension
* tests/: Contains unit and integration tests
* public/: Public files like index.html for the dashboard

All TypeScript files (.ts or .tsx) are compiled to JavaScript during the build process. The project uses a modular structure to separate concerns and improve maintainability. Components are reusable and can be easily tested and updated. The use of modern web development practices ensures scalability and ease of collaboration.