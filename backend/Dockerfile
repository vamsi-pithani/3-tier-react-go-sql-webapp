# Use official Golang image as the base image
FROM golang:1.20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
RUN go build -o main .

# Expose port 8080 for the backend server
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
