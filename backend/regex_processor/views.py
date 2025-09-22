from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import LLMService
import json


@api_view(['POST'])
def convert_to_regex(request):
    """
    Convert natural language description to regex pattern
    """
    try:
        data = request.data
        description = data.get('description', '').strip()
        context = data.get('context', '')

        if not description:
            return Response({
                'error': 'Description is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        result = llm_service.natural_language_to_regex(description, context)

        if result['success']:
            return Response({
                'success': True,
                'pattern': result['pattern'],
                'description': result['description']
            })
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def test_regex_replacement(request):
    """
    Test regex pattern replacement on sample text
    """
    try:
        data = request.data
        pattern = data.get('pattern', '').strip()
        replacement = data.get('replacement', '')
        sample_text = data.get('sample_text', '').strip()

        if not all([pattern, sample_text]):
            return Response({
                'error': 'Pattern and sample_text are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        result = llm_service.apply_regex_replacement(sample_text, pattern, replacement)

        return Response(result)

    except Exception as e:
        return Response({
            'error': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def demo_page(request):
    """
    Display the demo page for testing regex conversion
    """
    return render(request, 'regex_processor/demo.html')
