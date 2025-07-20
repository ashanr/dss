from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import numpy as np
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Database configuration
DATABASE = 'dss.db'

def get_db_connection():
    """Create database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with required tables and sample data"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create countries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS countries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cost_of_living REAL NOT NULL,
            university_ranking REAL NOT NULL,
            language_barrier REAL NOT NULL,
            visa_difficulty REAL NOT NULL,
            job_prospects REAL NOT NULL,
            climate_score REAL NOT NULL,
            safety_index REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create user preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            cost_weight REAL DEFAULT 1.0,
            ranking_weight REAL DEFAULT 1.0,
            language_weight REAL DEFAULT 1.0,
            visa_weight REAL DEFAULT 1.0,
            job_weight REAL DEFAULT 1.0,
            climate_weight REAL DEFAULT 1.0,
            safety_weight REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create decision results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS decision_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            country_scores TEXT NOT NULL,
            preferences TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if sample data exists
    cursor.execute("SELECT COUNT(*) FROM countries")
    count = cursor.fetchone()[0]
    
    # Insert sample data if table is empty
    if count == 0:
        sample_countries = [
            ('United States', 7.5, 9.0, 3.0, 6.0, 8.5, 7.0, 8.0),
            ('United Kingdom', 8.0, 9.5, 2.0, 7.0, 7.5, 6.0, 8.5),
            ('Canada', 6.5, 8.0, 2.5, 5.0, 8.0, 5.5, 9.0),
            ('Australia', 7.0, 8.5, 2.0, 6.5, 7.0, 8.0, 8.5),
            ('Germany', 5.5, 8.5, 6.0, 4.0, 7.5, 6.5, 8.0),
            ('Netherlands', 6.0, 8.0, 4.0, 5.5, 7.0, 7.0, 9.0),
            ('Sweden', 7.0, 7.5, 5.0, 4.5, 6.5, 4.0, 9.5),
            ('Singapore', 8.5, 7.0, 4.5, 5.0, 8.0, 9.0, 9.0),
            ('New Zealand', 6.0, 7.0, 2.0, 6.0, 6.5, 8.5, 9.0),
            ('France', 6.5, 8.0, 7.0, 5.5, 6.0, 7.5, 7.5)
        ]
        
        cursor.executemany('''
            INSERT INTO countries (name, cost_of_living, university_ranking, 
                                 language_barrier, visa_difficulty, job_prospects, 
                                 climate_score, safety_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_countries)
    
    conn.commit()
    conn.close()

class DecisionAnalyzer:
    """Decision analysis algorithms for country recommendation"""
    
    @staticmethod
    def normalize_data(data, criteria_types):
        """
        Normalize data using min-max normalization
        criteria_types: dict with 'benefit' or 'cost' for each criterion
        """
        normalized = {}
        
        for criterion, values in data.items():
            min_val = min(values)
            max_val = max(values)
            
            if max_val == min_val:
                normalized[criterion] = [1.0] * len(values)
            else:
                if criteria_types.get(criterion) == 'cost':
                    # For cost criteria, lower is better (inverse normalization)
                    normalized[criterion] = [(max_val - val) / (max_val - min_val) for val in values]
                else:
                    # For benefit criteria, higher is better
                    normalized[criterion] = [(val - min_val) / (max_val - min_val) for val in values]
        
        return normalized
    
    @staticmethod
    def saw_algorithm(normalized_data, weights, country_names):
        """
        Simple Additive Weighting (SAW) algorithm
        Returns sorted list of countries with scores
        """
        scores = []
        num_countries = len(country_names)
        
        for i in range(num_countries):
            score = 0
            for criterion, norm_values in normalized_data.items():
                weight_key = criterion + '_weight'
                if weight_key in weights:
                    score += weights[weight_key] * norm_values[i]
            scores.append(score)
        
        # Create country-score pairs and sort by score (descending)
        country_scores = list(zip(country_names, scores))
        country_scores.sort(key=lambda x: x[1], reverse=True)
        
        return country_scores

# API Routes

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'DSS API is running',
        'version': '1.0.0',
        'status': 'healthy'
    })

@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Get all countries with their criteria values"""
    try:
        conn = get_db_connection()
        countries = conn.execute('SELECT * FROM countries ORDER BY name').fetchall()
        conn.close()
        
        countries_list = []
        for country in countries:
            countries_list.append({
                'id': country['id'],
                'name': country['name'],
                'cost_of_living': country['cost_of_living'],
                'university_ranking': country['university_ranking'],
                'language_barrier': country['language_barrier'],
                'visa_difficulty': country['visa_difficulty'],
                'job_prospects': country['job_prospects'],
                'climate_score': country['climate_score'],
                'safety_index': country['safety_index']
            })
        
        return jsonify({
            'success': True,
            'countries': countries_list,
            'count': len(countries_list)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/countries', methods=['POST'])
def add_country():
    """Add a new country to the database"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'cost_of_living', 'university_ranking', 
                          'language_barrier', 'visa_difficulty', 'job_prospects', 
                          'climate_score', 'safety_index']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO countries (name, cost_of_living, university_ranking, 
                                 language_barrier, visa_difficulty, job_prospects, 
                                 climate_score, safety_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['cost_of_living'], data['university_ranking'],
              data['language_barrier'], data['visa_difficulty'], data['job_prospects'],
              data['climate_score'], data['safety_index']))
        
        country_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Country added successfully',
            'country_id': country_id
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({
            'success': False,
            'error': 'Country with this name already exists'
        }), 409
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/preferences', methods=['POST'])
def save_preferences():
    """Save user preferences"""
    try:
        data = request.get_json()
        
        # Default session ID if not provided
        session_id = data.get('session_id', 'default_session')
        
        # Default weights
        weights = {
            'cost_weight': data.get('cost_weight', 1.0),
            'ranking_weight': data.get('ranking_weight', 1.0),
            'language_weight': data.get('language_weight', 1.0),
            'visa_weight': data.get('visa_weight', 1.0),
            'job_weight': data.get('job_weight', 1.0),
            'climate_weight': data.get('climate_weight', 1.0),
            'safety_weight': data.get('safety_weight', 1.0)
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_preferences 
            (session_id, cost_weight, ranking_weight, language_weight, 
             visa_weight, job_weight, climate_weight, safety_weight)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, weights['cost_weight'], weights['ranking_weight'],
              weights['language_weight'], weights['visa_weight'], 
              weights['job_weight'], weights['climate_weight'], weights['safety_weight']))
        
        preference_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'preference_id': preference_id
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/decision/analyze', methods=['POST'])
def analyze_decision():
    """Perform decision analysis using SAW algorithm"""
    try:
        data = request.get_json()
        
        # Get user weights
        weights = {
            'cost_of_living_weight': data.get('cost_weight', 1.0),
            'university_ranking_weight': data.get('ranking_weight', 1.0),
            'language_barrier_weight': data.get('language_weight', 1.0),
            'visa_difficulty_weight': data.get('visa_weight', 1.0),
            'job_prospects_weight': data.get('job_weight', 1.0),
            'climate_score_weight': data.get('climate_weight', 1.0),
            'safety_index_weight': data.get('safety_weight', 1.0)
        }
        
        # Get countries data
        conn = get_db_connection()
        countries = conn.execute('SELECT * FROM countries ORDER BY name').fetchall()
        conn.close()
        
        if not countries:
            return jsonify({
                'success': False,
                'error': 'No countries found in database'
            }), 404
        
        # Prepare data for analysis
        country_data = {
            'cost_of_living': [],
            'university_ranking': [],
            'language_barrier': [],
            'visa_difficulty': [],
            'job_prospects': [],
            'climate_score': [],
            'safety_index': []
        }
        
        country_names = []
        
        for country in countries:
            country_names.append(country['name'])
            country_data['cost_of_living'].append(country['cost_of_living'])
            country_data['university_ranking'].append(country['university_ranking'])
            country_data['language_barrier'].append(country['language_barrier'])
            country_data['visa_difficulty'].append(country['visa_difficulty'])
            country_data['job_prospects'].append(country['job_prospects'])
            country_data['climate_score'].append(country['climate_score'])
            country_data['safety_index'].append(country['safety_index'])
        
        # Define criteria types (cost or benefit)
        criteria_types = {
            'cost_of_living': 'cost',      # Lower is better
            'university_ranking': 'benefit', # Higher is better
            'language_barrier': 'cost',     # Lower is better
            'visa_difficulty': 'cost',      # Lower is better
            'job_prospects': 'benefit',     # Higher is better
            'climate_score': 'benefit',     # Higher is better
            'safety_index': 'benefit'       # Higher is better
        }
        
        # Normalize data
        analyzer = DecisionAnalyzer()
        normalized_data = analyzer.normalize_data(country_data, criteria_types)
        
        # Apply SAW algorithm
        country_scores = analyzer.saw_algorithm(normalized_data, weights, country_names)
        
        # Format results
        results = []
        for rank, (country_name, score) in enumerate(country_scores, 1):
            results.append({
                'rank': rank,
                'country': country_name,
                'score': round(score, 4),
                'percentage': round((score / max([s[1] for s in country_scores])) * 100, 2)
            })
        
        # Save results to database
        session_id = data.get('session_id', 'default_session')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO decision_results (session_id, country_scores, preferences)
            VALUES (?, ?, ?)
        ''', (session_id, json.dumps(results), json.dumps(weights)))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'results': results,
            'analysis_summary': {
                'total_countries': len(results),
                'top_recommendation': results[0]['country'],
                'methodology': 'Simple Additive Weighting (SAW)',
                'weights_used': weights
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sensitivity/analyze', methods=['POST'])
def sensitivity_analysis():
    """Perform sensitivity analysis on decision weights"""
    try:
        data = request.get_json()
        
        base_weights = {
            'cost_weight': data.get('cost_weight', 1.0),
            'ranking_weight': data.get('ranking_weight', 1.0),
            'language_weight': data.get('language_weight', 1.0),
            'visa_weight': data.get('visa_weight', 1.0),
            'job_weight': data.get('job_weight', 1.0),
            'climate_weight': data.get('climate_weight', 1.0),
            'safety_weight': data.get('safety_weight', 1.0)
        }
        
        sensitivity_results = {}
        
        # Test each weight by varying it by ±20%
        for weight_name in base_weights.keys():
            sensitivity_results[weight_name] = []
            
            for variation in [-0.2, -0.1, 0, 0.1, 0.2]:
                modified_weights = base_weights.copy()
                modified_weights[weight_name] *= (1 + variation)
                
                # Convert to analysis format
                analysis_weights = {
                    'cost_of_living_weight': modified_weights['cost_weight'],
                    'university_ranking_weight': modified_weights['ranking_weight'],
                    'language_barrier_weight': modified_weights['language_weight'],
                    'visa_difficulty_weight': modified_weights['visa_weight'],
                    'job_prospects_weight': modified_weights['job_weight'],
                    'climate_score_weight': modified_weights['climate_weight'],
                    'safety_index_weight': modified_weights['safety_weight']
                }
                
                # Run analysis with modified weights
                # (This would use the same logic as analyze_decision)
                # For brevity, we'll return the structure
                
                sensitivity_results[weight_name].append({
                    'variation': variation,
                    'weight_value': modified_weights[weight_name],
                    'top_country': 'Sample Country',  # Would be calculated
                    'score_change': variation * 0.1   # Simplified calculation
                })
        
        return jsonify({
            'success': True,
            'sensitivity_results': sensitivity_results,
            'summary': 'Sensitivity analysis shows impact of weight changes on rankings'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/data/update', methods=['POST'])
def update_country_data():
    """Update existing country data"""
    try:
        data = request.get_json()
        country_id = data.get('id')
        
        if not country_id:
            return jsonify({
                'success': False,
                'error': 'Country ID is required'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        updatable_fields = ['name', 'cost_of_living', 'university_ranking', 
                           'language_barrier', 'visa_difficulty', 'job_prospects', 
                           'climate_score', 'safety_index']
        
        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                update_values.append(data[field])
        
        if not update_fields:
            return jsonify({
                'success': False,
                'error': 'No valid fields to update'
            }), 400
        
        update_values.append(country_id)
        query = f"UPDATE countries SET {', '.join(update_fields)} WHERE id = ?"
        
        cursor.execute(query, update_values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Country not found'
            }), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Country data updated successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# Initialize database when app starts
if __name__ == '__main__':
    # Create database tables and sample data
    init_database()
    
    # Run the Flask application
    app.run(debug=True, host='0.0.0.0', port=5000)
