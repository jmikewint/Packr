FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy only the manifest first so `pip install` is cached independently of
# source changes - it only re-runs when dependencies actually change.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN groupadd --system --gid 1001 appuser \
    && useradd --system --uid 1001 --gid appuser appuser \
    && chown -R appuser:appuser /app

USER appuser
EXPOSE 4003
CMD ["python", "app.py"]
