# Rhombus AI - Regex Pattern Matching and Replacement

A full-stack web application for intelligent regex pattern matching and replacement with AI-powered natural language processing.

## 🚀 Features

- **AI-Powered Regex Generation**: Convert natural language descriptions to regex patterns
- **File Processing**: Upload and process CSV, Excel, JSON, TXT, and TSV files
- **Text Processing**: Direct text input and manipulation
- **Theme Customization**: Personalize the interface with custom colors and backgrounds
- **Real-time Preview**: See changes before applying them
- **Multi-format Support**: Handle various data formats seamlessly

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Ant Design
- **Backend**: Django REST Framework
- **Database**: SQLite (development)
- **AI Integration**: Natural language to regex conversion

## 📋 Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Fan111i/Rhombus_AI
cd Rhombus_AI
```

### 2. Backend Setup (Django)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver
```

The backend will be running at `http://localhost:8000`

### 3. Frontend Setup (React)

Open a new terminal window:

```bash
# Navigate to frontend directory
cd rhombus-frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The frontend will be running at `http://localhost:3000`

## 🎯 Usage

### 1. Access the Application
- Open your browser and go to `http://localhost:3000`
- The application will automatically connect to the backend API

### 2. File Processing
1. Navigate to the "File Processing" section
2. Upload your data file (CSV, Excel, JSON, TXT, TSV)
3. Preview your data
4. Enter a natural language description of the pattern you want to find
5. Specify the replacement value
6. Apply the pattern matching and view results

### 3. Text Processing
1. Go to the "Text Processing" section
2. Enter your text directly
3. Describe the pattern in natural language
4. Set your replacement value
5. Process and see the results

### 4. Theme Customization
1. Visit the "Settings" page
2. Upload a custom background image
3. Adjust primary colors
4. Control background opacity and overlay
5. Save settings for immediate application

## 📁 Project Structure

```
Rhombus_AI/
├── backend/                    # Django backend
│   ├── regex_processor/        # Main app
│   │   ├── models.py          # Data models
│   │   ├── views.py           # API endpoints
│   │   ├── services.py        # Business logic
│   │   └── urls.py            # URL routing
│   ├── rhombus_regex_app/     # Django project settings
│   └── requirements.txt       # Python dependencies
├── rhombus-frontend/          # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── DataProcessing.tsx
│   │   │   ├── TextProcessing.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── App.tsx            # Main app component
│   │   └── index.tsx          # Entry point
│   └── package.json           # Node.js dependencies
└── requirements/              # Documentation
```

## 🔧 Development

### Backend Development
- API endpoints are defined in `backend/regex_processor/urls.py`
- Business logic is in `backend/regex_processor/services.py`
- To add new features, modify the appropriate views and services

### Frontend Development
- Components are in `rhombus-frontend/src/components/`
- Styles use Ant Design and custom CSS
- The app uses React hooks for state management

### Hot Reload
Both frontend and backend support hot reload:
- Frontend: Changes are reflected immediately
- Backend: Django auto-reloads on file changes

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd rhombus-frontend
npm test
```

## 📊 API Endpoints

- `POST /api/upload-file/` - Upload and process files
- `POST /api/convert-to-regex/` - Convert natural language to regex
- `POST /api/process-data/` - Apply regex patterns to data
- `POST /api/process-text/` - Process text directly

## 🎨 Customization

### Theme Settings
- **Background Images**: Upload custom backgrounds (JPG, PNG, GIF, WebP)
- **Color Schemes**: Customize primary colors
- **Opacity Controls**: Adjust background transparency
- **Real-time Application**: Changes apply immediately without refresh

### File Support
- **CSV**: Comma-separated values
- **Excel**: .xlsx, .xls files
- **JSON**: JavaScript Object Notation
- **TXT**: Plain text files
- **TSV**: Tab-separated values


## ✨ Latest Updates

- ✅ Fixed theme rendering issues
- ✅ Improved file upload validation
- ✅ Enhanced error handling
- ✅ Real-time theme application
- ✅ Optimized performance

---

**Happy coding!** 🎉
