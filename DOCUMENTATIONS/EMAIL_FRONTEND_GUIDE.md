# Email Service - Frontend Implementation Guide

**Date:** March 3, 2026  
**Target:** React/Vue email UI components  
**Status:** Guides development team

---

## Quick Start

### 1. Get JWT Token
You already have this from login. Use it in all API calls:
```javascript
const token = localStorage.getItem('authToken');
```

### 2. Setup Email (One-time)
Ask user for email credentials before showing email UI:
```javascript
const setupEmail = async (email, password) => {
  const response = await fetch('/api/mail/setup', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

### 3. Load Inbox
```javascript
const fetchInbox = async (page = 1, limit = 20) => {
  const response = await fetch(
    `/api/mail/inbox?page=${page}&limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.json();
};
```

---

## Component Architecture

### Main Email Page
```
EmailPage
├── SetupModal (if email not configured)
├── EmailHeader
│   ├── FolderNav
│   └── SearchBar
├── EmailList
│   ├── EmailItem (x20 per page)
│   └── Pagination
└── EmailDetail (right panel on desktop)
    ├── EmailHeader
    ├── EmailBody
    └── ReplyForm
```

---

## Component Blueprints

### EmailList Component
```javascript
// Displays paginated list of emails
export const EmailList = ({ emails, onSelectEmail, onRefresh }) => {
  const [page, setPage] = useState(1);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const data = await fetchInbox(page);
      setEmails(data.data.emails);
      setLoading(false);
    };
    fetchEmails();
  }, [page]);

  return (
    <div className="email-list">
      {loading ? <Spinner /> : (
        <>
          {emails.map(email => (
            <EmailItem
              key={email.uid}
              email={email}
              onClick={() => onSelectEmail(email.uid)}
            />
          ))}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};
```

### EmailDetail Component
```javascript
// Shows full email content
export const EmailDetail = ({ emailUid, onReply }) => {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmail = async () => {
      const data = await fetch(`/api/mail/email/${emailUid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      setEmail(data.data);
      setLoading(false);
    };
    fetchEmail();
  }, [emailUid]);

  if (loading) return <Spinner />;
  if (!email) return <div>Email not found</div>;

  return (
    <div className="email-detail">
      <div className="email-header">
        <h2>{email.subject}</h2>
        <p>{email.fromName} &lt;{email.from}&gt;</p>
        <p className="date">{new Date(email.date).toLocaleString()}</p>
      </div>

      <div className="email-body">
        {email.html ? (
          <div dangerouslySetInnerHTML={{ __html: email.html }} />
        ) : (
          <p>{email.text}</p>
        )}
      </div>

      {email.attachments && email.attachments.length > 0 && (
        <div className="attachments">
          <h3>Attachments</h3>
          {email.attachments.map(att => (
            <div key={att.filename}>
              <a href="#">{att.filename}</a> ({formatBytes(att.size)})
            </div>
          ))}
        </div>
      )}

      <button onClick={() => onReply(emailUid)}>Reply</button>
    </div>
  );
};
```

### ReplyForm Component
```javascript
// Compose reply to email
export const ReplyForm = ({ emailUid, onSent }) => {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    const data = await fetch(`/api/mail/reply/${emailUid}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body, html: body })
    }).then(r => r.json());

    if (data.success) {
      onSent();
      setBody('');
    }
    setSending(false);
  };

  return (
    <div className="reply-form">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply..."
        rows="10"
      />
      <button 
        onClick={handleSend} 
        disabled={sending || !body.trim()}
      >
        {sending ? 'Sending...' : 'Send Reply'}
      </button>
    </div>
  );
};
```

### ComposeEmail Component
```javascript
// New email composer
export const ComposeEmail = ({ onSent, onClose }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      alert('Please fill all fields');
      return;
    }

    setSending(true);
    const data = await fetch('/api/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, subject, body, html: body })
    }).then(r => r.json());

    if (data.success) {
      onSent();
      onClose();
    }
    setSending(false);
  };

  return (
    <div className="compose-modal">
      <input
        type="email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To:"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject:"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message body..."
        rows="15"
      />
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSend} disabled={sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
```

---

## State Management Pattern

### Using Context (Recommended for simplicity)
```javascript
// EmailContext.js
export const EmailContext = createContext();

export const EmailProvider = ({ children }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInbox = useCallback(async (page = 1) => {
    setLoading(true);
    const data = await apiCall(`/api/mail/inbox?page=${page}`);
    setEmails(data.data.emails);
    setLoading(false);
  }, []);

  const fetchEmail = useCallback(async (uid) => {
    const data = await apiCall(`/api/mail/email/${uid}`);
    setSelectedEmail(data.data);
  }, []);

  return (
    <EmailContext.Provider value={{
      emails, selectedEmail, stats, loading,
      fetchInbox, fetchEmail, setSelectedEmail
    }}>
      {children}
    </EmailContext.Provider>
  );
};
```

---

## API Helper Functions

### Create reusable API wrapper
```javascript
// api/emailApi.js
const token = localStorage.getItem('authToken');

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

export const emailApi = {
  setup: (email, password) =>
    apiCall('/api/mail/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getInbox: (page = 1, limit = 20) =>
    apiCall(`/api/mail/inbox?page=${page}&limit=${limit}`),

  getEmail: (uid) =>
    apiCall(`/api/mail/email/${uid}`),

  sendEmail: (to, subject, body) =>
    apiCall('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body })
    }),

  replyEmail: (uid, body) =>
    apiCall(`/api/mail/reply/${uid}`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),

  markAsRead: (uid) =>
    apiCall(`/api/mail/email/${uid}/read`, {
      method: 'PUT',
      body: JSON.stringify({ isRead: true })
    }),

  deleteEmail: (uid) =>
    apiCall(`/api/mail/email/${uid}`, {
      method: 'DELETE'
    }),

  searchEmails: (query) =>
    apiCall(`/api/mail/search?${new URLSearchParams(query)}`),

  getFolders: () =>
    apiCall('/api/mail/folders'),

  getStats: () =>
    apiCall('/api/mail/stats')
};
```

---

## Styling Guide

### CSS Classes to Create
```css
/* Main container */
.email-container { display: flex; height: 100vh; }

/* Sidebar */
.email-sidebar { width: 250px; border-right: 1px solid #eee; }
.email-folders { padding: 20px; }
.email-folder { padding: 10px; cursor: pointer; }
.email-folder.active { background: #f0f0f0; }

/* Email list */
.email-list { flex: 1; overflow-y: auto; }
.email-item { 
  padding: 15px; 
  border-bottom: 1px solid #eee; 
  cursor: pointer;
}
.email-item:hover { background: #f9f9f9; }
.email-item.unread { font-weight: bold; }
.email-item-from { font-weight: 500; }
.email-item-subject { color: #333; }
.email-item-preview { color: #666; font-size: 12px; }
.email-item-date { color: #999; font-size: 12px; }

/* Email detail */
.email-detail { flex: 1; padding: 30px; overflow-y: auto; }
.email-header { border-bottom: 1px solid #eee; margin-bottom: 20px; }
.email-body { margin: 20px 0; line-height: 1.5; }
.email-body p { margin: 10px 0; }
.email-body img { max-width: 100%; }

/* Forms */
.reply-form, .compose-modal { 
  border-top: 1px solid #eee; 
  padding: 20px 0;
}
textarea { 
  width: 100%; 
  padding: 10px; 
  border: 1px solid #ddd; 
  border-radius: 4px;
}
button { 
  padding: 10px 20px; 
  background: #007bff; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer;
}
button:hover { background: #0056b3; }
button:disabled { background: #ccc; cursor: not-allowed; }
```

---

## Testing Checklist

- [ ] Setup email with valid credentials
- [ ] Fetch inbox and display 20 emails
- [ ] Pagination works (next/previous page)
- [ ] Click email to view details
- [ ] Auto-marks email as read when viewing
- [ ] Reply to email (compose box appears)
- [ ] Send reply successfully
- [ ] Delete email (removed from list)
- [ ] Search emails by "from" field
- [ ] Search emails by date range
- [ ] Show unread email count in folder
- [ ] Handle invalid email/password gracefully
- [ ] Show loading spinners during API calls
- [ ] Handle API errors with user-friendly messages
- [ ] HTML emails render correctly
- [ ] Attachments list displays (non-clickable for now)

---

## Performance Tips

1. **Lazy Load Emails**: Don't fetch all emails at once. Use pagination (20 per page).

2. **Cache Email Detail**: Store fetched email detail in state to avoid re-fetching.

3. **Debounce Search**: Add 500ms delay before searching to reduce API calls:
   ```javascript
   const handleSearch = useCallback(
     debounce((query) => emailApi.searchEmails(query), 500),
     []
   );
   ```

4. **Virtual Scrolling**: For large inists, use react-window library to render only visible items.

5. **Memoization**: Memoize EmailItem components to prevent unnecessary re-renders:
   ```javascript
   export const EmailItem = React.memo(({ email, onSelect }) => {
     return <div onClick={() => onSelect(email.uid)}>{email.subject}</div>;
   });
   ```

---

## Common Errors & Solutions

### "Email not configured" Error
**Cause:** User hasn't setup email yet  
**Fix:** Show `/api/mail/setup` form before email UI

### "Invalid credentials"
**Cause:** Wrong email password  
**Fix:** Clear stored credentials and show setup form again

### Images not loading in HTML emails
**Cause:** CSP (Content Security Policy) blocks external images  
**Fix:** Add img-src policy or use dangerouslySetInnerHTML carefully

### CORS Error
**Cause:** Frontend and backend on different ports  
**Fix:** Backend should have CORS headers. Check server.js for:
```javascript
app.use(cors());
```

---

## Deployment Checklist

Before going live:
- [ ] Test with real email account (not staging)
- [ ] Verify IMAP/SMTP credentials in production `.env`
- [ ] Test email fetching from inbox with 100+ emails
- [ ] Test with slow network (simulate 3G)
- [ ] Security: Ensure JWT always sent in requests
- [ ] Security: Don't log or expose credentials in browser console
- [ ] Accessibility: Email list keyboard navigable
- [ ] Mobile: Test responsive design on small screens
- [ ] Error: Show user-friendly error messages

---

**Timeline:** Frontend implementation estimated 20-25 hours of development  
**Next Phase:** Start with EmailList and EmailDetail components, then add reply/compose.

**Backend Status:** ✅ Production-ready  
**Frontend Status:** 🔄 In development