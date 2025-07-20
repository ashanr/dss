"""
Main API routes for decision analysis and user preferences.
Handles decision analysis, sensitivity analysis, and preference management.
"""

from flask import request, jsonify, current_app
from . import api_bp
from models.country import CountryManager
from models.decision import DecisionManager, UserPreferences
from services.saw_algorithm import SAWService
from services.analytics import AnalyticsService
import uuid
from datetime import datetime

# Initialize services
country_manager = CountryManager()
decision_manager = DecisionManager()
saw_service = SAWService()
analytics_service = AnalyticsService()


@api_bp.route('/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'service': 'DSS API'
    })


@api_bp.route('/decision/analyze', methods=['POST'])
def analyze_decision():
    """
    Perform decision analysis using SAW algorithm
    
    Expected JSON payload:
    {
        "session_id": "optional_session_id",
        "cost_weight": 1.5,
        "ranking_weight": 2.0,
        "language_weight": 0.5,
        "visa_weight": 1.0,
        "job_weight": 1.8,
        "climate_weight": 0.8,
        "safety_weight": 1.3
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'JSON payload is required'
            }), 400
        
        # Generate session ID if not provided
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Create user preferences object
        preferences = UserPreferences(
            session_id=session_id,
            cost_weight=float(data.get('cost_weight', 1.0)),
            ranking_weight=float(data.get('ranking_weight', 1.0)),
            language_weight=float(data.get('language_weight', 1.0)),
            visa_weight=float(data.get('visa_weight', 1.0)),
            job_weight=float(data.get('job_weight', 1.0)),
            climate_weight=float(data.get('climate_weight', 1.0)),
            safety_weight=float(data.get('safety_weight', 1.0))
        )
        
        # Validate preferences
        is_valid, message = preferences.validate()
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid preferences: {message}'
            }), 400
        
        # Get countries data
        try:
            countries_data, country_names = country_manager.get_countries_data_for_analysis()
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error retrieving countries data: {str(e)}'
            }), 500
        
        # Perform SAW analysis
        try:
            results = saw_service.analyze(
                countries_data, 
                preferences.to_analysis_weights(), 
                country_names
            )
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error during analysis: {str(e)}'
            }), 500
        
        # Save preferences and results
        try:
            decision_manager.save_preferences(preferences)
            decision_manager.save_analysis_result(session_id, results, preferences)
        except Exception as e:
            current_app.logger.warning(f'Failed to save analysis results: {str(e)}')
        
        # Format response
        response_results = []
        for result in results:
            response_results.append({
                'rank': result.rank,
                'country': result.country,
                'score': result.score,
                'percentage': result.percentage,
                'criteria_breakdown': result.criteria_scores
            })
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'results': response_results,
            'analysis_summary': {
                'total_countries': len(results),
                'top_recommendation': results[0].country if results else None,
                'methodology': 'Simple Additive Weighting (SAW)',
                'weights_used': preferences.to_analysis_weights(),
                'analysis_timestamp': datetime.now().isoformat()
            }
        })
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': f'Invalid input data: {str(ve)}'
        }), 400
    except Exception as e:
        current_app.logger.error(f'Decision analysis error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Internal server error during analysis'
        }), 500


@api_bp.route('/sensitivity/analyze', methods=['POST'])
def sensitivity_analysis():
    """
    Perform sensitivity analysis on decision weights
    
    Expected JSON payload:
    {
        "session_id": "optional_session_id",
        "cost_weight": 1.5,
        "ranking_weight": 2.0,
        ... (same as decision analysis)
        "variation_range": [-0.2, -0.1, 0, 0.1, 0.2] // optional
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'JSON payload is required'
            }), 400
        
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Create user preferences
        preferences = UserPreferences(
            session_id=session_id,
            cost_weight=float(data.get('cost_weight', 1.0)),
            ranking_weight=float(data.get('ranking_weight', 1.0)),
            language_weight=float(data.get('language_weight', 1.0)),
            visa_weight=float(data.get('visa_weight', 1.0)),
            job_weight=float(data.get('job_weight', 1.0)),
            climate_weight=float(data.get('climate_weight', 1.0)),
            safety_weight=float(data.get('safety_weight', 1.0))
        )
        
        # Validate preferences
        is_valid, message = preferences.validate()
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid preferences: {message}'
            }), 400
        
        # Get variation range
        variation_range = data.get('variation_range', [-0.2, -0.1, 0, 0.1, 0.2])
        
        # Get countries data
        countries_data, country_names = country_manager.get_countries_data_for_analysis()
        
        # Perform sensitivity analysis
        sensitivity_results = analytics_service.perform_sensitivity_analysis(
            countries_data,
            preferences.to_analysis_weights(),
            country_names,
            variation_range
        )
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'sensitivity_results': sensitivity_results,
            'analysis_summary': {
                'methodology': 'Weight Variation Analysis',
                'variation_range': variation_range,
                'base_weights': preferences.to_analysis_weights(),
                'analysis_timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Sensitivity analysis error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error during sensitivity analysis: {str(e)}'
        }), 500


