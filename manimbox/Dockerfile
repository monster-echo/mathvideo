FROM manimcommunity/manim:v0.19.0

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1
ENV MANIMBOX_WORK_DIR=/tmp/manimbox-work
ENV MANIMBOX_OUTPUT_DIR=/data/outputs

RUN mkdir -p /tmp/manimbox-work /data/outputs

CMD ["python", "-m", "app.main"]
