import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp"); // specify the directory where uploaded files will be stored
    },
    filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
}
});

const upload = multer({ storage: storage });

export { upload };