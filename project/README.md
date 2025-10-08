Accord Medical Backend (project)

This repository contains the backend and some frontend files for Accord Medical's Field Sales Tracking system.

Quick facts
- Main server entry: `src/server.js`
- Runtime: Node.js (ES modules)
- Web framework: Express
- Database: MongoDB (mongoose)
- Auth: JWT
- File uploads: Cloudinary + local `uploads/` static route
- Email: nodemailer
- Socket: socket.io

Run locally
1. Copy `.env.example` to `.env` and fill values.
2. Install deps and run:

   npm install
   npm run dev

Useful files to edit
- Routes: `src/routes/*.js` and `src/routes/admin/*.js`
- Controllers: `src/controllers/*.js`
- Middleware: `src/middleware/*.js`
- DB config: `src/config/database.js`
- Cloudinary helper: `src/utils/cloudinary.js`
- Email helper: `src/services/emailService.js`

Environment variables
See `.env.example` for a checklist of environment variables used by the project.

Next steps I can help with
- Implement a new API endpoint or change existing behavior
- Add validation, tests, or a CI workflow
- Patch a security issue or improve error handling
- Create a small smoke-test script for health and auth

Tell me which change you'd like to make first and I'll implement it.