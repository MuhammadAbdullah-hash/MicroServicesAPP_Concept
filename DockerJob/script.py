import os
import pandas as pd
from langdetect import detect_langs
from werkzeug.utils import secure_filename
import zipfile
import json
from dotenv import load_dotenv
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText  # Import MIMEText
from email import encoders
import boto3
import chardet
from io import BytesIO



load_dotenv()



# <------------------- ( Helper Functions ) -------------------> #
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def filter_data(df: pd.DataFrame, language_code, niche, folder , s3Path , bucket_name):
    original_count = len(df)

    try : 
        df['Followers'] = df['Followers'].str.extract('(\d+)').fillna(0).astype(int)
        df['Following'] = df['Following'].str.extract('(\d+)').fillna(0).astype(int)
    except Exception as e : 
        pass


    df = df[df['Bio'].fillna('').apply(lambda bio: is_preferred_language(bio, language_code))]
    df = df[df['Followers'] < 2000]
    df = df[df['Following'] > 10]

    df['username'] = df['TwitterID'].str.lstrip('@')
    df = df[['username']]

    niche_formatted = niche.replace(' ', '_')
    language_upper = language_code.upper()
    row_count = len(df)
    new_filename = f"Liste_{niche_formatted}_{language_upper}_{row_count}.xlsx"

    output_filename = os.path.join(folder, new_filename)
    local_file_path = f'{folder}/{new_filename}'

    # Save as Excel file into the folder
    df.to_excel(local_file_path, index=False)

    s3Path = f'{s3Path}/{new_filename}'
    uploadFileToS3( bucket_name , s3Path , local_file_path)


    deleted_count = original_count - len(df)

    print(f"Filtered data saved to {output_filename}. Deleted {deleted_count} rows.")

    return output_filename

def is_preferred_language(text, language_code):
    try:
        if text == 'Empty':
            return False
        langs = detect_langs(text)
        if langs[0].lang == language_code and langs[0].prob > 0.5:
            return True
        return False
    except:
        return False

def check_columns(df: pd.DataFrame):
    columns = df.columns
    if 'TwitterID' not in columns:
        raise ValueError("Column 'TwitterID' not found")
    if 'Bio' not in columns:
        raise ValueError("Column 'Bio' not found")
    if 'Followers' not in columns:
        raise ValueError("Column 'Followers' not found")
    if 'Following' not in columns:
        raise ValueError("Column 'Following' not found")
    return True

def list_files_and_directories(path='.'):
    # List all items in the current directory
    items = os.listdir(path)

    for item in items:
        # Get the full path of the item
        item_path = os.path.join(path, item)

        # Check if the item is a file or a directory
        if os.path.isfile(item_path):
            print(f"File: {item_path}")
        elif os.path.isdir(item_path):
            print(f"Directory: {item_path}")
            # If it's a directory, recursively list its contents
            list_files_and_directories(item_path)

def sendMail( receiver_email , sender_email , password , zip_filename ):
    # Mail Configurations
    sender_email = sender_email
    receiver_email = receiver_email
    password = password
    subject = "Your Zip File is ready"
    body = "Howdy, Hope you are doing great !!.\n Your zip file is ready, kindly view it in attachemnt. \n Yours Truly \n FilterApp Team"


    # Create the email message object
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject

    # Attach the body text
    message.attach(MIMEText(body, "plain"))

    # File to be attached
    file_path = zip_filename

    # Open and read the file
    attachment = open(file_path, "rb")

    # Create a MIMEBase object
    part = MIMEBase("application", "octet-stream")
    part.set_payload((attachment).read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", "attachment; filename=results.zip")

    # Attach the file to the message
    message.attach(part)

    # Set up the SMTP server
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, password)

    # Send the email
    server.sendmail(sender_email, receiver_email, message.as_string())

    # Close the SMTP server
    server.quit()


    return True

