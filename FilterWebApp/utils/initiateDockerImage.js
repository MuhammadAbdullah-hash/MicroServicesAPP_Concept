const Docker = require('dockerode');
const path = require('path');
const fs = require('fs');



const initiateDockerContainer = async  ( request_body )=>{

    // Create a Docker client
    const docker = new Docker(); // Use the appropriate socket path

    const recieverEmail = request_body.email;
    const filesList = request_body.dirNames;



    let languagesList = request_body.languagesList;
    let nicheList = request_body.nicheList;



    let requestObject = {
        "files" : [],
        "form" : []
    }

    
    for (const obj of filesList) {
        requestObject.files.push({ 
            name : "file" ,
            filename : obj.fileName,
            basePath : obj.outputPath
        })
        
    }

    for (let index = 0; index < languagesList.length; index++) {
        requestObject.form.push({
            language_code : languagesList[ index ],
            niche : nicheList[ index ]
        })   
    }



    requestObject = JSON.stringify( requestObject );

    console.log({ requestObject })


    
    // Define container options
    const containerOptions = {
        Image:  process.env.DOCKER_IMAGE_NAME , // Use the desired Docker image
        Tty: true, // Allocate a pseudo-TTY
        AutoRemove : true,
        Env: [
            `REQUEST=${requestObject}`,
            `RECIEVER_EMAIL=${recieverEmail}`,
            `BUCKET_NAME=${process.env.BUCKET_NAME}`,
            `AWS_ACCESS_KEY=${process.env.AWS_ACCESS_KEY}`,
            `AWS_SECRET_KEY=${process.env.AWS_SECRET_KEY}`,
            `SENDER_EMAIL=${process.env.SENDER_EMAIL}`,
            `EMAIL_PASSWORD=${process.env.EMAIL_PASSWORD}`
        ]        
    };

    console.log({ containerOptions })

    // Create and start a container
    docker.createContainer(containerOptions, function (err, container) {
        if (err) {
            console.error('Error creating container:', err.message);
            return { status : false ,  mesasge: err.message };
        }
        else{
            container.start(function (err, data) {
                if (err) {
                console.error('Error starting container:', err.message);
                return { status : false ,  mesasge: err.message };
                }
                else{
                    console.log('Container started:', container.id);
                    return { status : true ,  mesasge:  `container started with id : ${container.id}` }
                }
            });    
        }
    });    
}





module.exports = { 
    initiateDockerContainer
}