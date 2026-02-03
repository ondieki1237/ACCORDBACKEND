# ACCORD Backend - Key Files Learning Path

**Start here to understand the codebase in the right order.**

---

## 🎯 Reading Order (Progressive Complexity)

### Phase 1: Entry & Core (30 minutes)

These files show you how the server starts and the foundation of everything.

#### 1. `/project/src/server.js` ⭐⭐⭐ (START HERE)
**Lines:** 319 | **Difficulty:** Easy | **Time:** 15 min

What you'll learn:
- How Express server is initialized
- All middleware added to request pipeline
- All routes mounted to specific URLs
- Socket.IO setup for real-time
- Database connection trigger
- Scheduled jobs initialization

Key sections:
- Lines 1-65: Imports and Express setup
- Lines 67-90: Middleware stack
- Lines 95-170: Route mounting
- Lines 170-220: Static file serving
- Lines 300-319: Server listen and startup

---

#### 2. `/project/src/middleware/auth.js` ⭐⭐⭐
**Lines:** ~80 | **Difficulty:** Easy | **Time:** 10 min

What you'll learn:
- How JWT tokens are verified
- How user is loaded from database
- How roles are checked
- How 401/403 errors are returned

Key functions:
- `authenticate()` - Verify JWT and load user
- `authorize()` - Check if user has required role
- `optionalAuth()` - Load user if token exists, don't fail if missing

---

#### 3. `/project/src/config/database.js` ⭐⭐
**Lines:** ~30 | **Difficulty:** Easy | **Time:** 5 min

What you'll learn:
- How MongoDB is connected
- Connection string from env
- Mongoose configuration

---

### Phase 2: Models (1 hour)

These show you the data structure. Start with simple models, progress to complex.

#### 4. `/project/src/models/User.js` ⭐⭐⭐
**Lines:** ~150 | **Difficulty:** Medium | **Time:** 20 min

What you'll learn:
- Field types and validation
- Subdocuments (refreshTokens)
- Password hashing middleware
- Indexes for performance
- References to other models

Key fields:
- Basic: email, password, firstName, lastName
- Role-based: role (enum)
- Tokens: refreshTokens[] (TTL)
- Settings: isActive, lastLogin, profileImage
- Targets: targets object for goals

---

#### 5. `/project/src/models/Lead.js` ⭐⭐
**Lines:** ~100 | **Difficulty:** Medium | **Time:** 15 min

What you'll learn:
- Complex nested objects
- Status tracking
- History subdocuments
- Text indexes for searching

---

#### 6. `/project/src/models/Visit.js` ⭐⭐
**Lines:** ~120 | **Difficulty:** Medium | **Time:** 15 min

What you'll learn:
- Arrays of subdocuments
- Multiple references to User
- Enum values for status
- Related document references

---

#### 7. `/project/src/models/Report.js` ⭐⭐
**Lines:** ~80 | **Difficulty:** Easy | **Time:** 10 min

What you'll learn:
- Simple schema with PDF attachment
- Status workflow
- Pagination plugin

---

#### 8. `/project/src/models/Machine.js` ⭐
**Lines:** ~90 | **Difficulty:** Easy | **Time:** 10 min

Quick reference - straightforward schema.

---

### Phase 3: Routes & Controllers (1.5 hours)

Now see how data flows from HTTP request to database and back.

#### 9. `/project/src/routes/auth.js` ⭐⭐⭐
**Lines:** ~40 | **Difficulty:** Easy | **Time:** 10 min

What you'll learn:
- Simple route structure
- Public vs protected endpoints
- Multiple controllers on same route

Key routes:
- `POST /register` - Public, no auth
- `POST /login` - Public, no auth
- `POST /refresh` - Protected, auto-refresh
- `POST /logout` - Protected

---

#### 10. `/project/src/controllers/userController.js` ⭐⭐
**Lines:** ~100+ | **Difficulty:** Medium | **Time:** 15 min

What you'll learn:
- How controller method is structured
- Try-catch error handling
- Database queries via model
- Validation checks
- Response formatting

Key methods:
- `getProfile()` - Get logged-in user
- `updateProfile()` - Update user data
- `changePassword()` - Secure password change

---

#### 11. `/project/src/routes/visits.js` ⭐⭐
**Lines:** ~50 | **Difficulty:** Medium | **Time:** 10 min

