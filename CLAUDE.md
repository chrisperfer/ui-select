# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AngularJS ui-select is a native AngularJS directive providing Select2/Selectize-like functionality without jQuery dependencies. It offers searchable, multi-select dropdowns with keyboard support and multiple theme options (Bootstrap, Select2, Selectize).

## Build Commands

```bash
# Install dependencies
npm install

# Build and test (default)
gulp

# Build only (scripts + styles)
gulp build

# Run tests
gulp test

# Development watch mode (auto-rebuild on changes)
gulp watch

# Build documentation
gulp docs

# Watch documentation changes
gulp docs:watch
```

## Architecture

### Core Structure
- **Module**: `ui.select` - Main Angular module
- **Source**: `src/` directory contains all directive implementations
- **Distribution**: `dist/` contains built files (select.js, select.min.js, select.css, select.min.css)

### Key Components
- **uiSelectController** (`src/uiSelectController.js`): Core controller managing select state, search, selection logic
- **uiSelectDirective** (`src/uiSelectDirective.js`): Main directive establishing the select container and handling keyboard/mouse events
- **uiSelectChoicesDirective** (`src/uiSelectChoicesDirective.js`): Manages dropdown choices display and filtering
- **uiSelectMatchDirective** (`src/uiSelectMatchDirective.js`): Handles display of selected items
- **uiSelectMultipleDirective** (`src/uiSelectMultipleDirective.js`): Extends functionality for multi-select mode
- **uiSelectSingleDirective** (`src/uiSelectSingleDirective.js`): Handles single-select mode specifics

### Theme System
Three theme implementations in separate directories:
- `src/bootstrap/` - Bootstrap theme templates and styles
- `src/select2/` - Select2 theme templates and styles  
- `src/selectize/` - Selectize theme templates and styles

Each theme provides its own HTML templates that are compiled into the main build via Angular's templateCache.

### Build Process
- Uses Gulp for task automation
- Templates are minified and cached using `gulp-angular-templatecache`
- Scripts are concatenated, wrapped in IIFE, and minified
- Source maps generated for debugging
- JSHint for code quality checks

### Testing
- Karma test runner with Jasmine framework
- Tests located in `test/` directory
- Can run with Chrome (default) or Firefox (CI)
- Helper utilities in `test/helpers.js`