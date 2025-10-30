🧠 TaskMate – Smart Task Management System

TaskMate is a full-stack web app that helps users organize, track, and manage daily tasks efficiently.
It features secure authentication, task categorization, and a modern, responsive interface for productivity on any device.

🚀 Features

🔐 User authentication (JWT + bcrypt)

🗂️ Task CRUD (Create, Read, Update, Delete)

⏰ Deadlines & priorities

💻 Responsive frontend (HTML, CSS, JS)

⚙️ REST API backend (Node.js + Express + MongoDB)

🏗️ Tech Stack

Frontend: HTML • CSS • JavaScript
Backend: Node.js • Express.js • MongoDB (Mongoose)
Auth: JWT • bcrypt
Tools: Nodemon • dotenv

⚙️ Quick Setup
# Clone repository
git clone https://github.com/SanthoshV2005/TaskMate.git
cd TaskMate/backend

# Install dependencies
npm install

# Add environment variables
echo MONGO_URI=your_mongodb_uri > .env
echo JWT_SECRET=your_secret_key >> .env
echo PORT=5000 >> .env

# Run backend server
npm run dev


Then open frontend/index.html in your browser or using Live Server.

🔗 API Routes
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login user
GET	/api/tasks	Get all tasks
POST	/api/tasks	Add task
PUT	/api/tasks/:id	Update task
DELETE	/api/tasks/:id	Delete task
🧑‍💻 Author

Santhosh V
🔗 GitHub Profile

🏆 Future Plans

Notifications & reminders

Task sharing between users

Calendar integration

Progress analytics dashboard
