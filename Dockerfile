FROM node:20-slim

# Install necessary APT dependencies that might be needed by some Node native modules or Baileys
RUN apt-get update && apt-get install -y git ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the express web server PORT
EXPOSE 3001

CMD ["node", "bot.js"]
