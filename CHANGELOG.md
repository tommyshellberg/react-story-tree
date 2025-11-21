# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-11-21

### Fixed

- Removed `@mui/material` from peer dependencies (package does not use MUI)
- Extended React peer dependency support to include React 19 (`^18.0.0 || ^19.0.0`)
- Extended react-dom peer dependency support to include React 19 (`^18.0.0 || ^19.0.0`)

## [0.1.0] - 2025-11-21

### Added

- Initial release of react-story-tree
- Interactive story tree visualization component built on React Flow
- LLM-powered story analysis with support for Anthropic (Claude) and OpenAI (GPT)
- Tree traversal utilities for extracting and analyzing story paths
- Customizable theming and layout options
- Comprehensive TypeScript type definitions
- Complete documentation with usage examples and API reference

### Features

- **StoryTree Component**: Render branching narratives as interactive trees
- **Story Analysis**: Detect continuity errors, logic issues, and character inconsistencies
- **Traversal Tools**: Extract all story paths, concatenate narratives, analyze structure
- **Flexible Layout**: Support for TB/BT/LR/RL directions and customizable spacing
- **Error Handling**: Robust error handling with partial success support
- **Zero Config**: Works out of the box with sensible defaults

[0.1.1]: https://github.com/tommyshellberg/react-story-tree/releases/tag/v0.1.1
[0.1.0]: https://github.com/tommyshellberg/react-story-tree/releases/tag/v0.1.0
