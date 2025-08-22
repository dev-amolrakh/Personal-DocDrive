# Setup Guide for DocDrive

This guide will help you set up the DocDrive application step by step.

## Step 1: Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Google Account**
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 2: Clone and Install

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd cloud-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Step 3: Google Cloud Setup

### 3.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "DocDrive App")
5. Click "Create"

### 3.2 Enable Google Drive API

1. In your new project, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

### 3.3 Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in the details:
   - **Service account name**: `docdrive-service`
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for DocDrive application`
4. Click **"Create and Continue"**
5. For the role, select **"Project" > "Editor"** (or create a custom role with Drive access)
6. Click **"Continue"** and then **"Done"**

### 3.4 Generate Service Account Key

1. Click on your newly created service account
2. Go to the **"Keys"** tab
3. Click **"Add Key"** > **"Create New Key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. The key file will be downloaded automatically

### 3.5 Setup Credentials File

1. Rename the downloaded JSON file to `credentials.json`
2. Move it to your project root directory (same level as `server.js`)
3. **IMPORTANT**: Never commit this file to version control!

## Step 4: Configure the Application

1. Open `server.js` in your code editor
2. Find this line (around line 31):
   ```javascript
   const YOUR_EMAIL = "amolrakh22@gmail.com"; // ← REPLACE THIS
   ```
3. Replace `"amolrakh22@gmail.com"` with your actual email address

## Step 5: Test the Setup

1. **Start the server**

   ```bash
   npm start
   ```

2. **Open your browser**

   - Navigate to `http://localhost:3000`
   - You should see the DocDrive interface

3. **Test file upload**
   - Try uploading a test file
   - Check your Google Drive "Shared with me" section
   - The uploaded files should appear there

## Step 6: Verify Everything Works

### Upload Test

- [ ] Upload a single file
- [ ] Upload multiple files
- [ ] Create a new folder
- [ ] Upload files to the new folder

### File Management Test

- [ ] Rename a file
- [ ] Move a file to a different folder
- [ ] Add color labels to files
- [ ] Share a file with another email

### Drive Integration Test

- [ ] Check files appear in your Google Drive
- [ ] Verify files are properly shared with your email
- [ ] Test file download/preview

## Troubleshooting

### Common Issues

**Error: "ENOENT: no such file or directory, open 'credentials.json'"**

- Make sure the credentials file is in the project root
- Check the filename is exactly `credentials.json`

**Error: "insufficient authentication scopes"**

- Make sure Google Drive API is enabled
- Check service account has proper permissions

**Files not showing in Google Drive**

- Verify the email in `server.js` is correct
- Check "Shared with me" section in Google Drive
- Make sure service account is properly configured

**Port 3000 already in use**

- Change the PORT in `server.js`:
  ```javascript
  const PORT = process.env.PORT || 3001; // Change to 3001 or another port
  ```

### Getting Help

If you encounter issues:

1. Check the console output for error messages
2. Verify all setup steps were completed
3. Check the main README.md for additional troubleshooting
4. Create an issue in the repository with error details

## Security Notes

- ✅ `credentials.json` is already in `.gitignore`
- ✅ Never share your credentials file
- ✅ The service account only has access to files it creates
- ✅ Files are automatically shared with your personal email

## Next Steps

After successful setup:

- Explore the web interface features
- Customize the application for your needs
- Set up additional users or sharing options
- Consider deploying to a cloud platform

---

**Happy file managing! 🚀**
