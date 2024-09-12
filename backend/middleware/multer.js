import multer from 'multer';

// Set storage engine for Multer
const storage = multer.memoryStorage(); // Use memory storage

// Initialize Multer with file type validation
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Allow only images and PDFs
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only images and PDFs allowed!');
        }
    }
});

export default upload;
