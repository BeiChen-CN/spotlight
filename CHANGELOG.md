# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-01-31

### Changed

- **Animation System Refactor**:
  - Rewrote animation logic for Wheel, Scroll, and Flip modes.
  - Improved performance and stability (removed heavy DOM operations).
  - Fixed issues where animations were not displaying correctly.
- **UI/UX Improvements**:
  - Optimized sidebar folding animation (smoother transition).
  - Cleaned up settings interface.

### Removed

- **TTS (Text-to-Speech)**:
  - Completely removed TTS feature due to complexity and cross-platform issues.
  - Included removing `tts.js` and related UI controls.

### Fixed

- **Build System**:
  - Fixed Linux build failure by adding maintainer email.
  - Fixed resource copying issues for `data` directory.
  - Configured GitHub Actions for automated multi-platform releases (Windows, macOS, Linux).