def getFileBuffer(  bucket_name , file_key ):
    # Retrieve the object
    print(bucket_name , file_key)
    try:
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        # Access the content of the response
        # file_buffer = response['Body']
        file_buffer = BytesIO(response['Body'].read())
        print(file_buffer)
        return file_buffer
    except Exception as e:
        print(f"There was an error: {e}")    

def uploadFileToS3( bucket_name ,file_key , local_file_path ):
    try :
        uploadResp = s3.upload_file(local_file_path, bucket_name, file_key) 
        print(uploadResp)
        return uploadResp   
    except Exception as e : 
        print(f"There was an error: {e}")
# <------------------- ( Helper Functions ) -------------------> #



# <------------------- ( Main Function ) -------------------> #
def processFiles(request , bucket_name , receiver_email , sender_email, email_password):

    lang_key = LANG_KEY
    niche_key = NICHE_KEY
    password = email_password
    sender_email = sender_email


    nb_files = len(request["files"])
    print(f"Received {nb_files} files")



    zip_filename = os.path.join('results.zip')

    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for i in range(nb_files): 
            print(f"Processing file {i}")
            file = request["files"][i]

            if file and allowed_file(file["filename"]):
                filename = secure_filename(file["filename"])

                language_code = request["form"][i][lang_key]
                niche = request["form"][i][niche_key]

                # switch for different file types
                type = filename.split('.')[-1].lower()
                crash = False

                
                fileBuffer = getFileBuffer(  bucket_name=bucket_name , file_key=file["filename"])
                

                if type == 'csv' :
                    try:
                        df = pd.read_csv(fileBuffer)
                    except Exception as error:
                        print(" CSV --->" , error)
                        crash = True
                        
                elif type == 'xlsx' or type == 'xls':
                    try:
                        df = pd.read_excel(fileBuffer)
                        pass
                    except Exception as error:
                        print(" XLSX --->" , error)
                        crash = True
                else:
                    crash = True


                print(crash , type )


                if crash:
                    pass

                elif check_columns(df):
                    s3Path = file["basePath"]
                    output_filename = filter_data(df, language_code, niche, UPLOAD_FOLDER ,  s3Path , bucket_name)
                    print("-->" , output_filename)

                    zipf.write(output_filename)
                    print("ZIP FILE WRITE DOWN")

    print(password , sender_email)
    
    sendMail( 
        receiver_email=receiver_email , 
        sender_email=sender_email ,
        password=password,
        zip_filename=zip_filename
    )
    
    print(" ... Mail Sent ... ")
    return True
# <------------------- ( Main Function ) -------------------> #






if __name__ == '__main__':
    NICHE_KEY = 'niche'
    UPLOAD_FOLDER = 'uploads'    
    LANG_KEY = 'language_code'
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}






    # request = {
    #     "files" : [
    #         { 
    #             "name" : "file" ,  
    #             "filename" : "Chinese (zh)/Input/4-10-2023/abdullahquddus7@gmail.com/1699095128284/1699095128284.xlsx" , 
    #             "basePath" : "Chinese (zh)/Output/4-10-2023/abdullahquddus7@gmail.com/1699095128284" }
    #     ],
    #     "form" : [
    #         {'language_code' : 'vi' , 'niche' : 'drop shipping'}
    #     ]
    # }
    
 
    request = os.environ["REQUEST"]
    receiver_email = os.environ["RECIEVER_EMAIL"]
    bucket_name = os.environ["BUCKET_NAME"]
    aws_access_key = os.environ["AWS_ACCESS_KEY"]
    aws_secret_key = os.environ["AWS_SECRET_KEY"]
    sender_email = os.environ["SENDER_EMAIL"]
    email_password = os.environ["EMAIL_PASSWORD"]

    request = json.loads(request)



    os.makedirs(UPLOAD_FOLDER , exist_ok=True)

    # Create an S3 client
    s3 = boto3.client(
        's3', 
        aws_access_key_id=aws_access_key, 
        aws_secret_access_key=aws_secret_key
    )

    processFiles( 
        request=request , 
        bucket_name= bucket_name , 
        receiver_email=receiver_email,
        sender_email=sender_email,
        email_password=email_password
    )





