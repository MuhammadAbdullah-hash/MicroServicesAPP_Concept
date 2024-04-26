const AWS = require("aws-sdk");

const uploadRawFile = async (req , res)=>{

    let dirNames = req.body.dirNames;
    let email = req.body.email;
    let languagesList = JSON.parse( req.body.languagesList );
    let nicheList = JSON.parse( req.body.nicheList );


    AWS.config.update({ 
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,  
        region: 'eu-west-3' 
    });

    // Create an SQS service object
    const sqs = new AWS.SQS();
    
    // Specify the URL of the SQS queue you want to send a message to
    const queueUrl = process.env.SQS_URL;


    // Initilazing Message Body
    const body = JSON.stringify({ email , dirNames , languagesList , nicheList  });

    // Define the message you want to send
    const messageParams = {
      MessageBody: body,
      QueueUrl: queueUrl,
    };



    let responce = await sqs.sendMessage(messageParams).promise();
    console.log({responce})


    res.status(200).send({
        status : true
    });
}

module.exports = { 
    uploadRawFile
}