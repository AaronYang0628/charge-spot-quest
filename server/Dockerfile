# DEPRECATED — this path built an API-only image (Ingress / returned {"detail":"Not Found"}).
# Build the combined UI+API image from the repository root instead:
#   docker build -f Dockerfile .
#   (see also .github/workflows/container.yml — context: ., file: ./Dockerfile)
FROM alpine:3.20
RUN printf '%s\n' \
      'ERROR: server/Dockerfile is deprecated.' \
      'Build from the repository root:' \
      '  docker build -f Dockerfile .' \
      >&2 \
    && exit 1