What you'll learn:
- Multiple routes on same collection
- Different HTTP methods (GET, POST, PUT, DELETE)
- Role-based access control per endpoint
- Query parameter handling

---

#### 12. `/project/src/controllers/analyticsController.js` ⭐⭐
**Lines:** ~150+ | **Difficulty:** Medium | **Time:** 20 min

What you'll learn:
- Complex database aggregations
- Grouping and summarization
- Data transformation for frontend
- Multiple queries combined

---

### Phase 4: Services & Utils (45 minutes)

How business logic is abstracted into reusable services.

#### 13. `/project/src/services/emailService.js` ⭐⭐
**Lines:** ~100 | **Difficulty:** Easy | **Time:** 15 min

What you'll learn:
- How Nodemailer is configured
- Email templates with variables
- Error handling and logging
- Rate limiting to prevent spam

---

#### 14. `/project/src/services/scheduledJobs.js` ⭐⭐
**Lines:** ~200 | **Difficulty:** Medium | **Time:** 20 min

What you'll learn:
- How cron jobs are scheduled
- Running tasks at specific times
- Sending batch emails
- Database queries in background
- Initialization on server startup

Key jobs:
- Daily reminder at 9 AM
- Weekly summary generation
- Monthly cleanup

---

#### 15. `/project/src/utils/logger.js` ⭐
**Lines:** ~40 | **Difficulty:** Easy | **Time:** 5 min

Simple Winston logger setup. Used throughout the app.

---

### Phase 5: Advanced Patterns (1 hour)

These show sophisticated patterns used across the codebase.

#### 16. `/project/src/middleware/errorHandler.js` ⭐⭐
**Lines:** ~50 | **Difficulty:** Medium | **Time:** 10 min

What you'll learn:
- Centralized error handling
- Stack trace hiding in production
- Consistent error response format
- HTTP status code selection

---

#### 17. `/project/src/middleware/rateLimiters.js` ⭐⭐
**Lines:** ~30 | **Difficulty:** Easy | **Time:** 10 min

What you'll learn:
- Different rate limits for different endpoints
- IP-based throttling
- 429 Too Many Requests response

---

#### 18. `/project/src/routes/admin/users.js` ⭐⭐
**Lines:** ~40 | **Difficulty:** Medium | **Time:** 10 min

What you'll learn:
- Admin-only routes in separate folder
- Multiple authorization levels
- Different controllers for admin

---

#### 19. `/project/src/controllers/adminUsersController.js` ⭐⭐
**Lines:** ~150+ | **Difficulty:** Medium | **Time:** 20 min

What you'll learn:
- Admin operations (CRUD)
- Validation for data integrity
- Email notifications to users
- Audit logging

---

### Phase 6: Real Examples (1 hour)

Walk through complete feature implementations.

#### 20. **Feature: Submit Report (Complete Flow)**

Follow the code:
1. Frontend sends: `POST /api/reports { sections: [...] }`
2. Route: `routes/reports.js` - Routes to controller
3. Controller: `controllers/reportController.js` - Validates and saves
4. Model: `models/Report.js` - Schema and database
5. Service: `services/emailService.js` - Sends email to admin
6. Socket.IO: Emits event to admin
7. Response: `{ success: true, report: {...} }`

