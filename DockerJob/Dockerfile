# Use the official Python image as the base image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Copy your Python script & Requirements.txt file into the container work-dir
COPY script.py .
COPY requirements.txt .

# Install any dependencies if your script requires them
RUN pip install -r requirements.txt

# Run your Python script when the container starts
CMD ["python", "script.py"]