@api_bp.route('/preferences', methods=['POST'])
def save_preferences():
    """
    Save user preferences
    
    Expected JSON payload:
    {
        "session_id": "required_session_id",
        "cost_weight": 1.5,
        "ranking_weight": 2.0,
        ... (all weight parameters)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'JSON payload is required'
            }), 400
        
        session_id = data.get('session_id')
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        # Create preferences object
        preferences = UserPreferences(
            session_id=session_id,
            cost_weight=float(data.get('cost_weight', 1.0)),
            ranking_weight=float(data.get('ranking_weight', 1.0)),
            language_weight=float(data.get('language_weight', 1.0)),
            visa_weight=float(data.get('visa_weight', 1.0)),
            job_weight=float(data.get('job_weight', 1.0)),
            climate_weight=float(data.get('climate_weight', 1.0)),
            safety_weight=float(data.get('safety_weight', 1.0))
        )
        
        # Validate preferences
        is_valid, message = preferences.validate()
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'Invalid preferences: {message}'
            }), 400
        
        # Save preferences
        preference_id = decision_manager.save_preferences(preferences)
        
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'preference_id': preference_id,
            'session_id': session_id
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Save preferences error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error saving preferences: {str(e)}'
        }), 500


@api_bp.route('/preferences/<session_id>', methods=['GET'])
def get_preferences(session_id):
    """Get latest preferences for a session"""
    try:
        preferences = decision_manager.get_preferences(session_id)
        
        if not preferences:
            return jsonify({
                'success': False,
                'error': 'No preferences found for this session'
            }), 404
        
        return jsonify({
            'success': True,
            'preferences': {
                'session_id': preferences.session_id,
                'cost_weight': preferences.cost_weight,
                'ranking_weight': preferences.ranking_weight,
                'language_weight': preferences.language_weight,
                'visa_weight': preferences.visa_weight,
                'job_weight': preferences.job_weight,
                'climate_weight': preferences.climate_weight,
                'safety_weight': preferences.safety_weight,
                'created_at': preferences.created_at.isoformat() if preferences.created_at else None
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get preferences error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error retrieving preferences: {str(e)}'
        }), 500


@api_bp.route('/history/<session_id>', methods=['GET'])
def get_analysis_history(session_id):
    """Get analysis history for a session"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = decision_manager.get_analysis_history(session_id, limit)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'history': history,
            'count': len(history)
        })
        
    except Exception as e:
        current_app.logger.error(f'Get history error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error retrieving history: {str(e)}'
        }), 500


@api_bp.route('/compare', methods=['POST'])
def compare_countries():
    """
    Compare specific countries side by side
    
    Expected JSON payload:
    {
        "countries": ["Canada", "Australia", "Germany"],
        "criteria": ["cost_of_living", "university_ranking", "safety_index"] // optional
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'countries' not in data:
            return jsonify({
                'success': False,
                'error': 'Countries list is required'
            }), 400
        
        country_names = data['countries']
        criteria = data.get('criteria', None)  # If None, use all criteria
        
        # Get comparison data
        comparison_data = analytics_service.compare_countries(country_names, criteria)
        
        return jsonify({
            'success': True,
            'comparison': comparison_data,
            'analysis_timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f'Country comparison error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error during country comparison: {str(e)}'
        }), 500
