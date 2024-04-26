const AWS = require("aws-sdk");
const Cron = require("node-cron");
const { initiateDockerContainer } = require("../utils");





const queueListnerJob = (  ) => {
    Cron.schedule( '*/10 * * * * *' , async () => {    
        // This function will run every 10 seconds
        console.log("... Polling Message & Initiating Docker Container ...");


        // Initializing AWS config
        AWS.config.update({ 
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,  
            region: 'eu-west-3' 
        });

        // Create an SQS service object
        const sqs = new AWS.SQS();
        // Specify the URL of the SQS queue you want to send a message to
        const queueUrl = process.env.SQS_URL;
        const searchParams = { 
              QueueUrl: queueUrl,
              // Number of messages to retrieve per poll
              MaxNumberOfMessages: 1,  
              // Long polling: wait up to 20 seconds for a message
              WaitTimeSeconds: 10,    
        }

        sqs.receiveMessage(searchParams, (err, data) => {
            if (err) {
              console.error('Error receiving message:', err);
              return;
            }
          
            // Check if there are any messages in the response
            if (data.Messages) {
              const message = data.Messages[0];
              const receiptHandle = message.ReceiptHandle;

          
              // Process the message (e.g., log it)
              console.log('Received message:', message.Body);
              let inputData = JSON.parse( message.Body );

              console.log({inputData})

              // initiate a docker process 
              initiateDockerContainer.initiateDockerContainer( inputData );


              // Delete the message from the queue
              const deleteParams = {
                QueueUrl: queueUrl,
                ReceiptHandle: receiptHandle,
              };
          
              sqs.deleteMessage(deleteParams, (err) => {
                if (err) {
                  console.error('Error deleting message:', err);
                  return;
                }
          
                console.log('Message deleted successfully.');
              });
            } else {
              console.log('No messages in the queue.');
            }
          });        





    });

};


module.exports = { 
    queueListnerJob
}