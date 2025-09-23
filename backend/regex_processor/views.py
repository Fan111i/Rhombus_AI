from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import LLMService
import json


def main_page(request):
    """
    Main page with unified input and upload modes
    """
    return render(request, 'regex_processor/main.html')


@api_view(['POST'])
def convert_to_regex(request):
    """
    Convert natural language description to regex pattern with enhanced intelligence
    """
    try:
        data = request.data
        description = data.get('description', '').strip()
        context = data.get('context', '')
        column_data = data.get('column_data', None)

        if not description:
            return Response({
                'error': 'Description is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        result = llm_service.natural_language_to_regex(description, context, column_data)

        if result['success']:
            response_data = {
                'success': True,
                'pattern': result['pattern'],
                'description': result['description'],
                'source': result.get('source', 'unknown')
            }

            # Add explanation if available
            if 'explanation' in result:
                response_data['explanation'] = result['explanation']

            return Response(response_data)
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Failed to generate regex pattern')
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def analyze_column(request):
    """
    Analyze column data to provide intelligent insights and pattern suggestions
    """
    try:
        data = request.data
        column_data = data.get('column_data', [])
        column_name = data.get('column_name', 'column')

        if not column_data:
            return Response({
                'error': 'Column data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        analysis = llm_service.analyze_column_data(column_data, column_name)

        return Response({
            'success': True,
            'analysis': analysis
        })

    except Exception as e:
        return Response({
            'error': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def test_regex_pattern(request):
    """
    Test regex pattern on sample data
    """
    try:
        data = request.data
        pattern = data.get('pattern', '').strip()
        sample_data = data.get('sample_data', [])
        replacement = data.get('replacement', '[MATCH]')

        if not pattern:
            return Response({
                'error': 'Pattern is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not sample_data:
            return Response({
                'error': 'Sample data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        test_result = llm_service.test_regex_on_sample(pattern, sample_data, replacement)

        return Response(test_result)

    except Exception as e:
        return Response({
            'error': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def natural_language_query(request):
    """
    Process natural language queries on data (like SQL but in natural language)
    """
    try:
        data = request.data
        query = data.get('query', '').strip()
        dataset = data.get('data', [])
        columns = data.get('columns', [])

        if not query:
            return Response({
                'error': 'Query is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not dataset:
            return Response({
                'error': 'Data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not columns:
            return Response({
                'error': 'Columns are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        query_result = llm_service.natural_language_query(query, dataset, columns)

        return Response(query_result)

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
    Apply regex pattern to data columns
    Can apply to specific column or all text columns based on requirement
    """
    try:
        data = request.data.get('data', [])
        column = request.data.get('column', '')
        pattern = request.data.get('pattern', '')
        replacement = request.data.get('replacement', '[MATCH]')
        apply_to_all_columns = request.data.get('apply_to_all_columns', False)

        if not all([data, pattern]):
            return Response({
                'success': False,
                'error': 'Missing required parameters: data, pattern'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if specific column or all columns
        if not apply_to_all_columns and not column:
            return Response({
                'success': False,
                'error': 'Either specify a column or set apply_to_all_columns to true'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()
        processed_data = []
        matches_count = 0
        affected_rows = 0
        affected_columns = []

        for row in data:
            new_row = row.copy()
            row_modified = False

            if apply_to_all_columns:
                # Apply to all text columns (requirement behavior)
                for col_name, col_value in row.items():
                    if col_value and isinstance(col_value, str):
                        original_value = str(col_value)
                        result = llm_service.apply_regex_replacement(original_value, pattern, replacement)

                        if result['success']:
                            new_row[col_name] = result['result']
                            if result['result'] != original_value:
                                row_modified = True
                                if col_name not in affected_columns:
                                    affected_columns.append(col_name)
                                # Count actual replacements
                                import re
                                try:
                                    matches_count += len(re.findall(pattern, original_value))
                                except re.error:
                                    # If regex fails, try literal matching
                                    matches_count += original_value.count(pattern)
                        else:
                            # If regex fails, keep original value
                            new_row[col_name] = original_value
            else:
                # Apply to specific column only
                if column in row and row[column]:
                    original_value = str(row[column])
                    result = llm_service.apply_regex_replacement(original_value, pattern, replacement)

                    if result['success']:
                        new_row[column] = result['result']
                        if result['result'] != original_value:
                            row_modified = True
                            if column not in affected_columns:
                                affected_columns.append(column)
                            # Count actual replacements
                            import re
                            try:
                                matches_count += len(re.findall(pattern, original_value))
                            except re.error:
                                # If regex fails, try literal matching
                                matches_count += original_value.count(pattern)
                    else:
                        # If regex fails, keep original value
                        new_row[column] = original_value

            if row_modified:
                affected_rows += 1
            processed_data.append(new_row)

        return Response({
            'success': True,
            'processed_data': processed_data,
            'matches_count': matches_count,
            'affected_rows': affected_rows,
            'affected_columns': affected_columns,
            'total_rows': len(data),
            'pattern': pattern,
            'replacement': replacement
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


@api_view(['POST'])
def process_natural_language_task(request):
    """
    Process natural language tasks including pattern matching and replacement
    Based on requirement: "Find email addresses in the Email column and replace them with 'REDACTED'"
    """
    try:
        data = request.data
        task_description = data.get('task', '').strip()
        dataset = data.get('data', [])
        columns = data.get('columns', [])

        if not task_description:
            return Response({
                'error': 'Task description is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not dataset:
            return Response({
                'error': 'Data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not columns:
            return Response({
                'error': 'Columns are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        llm_service = LLMService()

        # Parse the natural language task to extract pattern, column, and replacement
        task_result = llm_service.parse_natural_language_task(task_description, dataset, columns)

        if not task_result['success']:
            return Response({
                'success': False,
                'error': task_result['error'],
                'suggestions': task_result.get('suggestions', [])
            })

        # Get the parsed components
        target_column = task_result['column']
        pattern_description = task_result['pattern_description']
        replacement_value = task_result.get('replacement')

        # Generate regex pattern
        column_data = [row.get(target_column, '') for row in dataset if row.get(target_column)]
        pattern_result = llm_service.natural_language_to_regex(
            pattern_description,
            f"Processing column: {target_column}",
            column_data[:100]
        )

        if not pattern_result['success']:
            return Response({
                'success': False,
                'error': f'Failed to generate pattern: {pattern_result.get("error", "Unknown error")}'
            })

        regex_pattern = pattern_result['pattern']

        # Apply replacement if specified
        processed_data = dataset.copy()
        total_replacements = 0
        matched_rows = []

        if replacement_value:
            # Perform replacement
            import re
            for i, row in enumerate(processed_data):
                original_value = str(row.get(target_column, ''))
                if original_value:
                    try:
                        new_value, count = re.subn(regex_pattern, replacement_value, original_value)
                        if count > 0:
                            row[target_column] = new_value
                            total_replacements += count
                            matched_rows.append(i)
                    except re.error:
                        # If regex fails, try literal matching
                        if regex_pattern in original_value:
                            new_value = original_value.replace(regex_pattern, replacement_value)
                            row[target_column] = new_value
                            total_replacements += 1
                            matched_rows.append(i)
        else:
            # Just find matches without replacement
            import re
            for i, row in enumerate(processed_data):
                original_value = str(row.get(target_column, ''))
                if original_value:
                    try:
                        if re.search(regex_pattern, original_value):
                            matched_rows.append(i)
                    except re.error:
                        # If regex fails, try literal matching
                        if regex_pattern in original_value:
                            matched_rows.append(i)

        return Response({
            'success': True,
            'task': task_description,
            'column': target_column,
            'pattern': regex_pattern,
            'pattern_description': pattern_description,
            'replacement': replacement_value,
            'total_matches': len(matched_rows),
            'total_replacements': total_replacements,
            'processed_data': processed_data,
            'matched_rows': matched_rows,
            'source': pattern_result.get('source', 'unknown')
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': f'Task processing error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
