const AWS = require("aws-sdk");
const path = require("path");
const fs  = require("fs");
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const { Console } = require("console");


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY, // store it in .env file to keep it safe
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION , // this is the region that you select in AWS account
});



const getTimeStamp = ()=>{
    const currentTimestamp = Date.now(); 
    return currentTimestamp;
}

const getFormattedDate = ()=>{
    const dateTimeObj = new Date();
    const date_ = dateTimeObj.getDate();
    const month_ =  dateTimeObj.getMonth();
    const year_ = dateTimeObj.getFullYear();
    const fullDate = `${date_}-${month_}-${year_}`;
    return fullDate;
}

const uploadToS3 = ( file )=>{ 
  
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: file.path,
        Body: file.buffer,
    };
  
  
    let data = s3.upload(params).promise();
    return data;
}



const listS3Dirs = async (  basePath ) => {
    try {

        const params = {
            Bucket: process.env.S3_BUCKET,
            Prefix: basePath
        };

        const data = await s3.listObjectsV2(params).promise();
        return data;

    } catch (error) {
        console.error('Error:', error);
    }
};


const downloadFile = async( contentList , subdirectoryPath )=>{

    for (const content of contentList) {
        const key = content.Key;

        const params = { 
            Bucket: process.env.S3_BUCKET, 
            Key: key 
        };

        const { Body } = await s3.getObject(params).promise();
  

        let fileName = key.split("/").slice(-2).join('_');
        let path_ = `${subdirectoryPath}/${fileName}`
        fs.writeFileSync(path_ , Body);
      }    
}
  

const makeZipFile = async ( zip_file_path , to_be_zipped_dir )=>{
    const output = fs.createWriteStream( zip_file_path );
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    
    archive.on('error', function (err) {
        throw err;
    });
    
    archive.pipe(output);
    archive.directory( to_be_zipped_dir , false); // Specify the directory to be zipped
    
    archive.finalize();    

}


const sendZipFileInMail = async ( 
        subject , text , 
        zip_file_name , 
        zip_file_path 
    )=>{
        
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.SENDER_EMAIL ,
        to: process.env.ADMIN_EMAIL ,
        subject: subject,
        text: text,
        attachments: [
            {
                filename: zip_file_name,
                content: fs.createReadStream( zip_file_path )
            }
        ]
    };


    return new Promise((resolve , reject)=>{
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                reject(error)
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response);
            }
        });
            
    })


}




const deleteFile = ( file_path , flag = false )=>{
    fs.unlinkSync( file_path );
}

const deleteFolderRecursive = ( path )=>{
    let ignore_files = [ ".gitkeep" ]

    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
          var curPath = path + '/' + file;

          if( ignore_files.includes( file ) ){
            // do nothing; 
          }

          else if (fs.lstatSync(curPath).isDirectory()) { 
            // recurse
            deleteFolderRecursive(curPath);
          } 
          else { 
            // delete file
            deleteFile(curPath);
          }

        });
        fs.rmdirSync(path);
      }    

}


module.exports = { 
    uploadToS3,
    deleteFile,
    listS3Dirs,
    makeZipFile,
    downloadFile,
    getTimeStamp,
    getFormattedDate,
    sendZipFileInMail,
    deleteFolderRecursive,
}