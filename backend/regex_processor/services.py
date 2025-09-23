import requests
from django.conf import settings
import json
import re
import random
from collections import Counter


class LLMService:
    def __init__(self):
        self.hf_api_key = settings.HUGGINGFACE_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY

        # Use a better model for code generation
        self.hf_api_url = "https://api-inference.huggingface.co/models/microsoft/CodeGPT-small-py"
        self.openai_api_url = "https://api.openai.com/v1/chat/completions"

    def analyze_column_data(self, column_data, column_name):
        """
        Analyze column data to provide intelligent insights and pattern suggestions
        """
        if not column_data:
            return {"patterns": [], "insights": [], "data_type": "unknown"}

        # Sample the data for analysis (limit to first 100 items for performance)
        sample_data = column_data[:100] if len(column_data) > 100 else column_data
        non_empty_data = [str(item).strip() for item in sample_data if item and str(item).strip()]

        if not non_empty_data:
            return {"patterns": [], "insights": [], "data_type": "empty"}

        # Analyze data patterns
        insights = []
        suggested_patterns = []

        # Basic statistics
        total_count = len(column_data)
        non_empty_count = len(non_empty_data)
        empty_count = total_count - non_empty_count

        insights.append(f"Column '{column_name}' has {total_count} total entries, {non_empty_count} non-empty values")

        if empty_count > 0:
            insights.append(f"{empty_count} empty/null values found ({empty_count/total_count*100:.1f}%)")

        # Pattern detection
        patterns = self._detect_patterns(non_empty_data)

        for pattern_info in patterns:
            suggested_patterns.append({
                "pattern": pattern_info["regex"],
                "description": pattern_info["description"],
                "confidence": pattern_info["confidence"],
                "sample_matches": pattern_info["samples"][:3]  # Show first 3 examples
            })

        # Data type inference
        data_type = self._infer_data_type(non_empty_data)

        return {
            "patterns": suggested_patterns,
            "insights": insights,
            "data_type": data_type,
            "sample_values": non_empty_data[:5]
        }

    def natural_language_to_regex(self, description, context="", column_data=None):
        """
        Convert natural language description to regex pattern with enhanced intelligence
        """
        # Analyze column data if provided for better context
        column_analysis = None
        if column_data:
            column_analysis = self.analyze_column_data(column_data, "target_column")

        # Try OpenAI first if API key is available
        if self.openai_api_key:
            openai_result = self._try_openai_regex(description, context, column_analysis)
            if openai_result["success"]:
                return openai_result

        # Fall back to enhanced Hugging Face approach
        hf_result = self._try_huggingface_regex(description, context, column_analysis)
        if hf_result["success"]:
            return hf_result

        # Finally fall back to predefined patterns
        return self._get_fallback_pattern(description)

    def _try_openai_regex(self, description, context="", column_analysis=None):
        """
        Use OpenAI for intelligent regex generation
        """
        if not self.openai_api_key:
            return {"success": False}

        # Build intelligent prompt with context
        prompt = self._build_intelligent_prompt(description, context, column_analysis)

        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are an expert in regular expressions. Always return a valid regex pattern and explain it briefly."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 200
        }

        try:
            response = requests.post(self.openai_api_url, headers=headers, json=payload, timeout=10)

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()

                # Extract regex pattern from response
                pattern = self._extract_regex_from_response(content)

                if pattern and self._validate_regex(pattern):
                    return {
                        "success": True,
                        "pattern": pattern,
                        "description": description,
                        "explanation": content,
                        "source": "openai"
                    }

            return {"success": False}

        except Exception:
            return {"success": False}

    def _try_huggingface_regex(self, description, context="", column_analysis=None):
        """
        Enhanced Hugging Face approach with better prompting
        """
        if not self.hf_api_key:
            return {"success": False}

        # Build enhanced prompt
        prompt = f"""
Task: Generate a regular expression pattern.
Description: {description}
Context: {context}

Requirements:
- Return only the regex pattern
- Make it precise and efficient
- Consider common edge cases

Regex pattern:"""

        headers = {
            "Authorization": f"Bearer {self.hf_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 100,
                "temperature": 0.1,
                "return_full_text": False,
                "stop": ["\n", "Explanation:", "Example:"]
            }
        }

        try:
            response = requests.post(self.hf_api_url, headers=headers, json=payload, timeout=15)

            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get('generated_text', '').strip()

                    # Clean and extract pattern
                    pattern = self._extract_regex_from_response(generated_text)

                    if pattern and self._validate_regex(pattern):
                        return {
                            "success": True,
                            "pattern": pattern,
                            "description": description,
                            "source": "huggingface"
                        }

            return {"success": False}

        except Exception:
            return {"success": False}

    def _get_fallback_pattern(self, description):
        """
        Return a predefined regex pattern based on description keywords
        """
        description_lower = description.lower()

        patterns = {
            'email': r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
            'phone': r'\d{3}-?\d{3}-?\d{4}',
            'date': r'\d{1,2}[/-]\d{1,2}[/-]\d{4}',
            'url': r'https?://[^\s]+',
            'number': r'\d+',
            'word': r'\b\w+\b',
            'ip': r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',
            'credit card': r'\d{4}-?\d{4}-?\d{4}-?\d{4}',
            'zip': r'\d{5}(-\d{4})?',
            'time': r'\d{1,2}:\d{2}(:\d{2})?',
        }

        for keyword, pattern in patterns.items():
            if keyword in description_lower:
                return {
                    "success": True,
                    "pattern": pattern,
                    "description": description,
                    "source": "fallback"
                }

        # Default pattern for any non-whitespace sequence
        return {
            "success": True,
            "pattern": r'\S+',
            "description": description,
            "source": "fallback"
        }

    def _detect_patterns(self, data_sample):
        """
        Detect common patterns in data sample
        """
        patterns = []

        # Email detection
        email_regex = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
        email_matches = [item for item in data_sample if re.match(email_regex, str(item))]
        if email_matches:
            patterns.append({
                "regex": email_regex,
                "description": "Email addresses",
                "confidence": len(email_matches) / len(data_sample),
                "samples": email_matches
            })

        # Phone number detection
        phone_regex = r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        phone_matches = [item for item in data_sample if re.match(phone_regex, str(item))]
        if phone_matches:
            patterns.append({
                "regex": phone_regex,
                "description": "Phone numbers",
                "confidence": len(phone_matches) / len(data_sample),
                "samples": phone_matches
            })

        # Date detection
        date_regex = r'\d{1,2}[/-]\d{1,2}[/-]\d{4}'
        date_matches = [item for item in data_sample if re.match(date_regex, str(item))]
        if date_matches:
            patterns.append({
                "regex": date_regex,
                "description": "Dates (MM/DD/YYYY or MM-DD-YYYY)",
                "confidence": len(date_matches) / len(data_sample),
                "samples": date_matches
            })

        # URL detection
        url_regex = r'https?://[^\s]+'
        url_matches = [item for item in data_sample if re.match(url_regex, str(item))]
        if url_matches:
            patterns.append({
                "regex": url_regex,
                "description": "URLs",
                "confidence": len(url_matches) / len(data_sample),
                "samples": url_matches
            })

        # Number detection
        number_regex = r'^\d+(\.\d+)?$'
        number_matches = [item for item in data_sample if re.match(number_regex, str(item))]
        if number_matches:
            patterns.append({
                "regex": number_regex,
                "description": "Numbers (integer or decimal)",
                "confidence": len(number_matches) / len(data_sample),
                "samples": number_matches
            })

        # Sort by confidence
        patterns.sort(key=lambda x: x["confidence"], reverse=True)
        return patterns[:5]  # Return top 5 patterns

    def _infer_data_type(self, data_sample):
        """
        Infer the primary data type of the column
        """
        if not data_sample:
            return "unknown"

        # Count different types
        type_counts = {
            "email": 0,
            "phone": 0,
            "date": 0,
            "url": 0,
            "number": 0,
            "text": 0
        }

        for item in data_sample:
            item_str = str(item)
            if re.match(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', item_str):
                type_counts["email"] += 1
            elif re.match(r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})', item_str):
                type_counts["phone"] += 1
            elif re.match(r'\d{1,2}[/-]\d{1,2}[/-]\d{4}', item_str):
                type_counts["date"] += 1
            elif re.match(r'https?://[^\s]+', item_str):
                type_counts["url"] += 1
            elif re.match(r'^\d+(\.\d+)?$', item_str):
                type_counts["number"] += 1
            else:
                type_counts["text"] += 1

        # Return the most common type
        return max(type_counts.keys(), key=lambda k: type_counts[k])

    def _build_intelligent_prompt(self, description, context="", column_analysis=None):
        """
        Build an intelligent prompt with context and data analysis
        """
        prompt = f"Generate a regular expression pattern for: {description}\n"

        if context:
            prompt += f"Additional context: {context}\n"

        if column_analysis:
            prompt += f"\nData Analysis:\n"
            prompt += f"- Data type: {column_analysis['data_type']}\n"
            prompt += f"- Sample values: {', '.join(column_analysis['sample_values'])}\n"

            if column_analysis['insights']:
                prompt += f"- Insights: {'; '.join(column_analysis['insights'])}\n"

        prompt += "\nRequirements:\n"
        prompt += "- Return a valid regex pattern\n"
        prompt += "- Make it precise but not overly restrictive\n"
        prompt += "- Consider edge cases and variations\n"
        prompt += "- Explain the pattern briefly\n"

        return prompt

    def _extract_regex_from_response(self, response_text):
        """
        Extract regex pattern from LLM response
        """
        # Look for patterns in code blocks or between slashes
        patterns = [
            r'```(?:regex|re)?\s*\n?([^`]+)\n?```',  # Code blocks
            r'`([^`]+)`',  # Inline code
            r'/([^/]+)/',  # Slash notation
            r'Pattern:\s*([^\n]+)',  # After "Pattern:"
            r'Regex:\s*([^\n]+)',  # After "Regex:"
        ]

        for pattern in patterns:
            match = re.search(pattern, response_text, re.IGNORECASE)
            if match:
                potential_regex = match.group(1).strip()
                if self._validate_regex(potential_regex):
                    return potential_regex

        # If no pattern found in structured format, try to find regex-like strings
        lines = response_text.split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith(('The', 'This', 'A ', 'An ', 'Here')):
                if self._validate_regex(line):
                    return line

        return None

    def _validate_regex(self, pattern):
        """
        Validate if a string is a valid regex pattern
        """
        try:
            re.compile(pattern)
            return True
        except re.error:
            return False

    def test_regex_on_sample(self, pattern, sample_data, replacement="[MATCH]"):
        """
        Test regex pattern on sample data and return results
        """
        if not sample_data:
            return {"success": False, "error": "No sample data provided"}

        try:
            # Compile the pattern
            compiled_pattern = re.compile(pattern)

            results = []
            match_count = 0

            for item in sample_data[:10]:  # Test on first 10 items
                item_str = str(item)
                matches = compiled_pattern.findall(item_str)
                replaced = re.sub(pattern, replacement, item_str)

                if matches:
                    match_count += len(matches)

                results.append({
                    "original": item_str,
                    "matches": matches,
                    "replaced": replaced,
                    "has_match": bool(matches)
                })

            return {
                "success": True,
                "results": results,
                "total_matches": match_count,
                "match_rate": match_count / len(sample_data[:10])
            }

        except re.error as e:
            return {"success": False, "error": f"Invalid regex pattern: {str(e)}"}

    def natural_language_query(self, query, data, columns):
        """
        Process natural language queries like SQL
        Examples:
        - "find user name is Josh"
        - "show all users where age > 25"
        - "get customers from New York"
        """
        if not data or not columns:
            return {"success": False, "error": "No data available for querying"}

        # Validate and parse the query
        parsed_query = self._parse_natural_query(query, columns)

        if not parsed_query["success"]:
            return parsed_query

        # Execute the query
        try:
            filtered_data = self._execute_query(data, parsed_query)

            return {
                "success": True,
                "results": filtered_data,
                "query": query,
                "parsed_query": parsed_query,
                "total_matches": len(filtered_data),
                "total_rows": len(data)
            }

        except Exception as e:
            return {"success": False, "error": f"Query execution error: {str(e)}"}

    def _parse_natural_query(self, query, columns):
        """
        Parse natural language query and validate column existence
        """
        query_lower = query.lower().strip()

        # Initialize query structure
        parsed = {
            "success": False,
            "operation": None,
            "column": None,
            "operator": None,
            "value": None,
            "errors": []
        }

        # Check for basic query patterns
        query_patterns = [
            # "find/show column_name is/= value"
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s+(?:is|=|equals?)\s+([^$]+)', 'equals'),

            # "find column_name contains value"
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s+contains?\s+([^$]+)', 'contains'),

            # "find column_name > value" (for numbers)
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s*>\s*([^$]+)', 'greater_than'),

            # "find column_name < value" (for numbers)
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s*<\s*([^$]+)', 'less_than'),

            # "find column_name starts with value"
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s+starts?\s+with\s+([^$]+)', 'starts_with'),

            # "find column_name ends with value"
            (r'(?:find|show|get)\s+(?:all\s+)?(?:users?|records?|rows?)?\s*(?:where\s+)?(\w+)\s+ends?\s+with\s+([^$]+)', 'ends_with'),
        ]

        # Try to match query patterns
        for pattern, operator in query_patterns:
            match = re.search(pattern, query_lower)
            if match:
                column_name = match.group(1).strip()
                value = match.group(2).strip().strip('"\'')

                # Validate column exists
                if not self._validate_column_exists(column_name, columns):
                    # Try to find similar column names
                    suggestions = self._suggest_similar_columns(column_name, columns)
                    error_msg = f"Column '{column_name}' not found in data."
                    if suggestions:
                        error_msg += f" Did you mean: {', '.join(suggestions)}?"

                    return {
                        "success": False,
                        "error": error_msg,
                        "suggestions": suggestions,
                        "available_columns": columns
                    }

                parsed.update({
                    "success": True,
                    "operation": "filter",
                    "column": column_name,
                    "operator": operator,
                    "value": value
                })

                return parsed

        # If no pattern matched
        return {
            "success": False,
            "error": f"Could not understand query: '{query}'. Try patterns like 'find name is John' or 'show age > 25'",
            "examples": [
                "find name is John",
                "show age > 25",
                "get email contains gmail",
                "find city starts with New"
            ],
            "available_columns": columns
        }

    def _validate_column_exists(self, column_name, columns):
        """Check if column exists (case-insensitive)"""
        column_lower = column_name.lower()
        return any(col.lower() == column_lower for col in columns)

    def _get_actual_column_name(self, column_name, columns):
        """Get the actual column name with correct case"""
        column_lower = column_name.lower()
        for col in columns:
            if col.lower() == column_lower:
                return col
        return None

    def _suggest_similar_columns(self, column_name, columns, max_suggestions=3):
        """Suggest similar column names using simple string similarity"""
        suggestions = []
        column_lower = column_name.lower()

        # Find columns that contain the search term or vice versa
        for col in columns:
            col_lower = col.lower()
            if (column_lower in col_lower or col_lower in column_lower) and col_lower != column_lower:
                suggestions.append(col)

        # If no substring matches, find columns with similar starting letters
        if not suggestions:
            for col in columns:
                if col.lower().startswith(column_lower[:2]) and len(column_lower) >= 2:
                    suggestions.append(col)

        return suggestions[:max_suggestions]

    def _execute_query(self, data, parsed_query):
        """Execute the parsed query on data"""
        column = self._get_actual_column_name(parsed_query["column"], [row.keys() for row in data if row][0])
        operator = parsed_query["operator"]
        value = parsed_query["value"]

        filtered_results = []

        for row in data:
            if column not in row:
                continue

            cell_value = str(row[column]).strip()

            # Apply the filter based on operator
            match = False

            if operator == "equals":
                match = cell_value.lower() == value.lower()

            elif operator == "contains":
                match = value.lower() in cell_value.lower()

            elif operator == "starts_with":
                match = cell_value.lower().startswith(value.lower())

            elif operator == "ends_with":
                match = cell_value.lower().endswith(value.lower())

            elif operator in ["greater_than", "less_than"]:
                try:
                    cell_num = float(cell_value)
                    value_num = float(value)

                    if operator == "greater_than":
                        match = cell_num > value_num
                    else:  # less_than
                        match = cell_num < value_num

                except ValueError:
                    # If can't convert to number, skip this row
                    continue

            if match:
                filtered_results.append(row)

        return filtered_results

    def apply_regex_replacement(self, text, pattern, replacement):
        """
        Apply regex pattern replacement to text
        """
        try:
            result = re.sub(pattern, replacement, text)
            return {
                "success": True,
                "original": text,
                "result": result,
                "pattern": pattern,
                "replacement": replacement
            }
        except re.error as e:
            return {
                "success": False,
                "error": f"Regex application error: {str(e)}",
                "original": text
            }