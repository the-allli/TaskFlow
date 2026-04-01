# TaskFlow - Setup & Installation Guide

Complete step-by-step guide to set up and run the TaskFlow project management application on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure Overview](#project-structure-overview)
3. [Installation Steps](#installation-steps)
   - [Clone the Repository](#clone-the-repository)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
4. [Environment Configuration](#environment-configuration)
   - [Server Environment Variables](#server-environment-variables)
   - [Client Environment Variables](#client-environment-variables)
5. [Database Setup](#database-setup)
6. [Third-Party Services Configuration](#third-party-services-configuration)
   - [MongoDB](#mongodb)
   - [Cloudinary](#cloudinary)
   - [Stripe](#stripe)
   - [Email Service (Gmail)](#email-service-gmail)
7. [Running the Application](#running-the-application)
   - [Development Mode](#development-mode)
   - [Production Build](#production-build)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Default Credentials](#default-credentials)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v20.x or higher)

  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (comes with Node.js)

  - Verify installation: `npm --version`
- **MongoDB**

  - Option 1: Local MongoDB installation (v6.0+)
    - Download from: https://www.mongodb.com/try/download/community
  - Option 2: MongoDB Atlas (Cloud Database)
    - Visit: https://www.mongodb.com/cloud/atlas

### Recommended Tools

- **Git** for version control
- **VS Code** or any code editor
- **Postman** for API testing
- **MongoDB Compass** for database visualization

---

## Installation Steps

### Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd TaskFlow
```

---

### Backend Setup

#### Step 1: Navigate to Server Directory

```bash
cd server
```

#### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Express.js
- Mongoose
- JWT authentication
- Stripe
- Cloudinary
- Nodemailer
- And other dependencies

#### Step 3: Create Environment File

```bash
# Copy the example environment file
copy .env.example .env

# Or manually create .env file
```

---

### Frontend Setup

#### Step 1: Navigate to Client Directory

Open a new terminal and navigate to client folder:

```bash
cd TaskFlow\client
```

#### Step 2: Install Dependencies

```bash
npm install
```

This will install:

- React 19
- Vite
- Tailwind CSS
- Zustand
- React Router DOM
- And other frontend dependencies

#### Step 3: Create Environment File

```bash
# Copy the example environment file
copy .env.example .env

# Or manually create .env file
```

---

## Environment Configuration

### Server Environment Variables

Edit `server/.env` with your configuration:

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/taskflow

# Client URL (Frontend)
CLIENT_URL=http://localhost:5173

# JWT Configuration
JWT_ACCESS_TOKEN_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=7d

# Email Configuration (Gmail Example)
NODEMAILER_EMAIL_SERVICE=gmail
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=your-app-specific-password
NODEMAILER_EMAIL_FROM=your-email@gmail.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_FREE_PRICE_ID=price_free-tier-id
STRIPE_PRO_PRICE_ID=price_pro-tier-id
STRIPE_ULTIMATE_PRICE_ID=price_ultimate-tier-id
```

#### Detailed Variable Explanations:

**JWT_ACCESS_TOKEN_SECRET**

- Generate a strong random string
- Used for signing JWT tokens
- Keep this secret and secure

**Email Configuration**

- For Gmail: Enable "Less Secure Apps" or use App Password
- Alternative services: Outlook, SendGrid, etc.

**Cloudinary**

- Free tier available at https://cloudinary.com
- Used for image/file storage

**Stripe**

- Test keys start with `sk_test_` and `pk_test_`
- Get keys from https://dashboard.stripe.com/test/apikeys

---

### Client Environment Variables

Edit `client/.env` with your configuration:

```env
# Environment
NODE_ENV=development

# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

#### Important Notes:

- All variables must start with `VITE_` prefix
- `VITE_API_BASE_URL` should point to your backend server
- `VITE_STRIPE_PUBLISHABLE_KEY` is your Stripe public key

---

## Database Setup

### Option 1: Local MongoDB

#### Install MongoDB locally:

1. Download MongoDB Community Edition
2. Install and start MongoDB service
3. Default connection: `mongodb://localhost:27017`

#### Start MongoDB Service:

**Windows:**

```bash
net start MongoDB
```

**macOS/Linux:**

```bash
sudo systemctl start mongod
```

#### Update Connection String:

In `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/taskflow
```

---

### Option 2: MongoDB Atlas (Cloud)

#### Step 1: Create Account

1. Visit https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (free tier M0)

#### Step 2: Configure Database Access

1. Go to Database Access
2. Add new database user
3. Set username and password
4. Grant read/write permissions

#### Step 3: Configure Network Access

1. Go to Network Access
2. Add IP Address
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development

#### Step 4: Get Connection String

1. Go to Clusters
2. Click "Connect"
3. Choose "Connect your application"
4. Copy connection string

#### Step 5: Update Environment Variable

Replace placeholders in connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
```

Replace:

- `<username>` with your DB username
- `<password>` with your DB password
- `taskflow` with your preferred database name

---

## Third-Party Services Configuration

### Cloudinary Setup

#### Step 1: Create Account

1. Visit https://cloudinary.com
2. Sign up for free account
3. Complete registration

#### Step 2: Get Credentials

1. Go to Dashboard
2. Copy the following:
   - Cloud Name
   - API Key
   - API Secret

#### Step 3: Update Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Step 4: Configure Cloudinary

The app automatically uses these credentials in `server/config/cloudinary.config.js`

---

### Stripe Setup

#### Step 1: Create Account

1. Visit https://stripe.com
2. Create free account
3. Activate test mode

#### Step 2: Get API Keys

1. Go to Developers > API keys
2. Copy publishable key (starts with `pk_test_`)
3. Copy secret key (starts with `sk_test_`)

#### Step 3: Update Environment Variables

**Server (.env):**

```env
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**Client (.env):**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

#### Step 4: Create Products & Prices

1. Go to Products in Stripe Dashboard
2. Create three products: Free, Pro, Ultimate
3. Add pricing for each plan
4. Copy price IDs to `.env`:

```env
STRIPE_FREE_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ULTIMATE_PRICE_ID=price_xxx
```

#### Step 5: Setup Webhooks (Development)

1. Install Stripe CLI:

   ```bash
   # Windows (using winget)
   winget install stripe-cli

   # macOS
   brew install stripe/stripe-cli/stripe
   ```
2. Login to Stripe CLI:

   ```bash
   stripe login
   ```
3. Forward webhooks:

   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
4. Copy webhook signing secret to `.env`:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

---

### Email Service (Gmail)

#### Option 1: Gmail App Password (Recommended)

##### Step 1: Enable 2-Factor Authentication

1. Go to Google Account settings
2. Security > 2-Step Verification
3. Enable 2FA

##### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Generate password
4. Copy 16-character password

##### Step 3: Update Environment Variables

```env
NODEMAILER_EMAIL_SERVICE=gmail
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=your-16-char-app-password
NODEMAILER_EMAIL_FROM=your-email@gmail.com
```

---

## Running the Application

### Development Mode

#### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Backend Server:**

```bash
cd TaskFlow\server
npm run dev
```

You should see:

```
MongoDB Connected!
DB Name: taskflow
Server is running on port 3000
```

**Terminal 2 - Frontend Client:**

```bash
cd TaskFlow\client
npm run dev
```

You should see:

```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### Option 2: Run from Root

From the root directory:

```bash
# Install all dependencies and build
npm run build

# Start production server
npm start
```

---

### Production Build

#### Step 1: Build Frontend

```bash
cd TaskFlow\client
npm run build
```

This creates optimized production files in `client/dist/`

#### Step 2: Set Production Environment

Update `server/.env`:

```env
NODE_ENV=production
CLIENT_URL=https://your-domain.com
MONGODB_URI=mongodb+srv://...your-production-db
```

Update `client/.env`:

```env
NODE_ENV=production
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-key
```

#### Step 3: Start Production Server

```bash
cd TaskFlow\server
npm start
```

Or from root:

```bash
npm start
```

---

## Testing

### Backend Tests

```bash
cd TaskFlow\server
npm test
```

This runs Jest tests for:

- Authentication endpoints
- Workspace CRUD operations
- Project management
- Task management
- Payment processing

---

## Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Error

**Error:** `MongoDB connection error: connect ECONNREFUSED`

**Solutions:**

- Ensure MongoDB is running: `net start MongoDB` (Windows)
- Check MongoDB URI in `.env`
- Verify MongoDB service status
- For Atlas: Check IP whitelist and credentials

---

#### 2. CORS Errors

**Error:** `Access to fetch has been blocked by CORS policy`

**Solutions:**

- Verify `CLIENT_URL` in server `.env` matches your frontend URL
- Ensure both frontend and backend are running
- Check browser console for specific CORS errors

---

#### 3. Email Not Sending

**Error:** Email verification not working

**Solutions:**

- Use Gmail App Password (not regular password)
- Enable 2FA on Google account
- Check email credentials in `.env`
- Verify less secure apps access (if not using 2FA)

---

#### 4. Stripe Integration Issues

**Error:** Payment not processing

**Solutions:**

- Use test keys in development
- Verify webhook endpoint is accessible
- Check Stripe dashboard for errors
- Ensure webhook secret is correct

---

#### 5. Cloudinary Upload Errors

**Error:** File upload failing

**Solutions:**

- Verify Cloudinary credentials
- Check file size limits (free tier: 10MB)
- Ensure proper file format
- Review Cloudinary dashboard for errors

---

#### 6 Frontend Not Connecting to Backend

**Error:** API calls failing

**Solutions:**

- Check `VITE_API_BASE_URL` in client `.env`
- Ensure backend is running on specified port
- Verify network requests in browser DevTools
- Check for CORS issues

---

#### 7. JWT Token Errors

**Error:** Unauthorized access, token validation failing

**Solutions:**

- Clear browser cookies/local storage
- Regenerate JWT secret in `.env`
- Check token expiry setting
- Verify cookie-parser middleware

---

#### 8. Dependencies Installation Failed

**Error:** npm install fails

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Useful Commands

**Backend:**

```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
```

**Frontend:**

```bash
npm run dev      # Start development server
npm run build    # Build for production
```

**Root:**

```bash
npm run build    # Install deps and build client
npm start        # Start production server
```
