# Finch Sandbox Challenge

## Overview
This is a full-stack web application that integrates with Finch’s Sandbox API to retrieve and display employer and employee data.

The application:
- Creates a Finch Sandbox connection
- Retrieves an access token
- Fetches and displays:
  - Company data
  - Employee directory
  - Individual employee data
  - Employment data

---

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- API: Finch Sandbox API

---

## Setup Instructions

### 1. Clone the repository
git clone https://github.com/yalalusi/finch-sandbox-challenge.git  
cd finch-sandbox-challenge

---

### 2. Backend Setup

cd server  
npm install  

Create a `.env` file inside the `server` folder with the following:

FINCH_CLIENT_ID=your_client_id  
FINCH_CLIENT_SECRET=your_client_secret  
PORT=4000  
REDIRECT_URI=http://localhost:5173/callback  

Start the backend:

npm run dev  

---

### 3. Frontend Setup

cd client  
npm install  
npm install react-router-dom  

Create a `.env` file inside the `client` folder with:

VITE_API_URL=http://localhost:4000  

Start the frontend:

npm run dev  

---

### 4. Run the Application

Open your browser and go to:  
http://localhost:5173  

---

## Demo Flow

1. Click **Connect to Finch Sandbox**
2. Select a provider (e.g. ADP Workforce Now)
3. Log in using sandbox credentials:
   - Username: good_user
   - Password: good_pass
4. Approve the connection
5. View company data and employee directory
6. Click an employee to view individual and employment data

---

## Key Features

- Displays all fields individually (no raw JSON rendering)
- Handles null values gracefully by showing "Not provided"
- Allows selecting employees from the directory
- Fetches individual and employment data dynamically
- Keeps access tokens secure on the backend only
- Uses only required Finch products:
  - company
  - directory
  - individual
  - employment

---

## Error Handling

- Displays a custom message when a provider does not implement an endpoint
- Handles Finch sync-in-progress responses gracefully
- Prevents UI crashes on missing data

---

## Notes

- The application is designed to run locally
- Environment variables are required and are not included in the repository for security
- A unique `customer_id` is generated for each connection to avoid sandbox conflicts

---

## Future Improvements

Given more time, I would:
- Improve UI styling and layout
- Add loading states and better UX feedback
- Persist connections securely in a database
- Add automated tests
- Handle Finch async data states more robustly
