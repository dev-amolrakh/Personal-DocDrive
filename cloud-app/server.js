const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const stream = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON body
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Google Drive API setup
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
];

// Configure credentials for Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"), // Your service account key file
  scopes: SCOPES,
});

// Create Google Drive client
const drive = google.drive({ version: "v3", auth });

// Your personal Google account email (REPLACE THIS WITH YOUR EMAIL)
const YOUR_EMAIL = "amolrakh22@gmail.com"; // ← REPLACE THIS

// Handle the upload endpoint
app.post("/upload-to-drive", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No files uploaded" });
    }

    const folderName = req.body.folderName || "Uploads";
    let folderId = await getOrCreateFolder(folderName);

    console.log(`Using folder: ${folderName} with ID: ${folderId}`);

    // Share the folder with your personal account
    try {
      await shareWithUser(folderId, YOUR_EMAIL);
      console.log(`Folder shared with ${YOUR_EMAIL}`);
    } catch (shareError) {
      console.error("Error sharing folder:", shareError);
      // Continue with upload even if sharing fails
    }

    const uploadResults = [];

    // Upload each file to Google Drive
    for (const file of req.files) {
      const fileMetadata = {
        name: file.originalname,
        parents: [folderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      };

      console.log(`Uploading file: ${file.originalname}`);

      const driveResponse = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id,name,webViewLink,mimeType,createdTime,size",
      });

      console.log(`File uploaded with ID: ${driveResponse.data.id}`);

      // Share the file with your personal account
      try {
        await shareWithUser(driveResponse.data.id, YOUR_EMAIL);
        console.log(`File shared with ${YOUR_EMAIL}`);
      } catch (shareError) {
        console.error("Error sharing file:", shareError);
        // Continue with other files even if sharing fails
      }

      uploadResults.push({
        originalName: file.originalname,
        driveId: driveResponse.data.id,
        driveLink: driveResponse.data.webViewLink,
        mimeType: driveResponse.data.mimeType,
        createdTime: driveResponse.data.createdTime,
        size: driveResponse.data.size || "0",
      });

      // Delete the local file after upload
      fs.unlinkSync(file.path);
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${req.files.length} file(s) to Google Drive folder "${folderName}"`,
      results: uploadResults,
      note: `Files have been shared with ${YOUR_EMAIL} and should appear in your "Shared with me" section.`,
    });
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to upload to Google Drive: " +
        (error.message || "Unknown error"),
    });
  }
});

// Helper function to share a file or folder with a user
async function shareWithUser(fileId, emailAddress) {
  return drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: emailAddress,
    },
    fields: "id",
  });
}

// Helper function to get or create a folder in Google Drive
async function getOrCreateFolder(folderName) {
  try {
    // Check if folder already exists
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.data.files.length > 0) {
      // Folder exists, return its ID
      return response.data.files[0].id;
    } else {
      // Create the folder
      const fileMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        resource: fileMetadata,
        fields: "id",
      });

      return folder.data.id;
    }
  } catch (error) {
    console.error("Error getting/creating folder:", error);
    throw error;
  }
}

// Function to format file size
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

// Endpoint to list files in Google Drive folder
app.get("/list-drive-files", async (req, res) => {
  try {
    const folderName = req.query.folderName || "Uploads";
    let folderId = await getOrCreateFolder(folderName);

    // Optional property filter
    let query = `'${folderId}' in parents and trashed=false`;

    // Add property filter if specified
    if (req.query.property && req.query.value) {
      query += ` and properties has { key='${req.query.property}' and value='${req.query.value}' }`;
    }

    const response = await drive.files.list({
      q: query,
      fields:
        "files(id, name, mimeType, webViewLink, createdTime, size, thumbnailLink, properties)",
      orderBy: "createdTime desc",
    });

    // Format the response to include formatted sizes and dates
    const formattedFiles = response.data.files.map((file) => {
      return {
        ...file,
        formattedSize: formatFileSize(parseInt(file.size || "0")),
        formattedDate: new Date(file.createdTime).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        // Get color label from properties if available
        colorLabel:
          file.properties && file.properties.colorLabel
            ? file.properties.colorLabel
            : null,
      };
    });

    res.json({
      success: true,
      folderName: folderName,
      files: formattedFiles,
    });
  } catch (error) {
    console.error("Error listing Drive files:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list files: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to get folders from Google Drive
app.get("/list-drive-folders", async (req, res) => {
  try {
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name, properties)",
      orderBy: "name",
    });

    res.json({
      success: true,
      folders: response.data.files,
    });
  } catch (error) {
    console.error("Error listing Drive folders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list folders: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to get the content of a file
app.get("/file/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // First get file's metadata to know its MIME type
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "id,name,mimeType",
    });

    // Download the file
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      }
    );

    // Set the correct content type
    res.setHeader("Content-Type", fileMetadata.data.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileMetadata.data.name}"`
    );

    // Pipe the file stream to the response
    response.data
      .on("error", (err) => {
        console.error("Error downloading file:", err);
        res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error("Error getting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get file: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to get file details
app.get("/file-details", async (req, res) => {
  try {
    const fileId = req.query.fileId;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: "File ID is required",
      });
    }

    // Get file details from Google Drive
    const response = await drive.files.get({
      fileId: fileId,
      fields:
        "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,owners,parents,description,properties,capabilities",
    });

    // Get the folder information
    let folderName = "My Drive";
    if (response.data.parents && response.data.parents.length > 0) {
      try {
        const parentResponse = await drive.files.get({
          fileId: response.data.parents[0],
          fields: "name",
        });
        folderName = parentResponse.data.name;
      } catch (error) {
        console.error("Error getting parent folder:", error);
      }
    }

    // Add formatted information
    const fileDetails = {
      ...response.data,
      formattedSize: formatFileSize(parseInt(response.data.size || "0")),
      formattedCreatedDate: new Date(
        response.data.createdTime
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      formattedModifiedDate: response.data.modifiedTime
        ? new Date(response.data.modifiedTime).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null,
      location: folderName,
      owner:
        response.data.owners && response.data.owners.length > 0
          ? response.data.owners[0].displayName
          : "Unknown",
    };

    res.json({
      success: true,
      fileDetails,
    });
  } catch (error) {
    console.error("Error getting file details:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to get file details: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to rename a file
app.post("/rename-file", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const newName = req.query.newName;

    if (!fileId || !newName) {
      return res.status(400).json({
        success: false,
        error: "File ID and new name are required",
      });
    }

    // Update file in Google Drive
    const response = await drive.files.update({
      fileId: fileId,
      resource: {
        name: newName,
      },
    });

    res.json({
      success: true,
      message: "File renamed successfully",
      file: response.data,
    });
  } catch (error) {
    console.error("Error renaming file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to rename file: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to move a file to a different folder
app.post("/move-file", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const targetFolder = req.query.targetFolder;

    if (!fileId || !targetFolder) {
      return res.status(400).json({
        success: false,
        error: "File ID and target folder are required",
      });
    }

    // Get the target folder's ID
    const folderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${targetFolder}' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (folderResponse.data.files.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Target folder '${targetFolder}' not found`,
      });
    }

    const targetFolderId = folderResponse.data.files[0].id;

    // Get the file to check its current parents
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: "parents",
    });

    // Remove file from current parent folder and add to new folder
    const previousParents = fileResponse.data.parents.join(",");

    const response = await drive.files.update({
      fileId: fileId,
      addParents: targetFolderId,
      removeParents: previousParents,
      fields: "id, name, parents",
    });

    res.json({
      success: true,
      message: `File moved to ${targetFolder} successfully`,
      file: response.data,
    });
  } catch (error) {
    console.error("Error moving file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to move file: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to share a file with a user
app.post("/share-file", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const email = req.query.email;
    const role = req.query.role || "reader"; // Default to reader if not specified

    if (!fileId || !email) {
      return res.status(400).json({
        success: false,
        error: "File ID and email are required",
      });
    }

    // Create a permission in Google Drive
    const response = await drive.permissions.create({
      fileId: fileId,
      sendNotificationEmail: true,
      requestBody: {
        type: "user",
        role: role,
        emailAddress: email,
      },
    });

    res.json({
      success: true,
      message: `File shared with ${email} successfully`,
      permission: response.data,
    });
  } catch (error) {
    console.error("Error sharing file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to share file: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to move a file to trash (or delete)
app.post("/trash-file", async (req, res) => {
  try {
    const fileId = req.query.fileId;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: "File ID is required",
      });
    }

    // Option 1: Move to trash
    const response = await drive.files.update({
      fileId: fileId,
      resource: {
        trashed: true,
      },
    });

    // Option 2: Delete permanently (uncomment if preferred)
    // await drive.files.delete({
    //   fileId: fileId
    // });

    res.json({
      success: true,
      message: "File moved to trash successfully",
    });
  } catch (error) {
    console.error("Error trashing file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trash file: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to update file color label
app.post("/update-file-color", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const color = req.query.color;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: "File ID is required",
      });
    }

    // Color is stored in file properties
    const response = await drive.files.update({
      fileId: fileId,
      resource: {
        properties: {
          colorLabel: color === "none" ? null : color,
        },
      },
    });

    res.json({
      success: true,
      message: "File color updated successfully",
      file: response.data,
    });
  } catch (error) {
    console.error("Error updating file color:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update color: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to ensure Trash folder exists
app.post("/ensure-trash-folder", async (req, res) => {
  try {
    // Check if Trash folder already exists
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='Trash' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    let folderId;

    if (response.data.files.length > 0) {
      // Folder exists
      folderId = response.data.files[0].id;
    } else {
      // Create the folder
      const folderMetadata = {
        name: "Trash",
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: "id",
      });

      folderId = folder.data.id;

      // Share the folder with your personal account
      try {
        await shareWithUser(folderId, YOUR_EMAIL);
      } catch (shareError) {
        console.error("Error sharing Trash folder:", shareError);
      }
    }

    res.json({
      success: true,
      folderId: folderId,
      message: "Trash folder ensured",
    });
  } catch (error) {
    console.error("Error ensuring Trash folder:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to ensure Trash folder: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to create a new folder
app.post("/create-folder", async (req, res) => {
  try {
    const folderName = req.query.folderName;

    if (!folderName) {
      return res.status(400).json({
        success: false,
        error: "Folder name is required",
      });
    }

    // Create the folder in Google Drive
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const response = await drive.files.create({
      resource: folderMetadata,
      fields: "id,name,webViewLink",
    });

    // Share the folder with your personal account
    try {
      await shareWithUser(response.data.id, YOUR_EMAIL);
    } catch (shareError) {
      console.error("Error sharing new folder:", shareError);
      // Continue even if sharing fails
    }

    res.json({
      success: true,
      message: "Folder created successfully",
      folder: response.data,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create folder: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to update file properties (starred, etc.)
app.post("/update-file-properties", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const property = req.query.property;
    const value = req.query.value;

    if (!fileId || !property) {
      return res.status(400).json({
        success: false,
        error: "File ID and property are required",
      });
    }

    // Prepare properties object
    const propertiesUpdate = {};
    propertiesUpdate[property] = value;

    // Update file properties
    const response = await drive.files.update({
      fileId: fileId,
      resource: {
        properties: propertiesUpdate,
      },
    });

    res.json({
      success: true,
      message: `File property ${property} updated successfully`,
      file: response.data,
    });
  } catch (error) {
    console.error("Error updating file property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update property: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to list recent files
app.get("/list-recent-files", async (req, res) => {
  try {
    // Get recent files from Google Drive (modified in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString();

    const response = await drive.files.list({
      q: `modifiedTime > '${dateString}' and trashed=false`,
      fields:
        "files(id, name, mimeType, webViewLink, createdTime, modifiedTime, size, thumbnailLink, properties)",
      orderBy: "modifiedTime desc",
      pageSize: 100,
    });

    // Format the response to include formatted sizes and dates
    const formattedFiles = response.data.files.map((file) => {
      return {
        ...file,
        formattedSize: formatFileSize(parseInt(file.size || "0")),
        formattedDate: new Date(
          file.modifiedTime || file.createdTime
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        // Get color label from properties if available
        colorLabel:
          file.properties && file.properties.colorLabel
            ? file.properties.colorLabel
            : null,
      };
    });

    res.json({
      success: true,
      files: formattedFiles,
    });
  } catch (error) {
    console.error("Error listing recent files:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to list recent files: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to list trashed files
app.get("/list-trashed-files", async (req, res) => {
  try {
    const response = await drive.files.list({
      q: `trashed=true`,
      fields:
        "files(id, name, mimeType, webViewLink, createdTime, modifiedTime, size, thumbnailLink, properties)",
      orderBy: "modifiedTime desc",
    });

    // Format the response to include formatted sizes and dates
    const formattedFiles = response.data.files.map((file) => {
      return {
        ...file,
        formattedSize: formatFileSize(parseInt(file.size || "0")),
        formattedDate: new Date(
          file.modifiedTime || file.createdTime
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        // Get color label from properties if available
        colorLabel:
          file.properties && file.properties.colorLabel
            ? file.properties.colorLabel
            : null,
      };
    });

    res.json({
      success: true,
      files: formattedFiles,
    });
  } catch (error) {
    console.error("Error listing trashed files:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to list trashed files: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to create a sharing link
app.post("/create-sharing-link", async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const role = req.query.role || "reader";

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: "File ID is required",
      });
    }

    // Create a shareable link (anyone with the link can access)
    const permission = await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: role,
        type: "anyone",
      },
      fields: "id",
    });

    // Get the updated webViewLink
    const file = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink",
    });

    res.json({
      success: true,
      message: "Sharing link created successfully",
      link: file.data.webViewLink,
      permissionId: permission.data.id,
    });
  } catch (error) {
    console.error("Error creating sharing link:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to create sharing link: " + (error.message || "Unknown error"),
    });
  }
});

// Endpoint to update folder color
app.post("/update-folder-color", async (req, res) => {
  try {
    const folderId = req.query.folderId;
    const color = req.query.color;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: "Folder ID is required",
      });
    }

    // Update folder properties with color
    const response = await drive.files.update({
      fileId: folderId,
      resource: {
        properties: {
          colorLabel: color === "none" ? null : color,
        },
      },
    });

    res.json({
      success: true,
      message: "Folder color updated successfully",
      folder: response.data,
    });
  } catch (error) {
    console.error("Error updating folder color:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to update folder color: " + (error.message || "Unknown error"),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
