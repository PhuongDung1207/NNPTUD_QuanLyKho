const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadSingle: upload.single.bind(upload),
  uploadMany: upload.array.bind(upload),
  uploadFields: upload.fields.bind(upload)
};
