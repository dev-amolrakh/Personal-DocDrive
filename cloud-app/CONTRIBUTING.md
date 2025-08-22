# Contributing to DocDrive

First off, thank you for considering contributing to DocDrive! It's people like you that make DocDrive such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs** if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and **explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setting Up Development Environment

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/docdrive.git
   cd docdrive
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up credentials** (follow SETUP.md)

4. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Making Changes

1. **Follow the existing code style**

   - Use meaningful variable names
   - Add comments for complex logic
   - Follow JavaScript best practices

2. **Test your changes**

   - Test file upload functionality
   - Test file management features
   - Test API endpoints manually
   - Ensure no breaking changes

3. **Update documentation**
   - Update README.md if needed
   - Add/update API documentation
   - Update SETUP.md for new features

### Submitting Changes

1. **Commit your changes**

   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

2. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

3. **Create a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:

```
Add file color labeling feature

- Implement color picker component
- Add API endpoint for color updates
- Update file list to display colors
- Fixes #123
```

### JavaScript Styleguide

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use meaningful variable names
- Add JSDoc comments for functions

```javascript
/**
 * Uploads files to Google Drive
 * @param {Array} files - Array of files to upload
 * @param {string} folderName - Target folder name
 * @returns {Promise} Upload results
 */
async function uploadFiles(files, folderName) {
  // Implementation here
}
```

### CSS Styleguide

- Use CSS custom properties (variables) when possible
- Follow BEM naming convention for classes
- Group related properties together
- Use meaningful class names

## Project Structure

```
cloud-app/
├── server.js              # Main server file
├── package.json           # Project configuration
├── public/
│   └── index.html         # Frontend application
├── uploads/               # Temporary uploads (gitignored)
├── docs/                  # Documentation
├── tests/                 # Test files (if added)
└── README.md             # Main documentation
```

## API Guidelines

When adding new API endpoints:

1. **Follow RESTful conventions**

   - GET for retrieving data
   - POST for creating/uploading
   - PUT/PATCH for updating
   - DELETE for removing

2. **Use consistent response format**

   ```javascript
   {
     "success": true|false,
     "message": "Descriptive message",
     "data": {...}, // Optional
     "error": "Error message" // Only if success is false
   }
   ```

3. **Add proper error handling**
   ```javascript
   try {
     // Operation here
     res.json({ success: true, message: "Operation successful" });
   } catch (error) {
     console.error("Error description:", error);
     res.status(500).json({
       success: false,
       error: "User-friendly error message",
     });
   }
   ```

## Feature Requests

We love feature requests! Before submitting one:

1. **Check existing issues** to avoid duplicates
2. **Be specific** about the feature you want
3. **Explain the use case** - why would this feature be useful?
4. **Consider the scope** - is this feature aligned with the project goals?

### Popular Feature Ideas

- [ ] File search functionality
- [ ] Batch operations (delete multiple files)
- [ ] File versioning
- [ ] Comments on files
- [ ] File templates
- [ ] Integration with other cloud services
- [ ] Mobile app
- [ ] Desktop app
- [ ] Advanced sharing permissions
- [ ] File encryption

## Questions?

Don't hesitate to ask questions! You can:

- Create an issue with the "question" label
- Start a discussion in the repository
- Contact the maintainers

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special thanks in the project documentation

Thank you for contributing to DocDrive! 🎉
