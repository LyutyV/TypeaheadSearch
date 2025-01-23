# Movie Search Application

## Task Description

### Project Setup:

-   Start a new Angular project.
-   Select any public API that supports text-based queries.

### Feature Implementation:

-   Develop a typeahead search with search optimizations (e.g., debounce, switchMap).
-   Render results using a virtual scroller with batch-based pagination.
-   Save typeahead queries in the store (NgRx), optimized to include only meaningful queries (e.g., those triggering results).
-   Suggest past queries from the store for subsequent searches (consider optimizations like word breakdown).

### Code Expectations:

-   Use store actions, effects, reducers, and selectors.
-   Incorporate services and interceptors where needed.

#### Important Focus Areas:

-   Proper use of RXJS subscriptions.
-   Usage of the store to benefit from memoization.
-   Management of DOM rendering and use of virtual scroll

> **Note**: Assignments must include a short video of the solution.

## Implementation Details

### 1. Project Setup and API Integration

-   Utilized Angular 19.1 with standalone components architecture
-   Integrated Movie Database Alternative API through RapidAPI
-   Implemented HTTP interceptor for API key management

### 2. Search Optimizations

-   Implemented `debounceTime(500)` to reduce API calls
-   Used `distinctUntilChanged` to prevent duplicate searches
-   Applied `switchMap` for handling concurrent search requests
-   Cached search results in NgRx store

### 3. Virtual Scrolling Implementation

-   Implemented batch-based pagination (10 results/page)
-   Added scroll position tracking
-   Managed placeholder elements for loading states

### 4. NgRx Store Integration

-   Created store architecture with:
    -   Actions
    -   Effects
    -   Reducers
    -   Selectors
-   Implemented caching mechanism
-   Used memoized selectors

### 5. Query Management

-   Stored successful queries only
-   Implemented click-to-search functionality (over previous queries)
-   Maintained query history
-   Handled error states

### 6. Performance Optimizations

-   Used OnPush change detection
-   Implemented takeUntil pattern
-   Created efficient memory management
-   Utilized async pipes

### 7. Error Handling

-   Comprehensive error handling through NgRx effects
-   Visual error feedback with loading states
-   Loading state management
-   Placeholder images for missing posters
-   Cache fallback for failed requests

## Running the Application

### Prerequisites

-   Node.js (v18 or higher)
-   Angular CLI (v19.1)

### Steps to Run

1. Clone the repository:

```bash
git clone https://github.com/LyutyV/TypeaheadSearch.git
cd TypeaheadSearch/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Open your browser and navigate to `http://localhost:4200`
