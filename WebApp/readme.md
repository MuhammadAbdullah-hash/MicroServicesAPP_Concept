# Web APP

Its a microservices based architecture to provide scalibilty and  to be cost efficient.
We are using ejs templating nodejs engine to render html templates
inside browser.

## OverAll Functionality
UI of the app is accesable at [webapp](https://localhost:80/)
At UI user can upload upto 15 Csv or Excel files each <=2mb.
These files are stored in AWS-S3 bucket with following hiearchy : 
- Language_Name/
    - Input/
        - Date/
            - email_of_user/
                - timestamp/
                    - input_files
Path of these files are also sent to AWS_QUEUE. 
There is a cronjob running inside cronJobs/ folder that reads messages in
AWS_SQS queue every 10 seconds. If there are some user_inputed_requests in there
it starts proccessing them and deletes from AWS_QUEUE.

The main processing is done using python script. I had made a docker image of this
python script so it can run as a standalone application. Whenever our cronJob finds some
message in queue it read those file_path inside message and initiate a docker-container
that inturns run the processing python script. This docker container is responsible for
storing output files in same hierachy as mentioned above but in Output/ folder instead of 
Input/. Also it send zip file of output files to the user who had requested to process these
files at bigening.

## Installation

Navigate to root directory /FilterWebApp
Use the Node package manager [npm](https://docs.npmjs.com/) to install.

```bash
npm install
```

## Usage

There are three endpoints involved:

- **UI Url ( / )**
  - UI URL, when accessed, will render an html page in browser that is responsive and allow user
  to upload multiple files, view instructions etc.

- **Upload File Url ( /api/upload )**
  - Upload Url, takes in files uploaded by user in formdata, stores them in AWS_S3 bucket, and their resulting paths along with other environment variable needed by docker image in AWS_QUEUE. 

- **CronJobs**
    - *(queueListnerJob)* : This reads messages from AWS_QUEUE every 10 seconds, and runs a docker container if there are any pending messages in queue. Message in queue is the user
    requests that contains uploaded input file paths that are stored in AWS_S3 bucket, environment variables like user email, passwords for email account that will send mail etc

    - *(sendZipFileJob)* : This cronjob runs 5pm every day and retreive input files from AWS_S3 bucket for that day. These files are used to make zip file that is than sent to admin_email
    provided in .env file.

## Sample ENV File Format

Here is a sample .env file Needed. Place it in same root hiearchy as /FilterWebApp

```dotenv
PORT = 3000
SQS_URL="/<AWS_QUEUE_URL>"
LIVE_URL = "https://filter.sosoon.io/api/upload"
LOCAL_URL = "http://localhost/api/upload"
NODE_ENV = "<dev> or <prod>"

DOWNLOAD_FOLDER_NAME="uploads/"
AWS_ACCESS_KEY="<AWS_ACCESS_KEY>"
AWS_SECRET_KEY="<AWS_SECRET_KEY>"
DOCKER_IMAGE_NAME="<DOCKER_LATEST_IMAGE_NAME>"
S3_BUCKET="<AWS_S3_BUCKET_NAME>"
AWS_REGION="<AWS_REGION>"
SENDER_EMAIL="<FROM_EMAIL>"
EMAIL_PASSWORD="<EMAIL_PASSWORD>"
BUCKET_NAME="<AWS_S3_BUCKET_NAME>"
ADMIN_EMAIL="<ADMIN_EMAIL_TO_SEND_WEEKLY_ZIP_FILE>"
ZIP_FILE_NAME="<NAME_OF_ZIP_FILE_BEING_SENT_WEEKLY>"
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)