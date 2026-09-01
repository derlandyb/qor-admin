FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
# Playwright's own Chromium build + OS deps, installed once at image build
# time so `make e2e-admin` (docker compose exec admin npx playwright test)
# never needs a host browser install — see ARCHITECTURE.md §8.1/§8.3.
RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