Files to read in order:
- `/project/src/routes/reports.js` (which controller is called)
- `/project/src/models/Report.js` (what data is stored)
- `/project/src/controllers/reportController.js` (how it's processed)
- `/project/src/services/emailService.js` (how email is sent)

---

#### 21. **Feature: Login (Complete Flow)**

Follow the code:
1. Frontend sends: `POST /api/auth/login { email, password }`
2. Route: `routes/auth.js` - Routes to controller
3. Controller: `controllers/authController.js`
   - Find user by email
   - Compare password with bcrypt
   - Generate JWT tokens
   - Save refresh token
   - Return tokens
4. Frontend: Stores token, uses in future requests
5. Middleware: `middleware/auth.js` - Verifies token on protected routes

Files to read in order:
- `/project/src/routes/auth.js`
- Look for login controller reference
- Follow to controller file
- Understand bcryptjs and jsonwebtoken usage

---

### Phase 7: Documentation (2-3 hours)

Read the existing comprehensive documentation.

#### 22. `DOCUMENTATIONS/PROJECT_COMPREHENSIVE_ANALYSIS.md`
**Length:** 888 lines | **Difficulty:** Easy | **Time:** 45 min

Best for:
- Understanding all 27 models
- Seeing all 80+ routes
- Service descriptions
- Deployment details

---

#### 23. `DOCUMENTATIONS/PROJECT_ARCHITECTURE_DIAGRAMS.md`
**Length:** 1146 lines | **Difficulty:** Easy | **Time:** 30 min

Best for:
- Visual system architecture
- Data flow diagrams
- Authentication flow
- Role-based access matrix

---

#### 24. `DOCUMENTATIONS/BACKEND_API_DOCUMENTATION.md`
**Length:** Extensive | **Difficulty:** Medium | **Time:** 1-2 hours

Best for:
- Endpoint specifications
- Request/response examples
- Status codes
- Query parameters

Reference as needed for specific endpoints.

---

## 📊 Reading Summary

| Phase | Time | Files | Goal |
|-------|------|-------|------|
| 1: Entry & Core | 30 min | 3 | Understand how server works |
| 2: Models | 1 hour | 8 | Understand data structures |
| 3: Routes & Controllers | 1.5 hours | 4 | Understand request handling |
| 4: Services | 45 min | 3 | Understand reusable logic |
| 5: Advanced | 1 hour | 4 | Understand patterns |
| 6: Real Examples | 1 hour | 2 | See complete features |
| 7: Documentation | 2-3 hours | 3 | Complete understanding |
| **TOTAL** | **~8 hours** | | Complete mastery |

---

## 🎯 By Role

### Backend Developer
1. Start with Phase 1 & 2 (foundations)
2. Read Phase 3 & 4 (how features work)
3. Phase 5 & 6 (patterns and examples)
4. Phase 7 (documentation as reference)
5. Start coding immediately

### DevOps/Infrastructure
1. Understand Phase 1 (server startup)
2. Read environment setup in docs
3. Review `deploy-to-production.sh`
4. Check database indexes
5. Monitor logs and error handling

### QA/Tester
1. Phase 1: Understand API structure
2. Phase 3: Know which endpoints exist
3. Phase 7: Read API documentation
4. Reference postman collections
5. Test based on role permissions

### Frontend Developer
1. Phase 1: Understand authentication flow
2. Phase 3: Endpoint structure
3. Phase 7: API documentation (heavy reference)
4. Model references for field names
5. Response formats

---

## 💡 Key Takeaways After Reading

By the end, you should understand:

✅ How server starts and requests flow through middleware  
✅ How data is structured in MongoDB (27 models)  
✅ How HTTP requests are routed to controllers  
✅ How controllers interact with models  
✅ How authentication and authorization works  
✅ How background services operate  
✅ How errors are handled  
✅ How responses are formatted  
✅ How to add new features  
✅ Complete system architecture  

---

## 🚀 Next Steps After Understanding

1. **Run the server** - `npm run dev`
2. **Make a test request** - Login and get JWT
3. **Add a simple feature** - New route/controller/model
4. **Read deployment docs** - Understand production setup
5. **Explore specific features** - Deep dive into areas of interest

---

## 📞 Quick Reference While Reading

| Question | Answer | File |
|----------|--------|------|
| How does JWT work? | See `authenticate()` | middleware/auth.js |
| How is data stored? | See model schemas | models/*.js |
| How does email work? | See sendEmail() | services/emailService.js |
| How do routes work? | See route definition | routes/auth.js |
| How does control flow work? | Follow complete examples | Phase 6 |
| What's the database schema? | See all models | models/ folder |
| How is error handled? | See errorHandler | middleware/errorHandler.js |
| How are permissions checked? | See authorize() | middleware/auth.js |

---

## ✨ Special Notes

**On your first read through:**
- Don't memorize everything
- Understand the *flow* not every detail
- Most files follow the same patterns
- If you understand one route, you understand them all
- Refer back to this guide as needed

**While developing:**
- Copy patterns from existing similar files
- Use Find & Replace to understand where things are used
- Check logs when confused
- Follow the MVC pattern

**For deep dives:**
- Read the full documentation files
- Look at real requests in postman collections
- Debug with console.log and logger

---

**Status:** ✅ Complete Learning Path Provided

**Estimated Total Time:** 8 hours for complete mastery

**Next:** Start with `/project/src/server.js` right now!
