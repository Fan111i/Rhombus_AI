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


def upload_page(request):
    """
    Display the file upload page
    """
    return render(request, 'regex_processor/upload.html')


@api_view(['POST'])
def upload_file(request):
    """
    Handle file upload and parse CSV/Excel/JSON files
    """
    try:
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        file_extension = uploaded_file.name.lower().split('.')[-1]

        # Parse file based on extension
        display_type = 'table'  # Default to table display

        if file_extension == 'csv':
            data, columns = parse_csv_file(uploaded_file)
        elif file_extension in ['xlsx', 'xls']:
            data, columns = parse_excel_file(uploaded_file)
        elif file_extension == 'json':
            data, columns = parse_json_file(uploaded_file)
        elif file_extension == 'tsv':
            data, columns = parse_tsv_file(uploaded_file)
        elif file_extension == 'txt':
            result = parse_txt_file(uploaded_file)
            if len(result) == 3:  # New format with display type
                data, columns, display_type = result
            else:  # Fallback for old format
                data, columns = result
        elif file_extension == 'xml':
            data, columns = parse_xml_file(uploaded_file)
        else:
            return Response({
                'success': False,
                'error': 'Unsupported file format. Supported formats: CSV, Excel, JSON, TSV, TXT, XML'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'data': data,
            'columns': columns,
            'row_count': len(data),
            'file_name': uploaded_file.name,
            'display_type': display_type
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': f'File processing error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def process_data(request):
    """
    Apply regex pattern to specific column in the data
    """
    try:
        data = request.data.get('data', [])
        column = request.data.get('column', '')
        pattern = request.data.get('pattern', '')
        replacement = request.data.get('replacement', '[MATCH]')

        if not all([data, column, pattern]):
            return Response({
                'success': False,
                'error': 'Missing required parameters: data, column, pattern'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        processed_data = []
        matches_count = 0
        affected_rows = 0

        for row in data:
            new_row = row.copy()
            if column in row and row[column]:
                original_value = str(row[column])
                result = llm_service.apply_regex_replacement(original_value, pattern, replacement)

                if result['success']:
                    new_row[column] = result['result']
                    if result['result'] != original_value:
                        affected_rows += 1
                        # Count actual replacements
                        import re
                        matches_count += len(re.findall(pattern, original_value))
                else:
                    # If regex fails, keep original value
                    new_row[column] = original_value

            processed_data.append(new_row)

        return Response({
            'success': True,
            'processed_data': processed_data,
            'matches_count': matches_count,
            'affected_rows': affected_rows,
            'total_rows': len(data)
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': f'Data processing error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def parse_csv_file(file):
    """Parse CSV file and return data and columns"""
    import pandas as pd
    import io

    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))

    # Convert to list of dictionaries
    data = df.fillna('').to_dict('records')
    columns = list(df.columns)

    return data, columns


def parse_excel_file(file):
    """Parse Excel file and return data and columns"""
    import pandas as pd

    df = pd.read_excel(file, engine='openpyxl')

    # Convert to list of dictionaries
    data = df.fillna('').to_dict('records')
    columns = list(df.columns)

    return data, columns


def file_manager_page(request):
    """
    Display the standalone file manager page
    """
    return render(request, 'regex_processor/file_manager.html')


def parse_json_file(file):
    """Parse JSON file and return data and columns"""
    import json

    content = file.read().decode('utf-8')
    json_data = json.loads(content)

    # Handle different JSON structures
    if isinstance(json_data, list):
        data = json_data
        if data:
            columns = list(data[0].keys()) if isinstance(data[0], dict) else ['value']
        else:
            columns = []
    elif isinstance(json_data, dict):
        # Convert dict to list format
        data = [json_data]
        columns = list(json_data.keys())
    else:
        # Simple value
        data = [{'value': json_data}]
        columns = ['value']

    return data, columns


def parse_tsv_file(file):
    """Parse TSV file and return data and columns"""
    import pandas as pd
    import io

    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content), sep='\t')

    # Convert to list of dictionaries
    data = df.fillna('').to_dict('records')
    columns = list(df.columns)

    return data, columns


def parse_txt_file(file):
    """Parse TXT file and return data and columns"""
    import pandas as pd
    import io

    content = file.read().decode('utf-8')

    # First check if it looks like structured data (has clear separators)
    lines = content.strip().split('\n')

    if len(lines) < 2:
        # Single line or empty file, treat as text
        data = [{'content': content}]
        columns = ['content']
        return data, columns, 'text'

    # Count potential separators in first few lines
    separator_count = {}
    for line in lines[:min(10, len(lines))]:  # Check first 10 lines
        for sep in ['\t', ',', ';', '|']:
            count = line.count(sep)
            if count > 0:
                separator_count[sep] = separator_count.get(sep, 0) + count

    # If we have consistent separators, try to parse as structured data
    if separator_count:
        # Find the most common separator
        best_sep = max(separator_count.keys(), key=lambda k: separator_count[k])

        # Check if the separator appears consistently across multiple lines
        sep_counts = [line.count(best_sep) for line in lines[:min(10, len(lines))]]
        consistent_count = sep_counts[0] if sep_counts else 0

        # Must have at least 1 separator per line and be consistent
        if (consistent_count > 0 and
            all(count == consistent_count for count in sep_counts[:5]) and  # First 5 lines consistent
            consistent_count >= 1):  # At least 1 separator (2 columns)

            try:
                df = pd.read_csv(io.StringIO(content), sep=best_sep)
                if len(df.columns) > 1 and len(df) > 0:  # Actually structured data with multiple columns
                    data = df.fillna('').to_dict('records')
                    columns = list(df.columns)
                    return data, columns, 'table'
            except:
                pass

    # Otherwise, treat as plain text
    # Return the full content as a single text field for text display
    data = [{'content': content}]
    columns = ['content']
    return data, columns, 'text'


def parse_xml_file(file):
    """Parse simple XML file and return data and columns"""
    import xml.etree.ElementTree as ET

    try:
        content = file.read().decode('utf-8')
        root = ET.fromstring(content)

        data = []
        columns = set()

        # Find all elements with the same tag (assume they are records)
        children = list(root)
        if children:
            # Use the most common child tag as record type
            tag_counts = {}
            for child in children:
                tag_counts[child.tag] = tag_counts.get(child.tag, 0) + 1

            record_tag = max(tag_counts.keys(), key=lambda k: tag_counts[k])

            for element in root.findall(record_tag):
                record = {}
                # Get all attributes
                record.update(element.attrib)

                # Get all child elements
                for child in element:
                    record[child.tag] = child.text or ''

                data.append(record)
                columns.update(record.keys())

        columns = list(columns)
        return data, columns

    except Exception as e:
        # Fallback: return XML structure info
        data = [{'xml_content': content, 'parse_error': str(e)}]
        columns = ['xml_content', 'parse_error']
        return data, columns
