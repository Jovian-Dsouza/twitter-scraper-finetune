# Use Node.js LTS (Long Term Support) image as base
FROM node:20-slim

# Install git and required dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg git \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /usr/src/app

# Clone the repository
RUN git clone https://github.com/elizaOS/twitter-scraper-finetune.git . \
    && rm -rf .git

# Install dependencies
RUN npm install

# Command to run the Twitter scraper
CMD npm run twitter ${TARGET_USERNAME} 