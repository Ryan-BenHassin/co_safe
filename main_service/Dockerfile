FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
COPY main_service/main_service.py .
COPY main_service/models.py .
RUN pip install -r requirements.txt

ENV PYTHONPATH=/app

CMD ["uvicorn", "main_service:app", "--host", "0.0.0.0", "--port", "5000"]
