const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { 
    getFormattedDate , 
    uploadToS3 
} = require("./helperFuncs");

const languageOptions = require("../jsonData/languageOptions.json");



let REQUIRED_HEADERS = [ 
    "TwitterID" , "ProfileLink" , "Followers" , "Following" , "Bio" 
];






const compareArrays = ( arr_1 , arr_2) =>
    arr_1.length === arr_2.length &&
    arr_1.every((element) => arr_2.includes( element )  );




const checkFileType = async(data) => {
    try{
        if(  typeof data == typeof Array()){
            let cols =  Object.keys( data[0] );
    
            let flag = compareArrays( cols , REQUIRED_HEADERS )
            return flag;        
        }
        else{
            return false;
        }
    
    }
    catch(err){
        return null;        
    }
}


const inputChecker = async ( req , res , next )=>{
    let email = req.body.email;
    let files = req.files;
    let languagesList = JSON.parse( req.body.languagesList );
    let nicheList = JSON.parse( req.body.nicheList );
    let emptyVal = "";


    

    if( languagesList.includes(emptyVal) || nicheList.includes(emptyVal) ){
        res.status(400).send({
            status : false,
            message : "empty values in language or niche list"
        });            
    }

    else if(!languagesList || !nicheList || !files || !email){
        res.status(400).send({
            status : false,
            message : "missing language, file, niche or email in payload"
        });            
    }
    else if( (languagesList.length == nicheList.length) &&  languagesList.length == files.length ){
        next();
    }
    else{

        res.status(400).send({
            status : false,
            message : "length of uploaded files doest match with languages or niches being provided"
        });    

    }
}




const fileChecker = async  ( req , res , next )=>{ 
    const files = req.files;
    let languagesList = JSON.parse( req.body.languagesList );


    if (!req.files) {
        return res.status(400).send({
            status : false,
            message : "No file uploaded."
        });
    }

    let saveFiles = true;
    let passedFiles = [];
    let buggyFileNames = [];

    for (let index = 0; index < files.length; index++) {
        const file = files[index];

        const workbook = xlsx.read( file.buffer , { type: 'buffer' } );
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];      
        const data = xlsx.utils.sheet_to_json(worksheet);
        let checkFileCols = await checkFileType( data )

        if(!checkFileCols){
            saveFiles = false;
            buggyFileNames.push( file.originalname );
        }
        
        else{
            file.originalname = file.originalname.replaceAll(" " , "_").replaceAll("(" , "-").replaceAll(")" , "")
            passedFiles.push({ 
                buffer : file.buffer , 
                name : `input-${file.originalname}`,
            })
        }
    }

    if(!saveFiles){

        let message = "Files ( "
        buggyFileNames.map((fileName)=>{ message += `${fileName} ,` })
        message = message.slice(0,-1);
        message += ") are of incorrect format kindly refer to correct format"


        res.status(400).send({
            status : false,
            message
        });    
    }



    else if( saveFiles ){
        let { email } = req.body;
        req.body.dirNames = [ ];

        let subdirectory = new Date().getTime();


        const fullDate = getFormattedDate();

        const uploadPromises = passedFiles.map((item_ , index)=>{

            // language list the we get from payload
            const language = languagesList[index];
            // file buffer & original name
            const fileObject = item_;

            // splitting file original name
            const fileObjectList = fileObject.name.split(".");
            // file extension
            const fileObjectExtension = fileObjectList[ fileObjectList.length - 1 ];

            // generating time stamp for the file being uploaded
            const fileObjectTimeStamp = new Date().getTime();
            // file name with which it has to be saved on S3
            const fileObjectName = `${fileObjectTimeStamp}.${fileObjectExtension}`;
            
            // getting full name of language
            const lagnuageName = languageOptions[language];

            const baseDirPath = `${lagnuageName}/Input/${fullDate}/${email}/${subdirectory}`
            const outPutBaseDirPath = `${lagnuageName}/Output/${fullDate}/${email}/${subdirectory}`
            // full s3 path with folder structure
            const s3Path = `${baseDirPath}/${fileObjectName}`;
            

            const uploadFileObject = {
                buffer : fileObject.buffer,
                path : s3Path
            }

            req.body.dirNames.push({ fileName : s3Path , outputPath : outPutBaseDirPath })

            return uploadToS3( uploadFileObject )
        })


        let uploadFilesResponce = await Promise.all(uploadPromises);
        console.log({uploadFilesResponce})


        next();

    }


}



module.exports = { 
    inputChecker,
    fileChecker
}