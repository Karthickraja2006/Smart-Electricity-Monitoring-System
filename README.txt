SMART ELECTRICITY MONITORING SYSTEM - FULL DYNAMIC VERSION

Technologies:
HTML, CSS, JavaScript, Node.js, Express.js, MongoDB, Mongoose, fetch(), REST API

FEATURES:
1. User Registration - saves users in MongoDB.
2. User Login - checks email and password from MongoDB.
3. Profile - loads profile from MongoDB and updates name/phone.
4. Dynamic Dashboard - today's usage, monthly usage and estimated cost come from MongoDB.
5. Usage History - add daily electricity usage and view stored history.
6. Appliance Management - add, view, edit and delete appliances.
7. Contact Form - saves messages in MongoDB.
8. Basic login protection using localStorage.

SETUP:
1. Install Node.js and MongoDB.
2. Start MongoDB service.
3. Open terminal inside the backend folder.
4. Run: npm install
5. Run: npm start
6. Open: http://localhost:5000

DATABASE:
Database name: SmartElectricity
Collections are created automatically by Mongoose:
users, usages, appliances, contacts

IMPORTANT:
This project intentionally uses only basic concepts: HTML, CSS, JavaScript, Node.js, Express, MongoDB, Mongoose, REST APIs, fetch and basic CRUD. No React, JWT, bcrypt or advanced authentication framework is used.


FRONTEND NOTES
All pages share frontend/style.css. The frontend keeps the logged-in user's email and name in localStorage (userEmail, userName). The backend was not changed.
