import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp"); // specify the directory where uploaded files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // specify the filename for uploaded files
    }
});

const upload = multer({ storage: storage });

export { upload };