"""
Data management routes for countries and system data.
Handles CRUD operations for countries and data updates.
"""

from flask import request, jsonify, current_app
from . import data_bp
from models.country import CountryManager, Country
from services.analytics import AnalyticsService
from datetime import datetime
import csv
import io

# Initialize services
country_manager = CountryManager()
analytics_service = AnalyticsService()


@data_bp.route('/countries', methods=['GET'])
def get_all_countries():
    """
    Retrieve all countries with optional filtering and sorting
    
    Query parameters:
    - sort_by: field to sort by (name, cost_of_living, etc.)
    - order: asc or desc
    - limit: number of results
    - offset: pagination offset
    """
    try:
        # Get query parameters
        sort_by = request.args.get('sort_by', 'name')
        order = request.args.get('order', 'asc').lower()
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get all countries
        countries = country_manager.get_all_countries()
        
        # Sort countries
        valid_sort_fields = ['name', 'cost_of_living', 'university_ranking', 
                            'language_barrier', 'visa_difficulty', 'job_prospects', 
                            'climate_score', 'safety_index']
        
        if sort_by in valid_sort_fields:
            reverse_order = order == 'desc'
            countries.sort(key=lambda x: getattr(x, sort_by), reverse=reverse_order)
        
        # Apply pagination
        if limit:
            countries = countries[offset:offset + limit]
        elif offset > 0:
            countries = countries[offset:]
        
        # Convert to dict format
        countries_data = [country.to_dict() for country in countries]
        
        return jsonify({
            'success': True,
            'countries': countries_data,
            'count': len(countries_data),
            'pagination': {
                'offset': offset,
                'limit': limit,
                'total_available': len(country_manager.get_all_countries())
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get countries error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error retrieving countries: {str(e)}'
        }), 500


@data_bp.route('/countries', methods=['POST'])
def add_country():
    """
    Add a new country to the database
    
    Expected JSON payload:
    {
        "name": "Japan",
        "cost_of_living": 8.0,
        "university_ranking": 7.5,
        "language_barrier": 8.5,
        "visa_difficulty": 7.0,
        "job_prospects": 6.5,
        "climate_score": 7.0,
        "safety_index": 9.5
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'JSON payload is required'
            }), 400
        
        # Create country object
        country = Country.from_dict(data)
        
        # Validate country data
        is_valid, message = country.validate()
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid country data: {message}'
            }), 400
        
        # Add country to database
        country_id = country_manager.add_country(country)
        
        return jsonify({
            'success': True,
            'message': 'Country added successfully',
            'country_id': country_id,
            'country': country.to_dict()
        }), 201
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception as e:
        current_app.logger.error(f'Add country error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error adding country: {str(e)}'
        }), 500


@data_bp.route('/countries/<int:country_id>', methods=['GET'])
def get_country_by_id(country_id):
    """Get a specific country by ID"""
    try:
        country = country_manager.get_country_by_id(country_id)
        
        if not country:
            return jsonify({
                'success': False,
                'error': 'Country not found'
            }), 404
        
        return jsonify({
            'success': True,
            'country': country.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get country error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error retrieving country: {str(e)}'
        }), 500


@data_bp.route('/countries/<int:country_id>', methods=['PUT'])
def update_country(country_id):
    """
    Update an existing country
    
    Expected JSON payload with fields to update:
    {
        "name": "Updated Name",
        "cost_of_living": 7.5,
        ... (any fields to update)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'JSON payload is required'
            }), 400
        
        # Update country
        success = country_manager.update_country(country_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Country not found or no changes made'
            }), 404
        
        # Get updated country
        updated_country = country_manager.get_country_by_id(country_id)
        
        return jsonify({
            'success': True,
            'message': 'Country updated successfully',
            'country': updated_country.to_dict() if updated_country else None
        })
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception as e:
        current_app.logger.error(f'Update country error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error updating country: {str(e)}'
        }), 500


@data_bp.route('/countries/<int:country_id>', methods=['DELETE'])
def delete_country(country_id):
    """Delete a country by ID"""
    try:
        success = country_manager.delete_country(country_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Country not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Country deleted successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f'Delete country error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error deleting country: {str(e)}'
        }), 500


