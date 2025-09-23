# 📊 Rhombus AI Backend - PlantUML Documentation

This directory contains complete PlantUML diagrams for API architecture and usage guides (syntax errors fixed, all in English).

## 📁 File Descriptions

### 1. `api_architecture.puml` - System Architecture Diagram
Shows complete request-response flow including:
- User interaction with Django API
- LLM service call chain
- OpenAI/HuggingFace external API integration
- Smart error handling and fallback mechanisms

### 2. `api_usage_guide.puml` - Detailed Usage Guide
Provides specific usage examples for each API endpoint:
- Complete JSON request formats
- Detailed response examples
- Success and failure scenario demonstrations
- English annotations

### 3. `api_reference.puml` - Quick Reference
Overview and summary of API endpoints:
- Input/output overview for all endpoints
- Functional module grouping
- Workflow connection diagrams

## 🔧 How to View Diagrams

### Method 1: Online Viewing (Recommended)
1. Copy `.puml` file content
2. Visit [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
3. Paste content and generate image

### Method 2: VS Code Plugin
1. Install `PlantUML` extension
2. Open `.puml` file
3. Press `Alt + D` to preview diagram

### Method 3: Local Tools
```bash
# Install PlantUML
brew install plantuml  # macOS
# or
sudo apt-get install plantuml  # Ubuntu

# Generate images
plantuml api_architecture.puml
plantuml api_usage_guide.puml
plantuml api_reference.puml
```

## 🚀 API Endpoints Overview

### Core Functions
- `POST /api/upload-file/` - File upload and parsing
- `POST /api/convert-to-regex/` - Smart regex generation
- `POST /api/process-data/` - Data processing and replacement

### Analysis Functions
- `POST /api/analyze-column/` - Smart column data analysis
- `POST /api/test-regex-pattern/` - Regex pattern testing

### Innovation Features 🆕
- `POST /api/natural-language-query/` - Natural language SQL queries
- **Intelligent Literal Matching** - Auto-detects specific values vs general patterns
- **Smart Intent Recognition** - Distinguishes "find exactly X" from "find all X"

## 💡 Usage Examples

### Smart Regex Generation

#### Literal Matching (NEW 🆕)
```bash
curl -X POST http://127.0.0.1:8000/api/convert-to-regex/ \
  -H "Content-Type: application/json" \
  -d '{
    "description": "find exactly josh@qq.com",
    "context": "user contact information",
    "column_data": ["josh@qq.com", "test@gmail.com"]
  }'
```

#### General Pattern Matching
```bash
curl -X POST http://127.0.0.1:8000/api/convert-to-regex/ \
  -H "Content-Type: application/json" \
  -d '{
    "description": "find all email addresses",
    "context": "user contact information",
    "column_data": ["john@test.com", "jane@gmail.com"]
  }'
```

### Natural Language Query
```bash
curl -X POST http://127.0.0.1:8000/api/natural-language-query/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "find name is John",
    "data": [{"name": "John", "age": 25}, {"name": "Jane", "age": 30}],
    "columns": ["name", "age"]
  }'
```

## 🛡️ Error Handling

All API endpoints include comprehensive error handling:

### Parameter Validation Error (400)
```json
{
  "success": false,
  "error": "Description is required"
}
```

### Smart Suggestion Error (400)
```json
{
  "success": false,
  "error": "Column 'naem' not found. Did you mean: name?",
  "suggestions": ["name"],
  "available_columns": ["name", "age", "email"]
}
```

### Server Error (500)
```json
{
  "error": "Server error: Connection timeout"
}
```

## 🎯 Supported Query Types

### Smart Regex Matching 🆕

#### Literal Matching (Exact Values)
- `"find exactly josh@qq.com"` - Returns: `josh@qq.com`
- `"find specific 123-456-7890"` - Returns: `123-456-7890`
- `"match only admin@site.com"` - Returns: `admin@site.com`

#### Pattern Matching (General Rules)
- `"find all email addresses"` - Returns: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
- `"find any phone numbers"` - Returns: `\d{3}-?\d{3}-?\d{4}`
- `"match email format"` - Returns: General email regex pattern

### Natural Language Queries

#### Basic Matching
- `"find name is John"` - Exact match
- `"show email is john@test.com"` - Specific value search

#### Fuzzy Matching
- `"find email contains gmail"` - Contains query
- `"get name contains John"` - Partial match

#### Range Queries
- `"find age > 25"` - Numerical comparison
- `"show salary < 50000"` - Range filtering

#### Pattern Matching
- `"find city starts with New"` - Prefix matching
- `"get phone ends with 1234"` - Suffix matching

## 🔍 Technology Stack

- **Backend**: Django + Django REST Framework
- **AI/LLM**: OpenAI GPT-3.5-turbo, HuggingFace APIs
- **Data Processing**: Pandas, Regular Expressions
- **Documentation**: PlantUML
- **Deployment**: Local development server (scalable to production)

---

📝 **Documentation Updated**: 2025-09-23
🚀 **Version**: v1.1.0 - Added Intelligent Literal Matching
👨‍💻 **Maintainer**: Fan 

## 🆕 Latest Updates (v1.1.0)

### New Features
- **Intelligent Literal Matching**: Automatically detects when users want exact value matches vs general patterns
- **Smart Intent Recognition**: Distinguishes between "find exactly X" and "find all X" commands
- **Enhanced User Experience**: Eliminates JSON escaping issues with direct literal value handling
- **Improved Accuracy**: Returns precise matches for specific values like email addresses

### Technical Improvements
- Enhanced LLM prompt system with intelligent context analysis
- Optimized fallback pattern generation for literal values
- Better error handling and user feedback
- Streamlined frontend-backend communication