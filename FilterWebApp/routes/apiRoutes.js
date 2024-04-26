const router = require("express").Router();
const { apiController } = require("../controllers");
const { validatorMiddleWare } = require("../utils");
const multer = require('multer');
const path = require('path');
const fs = require("fs");



const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
        '/upload' , 
        upload.array('files') , 
        validatorMiddleWare.inputChecker , 
        validatorMiddleWare.fileChecker  , 
        apiController.uploadRawFile 
    );



module.exports = router;