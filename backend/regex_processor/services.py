import requests
from django.conf import settings
import json
import re


class LLMService:
    def __init__(self):
        self.hf_api_key = settings.HUGGINGFACE_API_KEY
        self.api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"

    def natural_language_to_regex(self, description, context=""):
        """
        Convert natural language description to regex pattern using Hugging Face
        """
        # First try with predefined patterns for common cases
        fallback_result = self._get_fallback_pattern(description)
        if fallback_result["success"]:
            return fallback_result

        # Use Hugging Face for more complex cases
        prompt = f"Convert to regex: {description}. Return only the regex pattern:"

        headers = {
            "Authorization": f"Bearer {self.hf_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 50,
                "temperature": 0.1,
                "return_full_text": False
            }
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload)

            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    regex_pattern = result[0].get('generated_text', '').strip()

                    # Clean up the response
                    regex_pattern = regex_pattern.strip('"`\'')

                    # Validate the regex
                    try:
                        re.compile(regex_pattern)
                        return {
                            "success": True,
                            "pattern": regex_pattern,
                            "description": description,
                            "source": "huggingface"
                        }
                    except re.error:
                        # If invalid, fall back to predefined pattern
                        return self._get_fallback_pattern(description)

            # If API fails, use fallback
            return self._get_fallback_pattern(description)

        except Exception as e:
            # If any error, use fallback
            return self._get_fallback_pattern(description)

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