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

## 💡 Usage Examples

### Smart Regex Generation
```bash
curl -X POST http://127.0.0.1:8000/api/convert-to-regex/ \
  -H "Content-Type: application/json" \
  -d '{
    "description": "find email addresses",
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

### Basic Matching
- `"find name is John"` - Exact match
- `"show email is john@test.com"` - Specific value search

### Fuzzy Matching
- `"find email contains gmail"` - Contains query
- `"get name contains John"` - Partial match

### Range Queries
- `"find age > 25"` - Numerical comparison
- `"show salary < 50000"` - Range filtering

### Pattern Matching
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
🚀 **Version**: v1.0.0
👨‍💻 **Maintainer**: Rhombus AI Team