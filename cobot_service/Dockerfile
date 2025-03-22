FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
COPY cobot_service/cobot_safety_service.py .
RUN pip install -r requirements.txt

CMD ["python", "cobot_safety_service.py"]
