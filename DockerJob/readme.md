# Web APP Docker 

Its the python script that loops through input Csv or Excel Files
and filters data using langdetect library.

## OverAll Functionality

This script is responcible for filtering data using "langdetect" package and 
sending zip files of output files to user in email.
There is a dockerfile made for this script that enables it to run as a 
stand alone application if the required input variables are provided.

Container when run will use the file_paths given in REQUEST object to download 
file buffer from AWS_S3 in order to use it. This buffer is than used to read files,
apply filtering, store output files in local, makde zip file out of it & send to
user_email. 

Once the process is completed the container auto kills itself.

## Installation

Navigate to root directory /processedDockerImage
Use the Python package manager [pip](https://pypi.org/project/pip/) to install.
To run script.py file you need to install python packages using : 
```bash
pip install -r requirements.txt
```

To make docker image you first need to install [docker](https://www.docker.com/).
After installing it run following command : 
```bash
docker build -t < image_name > .
```

## Sample ENV File Format

Here is a sample .env file Needed. Place it in same root hiearchy as /FilterWebApp

```dotenv
REQUEST="<JSON_ARRAY_THAT_CONTAINS_INPUT_FILES_PATHS_AND_LANGUAGES_NICHES>"

# SAMPLE_REQUEST_OBJECT={"files": [{"name": "file", "filename": "Espagnol_clean_-_Feuille_1.csv"}, {"name": "file", "filename": "Espagnol_clean_-_Feuille_1.xlsx"}], "form": [{"language_code": "en", "niche": "drop shipping"}, {"language_code": "en", "niche": "drop"}]} 

RECIEVER_EMAIL="<ZIP_FILE_RECIEPENT_USER_MAIL>"
BUCKET_NAME="<AWS_S3_BUCKET>"
AWS_ACCESS_KEY="<AWS_ACCESS_KEY>"
AWS_SECRET_KEY="<AWS_SECRET_KEY>"
SENDER_EMAIL="<FROM_EMAIL_FOR_SENDING_EMAILS>"
EMAIL_PASSWORD="<PASSWORD_FOR_SENDER_EMAIL>"

```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)