@data_bp.route('/countries/bulk', methods=['POST'])
def bulk_upload_countries():
    """
    Bulk upload countries from CSV data
    
    Expected form data:
    - file: CSV file with country data
    Or JSON payload:
    - csv_data: CSV data as string
    - countries: Array of country objects
    """
    try:
        # Check if file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({
                    'success': False,
                    'error': 'No file selected'
                }), 400
            
            if not file.filename.endswith('.csv'):
                return jsonify({
                    'success': False,
                    'error': 'File must be a CSV'
                }), 400
            
            csv_data = file.read().decode('utf-8')
        
        # Check if JSON payload
        elif request.is_json:
            data = request.get_json()
            if 'csv_data' in data:
                csv_data = data['csv_data']
            elif 'countries' in data:
                # Direct country objects upload
                return bulk_upload_from_json(data['countries'])
            else:
                return jsonify({
                    'success': False,
                    'error': 'Either csv_data or countries array is required'
                }), 400
        
        else:
            return jsonify({
                'success': False,
                'error': 'Either file upload or JSON payload is required'
            }), 400
        
        # Parse CSV data
        results = parse_and_upload_csv(csv_data)
        
        return jsonify({
            'success': True,
            'message': 'Bulk upload completed',
            'results': results
        })
        
    except Exception as e:
        current_app.logger.error(f'Bulk upload error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error during bulk upload: {str(e)}'
        }), 500


@data_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get database statistics and analytics"""
    try:
        stats = country_manager.get_statistics()
        analytics_stats = analytics_service.get_system_statistics()
        
        return jsonify({
            'success': True,
            'database_statistics': stats,
            'analytics_statistics': analytics_stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get statistics error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error retrieving statistics: {str(e)}'
        }), 500


@data_bp.route('/export', methods=['GET'])
def export_countries():
    """
    Export countries data in various formats
    
    Query parameters:
    - format: csv, json (default: json)
    - fields: comma-separated list of fields to include
    """
    try:
        export_format = request.args.get('format', 'json').lower()
        fields = request.args.get('fields', '').split(',') if request.args.get('fields') else None
        
        countries = country_manager.get_all_countries()
        
        if export_format == 'csv':
            return export_as_csv(countries, fields)
        else:
            # Default to JSON
            countries_data = [country.to_dict() for country in countries]
            
            # Filter fields if specified
            if fields:
                filtered_data = []
                for country in countries_data:
                    filtered_country = {field: country.get(field) for field in fields if field in country}
                    filtered_data.append(filtered_country)
                countries_data = filtered_data
            
            return jsonify({
                'success': True,
                'countries': countries_data,
                'count': len(countries_data),
                'export_timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        current_app.logger.error(f'Export error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error during export: {str(e)}'
        }), 500


# Helper functions

def bulk_upload_from_json(countries_data):
    """Upload countries from JSON array"""
    results = {
        'success_count': 0,
        'error_count': 0,
        'errors': []
    }
    
    for i, country_data in enumerate(countries_data):
        try:
            country = Country.from_dict(country_data)
            country_manager.add_country(country)
            results['success_count'] += 1
        except Exception as e:
            results['error_count'] += 1
            results['errors'].append({
                'row': i + 1,
                'error': str(e),
                'data': country_data
            })
    
    return results


def parse_and_upload_csv(csv_data):
    """Parse CSV data and upload countries"""
    results = {
        'success_count': 0,
        'error_count': 0,
        'errors': []
    }
    
    csv_file = io.StringIO(csv_data)
    reader = csv.DictReader(csv_file)
    
    for row_num, row in enumerate(reader, start=2):  # Start from 2 (header is row 1)
        try:
            # Clean and convert data
            country_data = {}
            for key, value in row.items():
                if key and value:  # Skip empty keys/values
                    if key in ['cost_of_living', 'university_ranking', 'language_barrier',
                              'visa_difficulty', 'job_prospects', 'climate_score', 'safety_index']:
                        country_data[key] = float(value)
                    else:
                        country_data[key] = value.strip()
            
            country = Country.from_dict(country_data)
            country_manager.add_country(country)
            results['success_count'] += 1
            
        except Exception as e:
            results['error_count'] += 1
            results['errors'].append({
                'row': row_num,
                'error': str(e),
                'data': row
            })
    
    return results


def export_as_csv(countries, fields=None):
    """Export countries as CSV"""
    from flask import Response
    
    output = io.StringIO()
    
    # Define all possible fields
    all_fields = ['id', 'name', 'cost_of_living', 'university_ranking', 
                  'language_barrier', 'visa_difficulty', 'job_prospects', 
                  'climate_score', 'safety_index', 'created_at']
    
    # Use specified fields or all fields
    csv_fields = fields if fields else all_fields
    
    writer = csv.DictWriter(output, fieldnames=csv_fields)
    writer.writeheader()
    
    for country in countries:
        country_dict = country.to_dict()
        # Filter to only include requested fields
        filtered_dict = {field: country_dict.get(field, '') for field in csv_fields}
        writer.writerow(filtered_dict)
    
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment;filename=countries_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'}
    )
