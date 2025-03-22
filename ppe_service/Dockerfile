FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
COPY ppe_service/ppe_compliance_service.py .
RUN pip install -r requirements.txt

CMD ["uvicorn", "ppe_compliance_service:app", "--host", "0.0.0.0", "--port", "5003"]
