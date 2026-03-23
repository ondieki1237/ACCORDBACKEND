1. Fetch All Facility Contacts

Use GET request:

fetch('https://api.kmhfr.health.go.ke/api/facilities/contacts/', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Basic ' + btoa('username:password') // required
  }
})
.then(res => res.json())
.then(data => {
  console.log(data);
});
🔎 What you get:

List of contacts in data.results

Pagination info (count, next, previous)

📄 2. Fetch One Specific Contact

If you know the contact ID:

fetch('https://api.kmhfr.health.go.ke/api/facilities/contacts/{id}/', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Basic ' + btoa('username:password')
  }
})
.then(res => res.json())
.then(data => {
  console.log(data);
});
📊 3. Useful Query Options (Optional)

You can filter results:

Pagination
...?page=1&page_size=10
Ordering
...?ordering=created

Example:

fetch('https://api.kmhfr.health.go.ke/api/facilities/contacts/?page=1&page_size=5')
⚠️ Important Notes

✅ You only need GET → no POST, PUT, PATCH, DELETE

🔐 Authentication is required (Basic Auth)

📦 Data comes inside:

data.results

