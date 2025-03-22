FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
COPY machine_service/machine_safety_service.py .
RUN pip install -r requirements.txt

CMD ["uvicorn", "machine_safety_service:app", "--host", "0.0.0.0", "--port", "5002"]
