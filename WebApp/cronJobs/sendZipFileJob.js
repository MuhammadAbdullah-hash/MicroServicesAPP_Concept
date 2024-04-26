const Cron = require("node-cron");
const fs  = require("fs");
const { helperFuncs } = require("../utils");
const  languageOptions = require("../jsonData/languageOptions.json");


const sendZipFileJob = ( )=>{
    Cron.schedule( '0 17 * * *' , async () => { 
        console.log("... ZIP FILE SENDER JOB AT 5PM everyday ...")
        sendZipFile();
    })
}


const sendZipFile = async ( )=>{
    const date_ = helperFuncs.getFormattedDate();
    const langList = Object.values(languageOptions);


    let mainDownloadDir = `${process.env.DOWNLOAD_FOLDER_NAME}/${date_}`;
    let zipFileName = `${date_}-${process.env.ZIP_FILE_NAME}`;
    let zipFilePath = `${process.env.DOWNLOAD_FOLDER_NAME}/${zipFileName}`
    let subject = `Daily Output.zip file is ready !!`
    let text = `Below is the attached zip file containing outputs for date : ${date_}`
    
    if (!fs.existsSync(mainDownloadDir)) {
        fs.mkdirSync(mainDownloadDir);
    }  

    await Promise.all(
        langList.map(async(language)=>{
            const s3Url = `${language}/Output/${date_}`
            const listDirs = await helperFuncs.listS3Dirs( s3Url );
            const subDirs = listDirs.Contents;
    
            if(subDirs.length > 0){
                let subdirectoryPath = `${mainDownloadDir}/${language}`;
                if (!fs.existsSync(subdirectoryPath)) {
                    fs.mkdirSync(subdirectoryPath);
                }  
                await helperFuncs.downloadFile( subDirs , subdirectoryPath );
            }
        })
    ).then(async(val)=>{
        await helperFuncs.makeZipFile(zipFilePath ,  mainDownloadDir );
        await helperFuncs.sendZipFileInMail( subject, text, zipFileName,  zipFilePath)

        // delete directories & files
        helperFuncs.deleteFolderRecursive( mainDownloadDir );
        helperFuncs.deleteFile( zipFilePath , true )

    })


}



module.exports = {
    sendZipFileJob
}