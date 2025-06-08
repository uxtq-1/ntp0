# Contributing Guide

Thank you for taking the time to contribute to this project! This document outlines the typical workflow for contributing and some basic coding standards.

## Issue Creation

1. **Search existing issues** – Before opening a new issue, please search the issue tracker to avoid duplicates.
2. **Open a descriptive issue** – When filing an issue, provide a clear title and enough detail for someone to reproduce the problem or understand the suggestion.
3. **Security concerns** – If you are reporting a potential security vulnerability, consider emailing the maintainers privately and avoid posting details publicly until we have a fix.

## Pull Request Guidelines

1. **Fork the repository** and create your branch from `main`.
2. **Write clear, concise commits** that explain the reasoning for your changes.
3. **Reference related issues** in the pull request description.
4. Ensure your changes follow the project's security approach (NIST, CISA, PCI DSS best practices) and do not include sensitive data.
5. **Create a pull request** targeting the `main` branch and describe your changes.
6. Be responsive to review feedback and update your pull request as needed.

## Code Style

- Use consistent indentation of two spaces.
- Prefer `const` and `let` over `var` in JavaScript.
- Keep functions small and focused.
- When handling user data, sanitize and validate inputs before use.

## Running Tests

This project includes browser-based tests that can be launched from the UI:

1. Start the development server with `npm start`.
2. Open `http://localhost:3000` in your browser.
3. Click the **Run Tests** button at the bottom right of the page. Test results will display in the browser console.

Currently there is no automated command line test runner. If you add new tests, ensure they run through the existing test interface.

## Additional Tips

- Strive for accessible and responsive UI designs. Test pages on multiple screen sizes.
- When possible, favor open source and serverless solutions to keep infrastructure lightweight.

