"""
Decision analysis models and algorithms for the DSS system.
Implements various MCDM (Multi-Criteria Decision Making) methods.
"""

import numpy as np
import sqlite3
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class CriteriaType(Enum):
    """Types of criteria for decision analysis"""
    BENEFIT = "benefit"  # Higher values are better
    COST = "cost"        # Lower values are better

@dataclass
class DecisionCriteria:
    """Decision criteria configuration"""
    name: str
    weight: float
    criteria_type: CriteriaType
    
    def validate(self) -> Tuple[bool, str]:
        """Validate criteria configuration"""
        if not self.name:
            return False, "Criteria name is required"
        if not (0 <= self.weight <= 10):
            return False, "Weight must be between 0 and 10"
        return True, "Valid"

@dataclass
class DecisionResult:
    """Result of decision analysis"""
    country: str
    score: float
    rank: int
    percentage: float
    criteria_scores: Dict[str, float]

@dataclass
class UserPreferences:
    """User preference weights for decision criteria"""
    session_id: str
    cost_weight: float = 1.0
    ranking_weight: float = 1.0
    language_weight: float = 1.0
    visa_weight: float = 1.0
    job_weight: float = 1.0
    climate_weight: float = 1.0
    safety_weight: float = 1.0
    created_at: Optional[datetime] = None
    
    def validate(self) -> Tuple[bool, str]:
        """Validate user preferences"""
        if not self.session_id:
            return False, "Session ID is required"
        
        weights = [self.cost_weight, self.ranking_weight, self.language_weight,
                  self.visa_weight, self.job_weight, self.climate_weight, 
                  self.safety_weight]
        
        for i, weight in enumerate(weights):
            if not isinstance(weight, (int, float)):
                return False, f"Weight {i+1} must be a number"
            if weight < 0:
                return False, f"Weight {i+1} cannot be negative"
            if weight > 10:
                return False, f"Weight {i+1} cannot exceed 10"
        
        return True, "Valid"
    
    def to_analysis_weights(self) -> Dict[str, float]:
        """Convert to format used by analysis algorithms"""
        return {
            'cost_of_living_weight': self.cost_weight,
            'university_ranking_weight': self.ranking_weight,
            'language_barrier_weight': self.language_weight,
            'visa_difficulty_weight': self.visa_weight,
            'job_prospects_weight': self.job_weight,
            'climate_score_weight': self.climate_weight,
            'safety_index_weight': self.safety_weight
        }


class DataNormalizer:
    """Handles data normalization for decision analysis"""
    
    @staticmethod
    def min_max_normalize(values: List[float], criteria_type: CriteriaType) -> List[float]:
        """
        Min-Max normalization for a single criterion
        
        Args:
            values: List of values to normalize
            criteria_type: Whether higher or lower values are better
        
        Returns:
            List of normalized values between 0 and 1
        """
        if not values:
            return []
        
        min_val = min(values)
        max_val = max(values)
        
        # Handle case where all values are the same
        if max_val == min_val:
            return [1.0] * len(values)
        
        if criteria_type == CriteriaType.COST:
            # For cost criteria, lower is better (inverse normalization)
            return [(max_val - val) / (max_val - min_val) for val in values]
        else:
            # For benefit criteria, higher is better
            return [(val - min_val) / (max_val - min_val) for val in values]
    
    @staticmethod
    def normalize_dataset(data: Dict[str, List[float]], 
                         criteria_types: Dict[str, CriteriaType]) -> Dict[str, List[float]]:
        """
        Normalize entire dataset
        
        Args:
            data: Dictionary with criterion names as keys and lists of values
            criteria_types: Dictionary mapping criterion names to their types
        
        Returns:
            Dictionary with normalized values
        """
        normalized = {}
        
        for criterion, values in data.items():
            if criterion not in criteria_types:
                raise ValueError(f"Criteria type not defined for {criterion}")
            
            normalized[criterion] = DataNormalizer.min_max_normalize(
                values, criteria_types[criterion]
            )
        
        return normalized


class SAWAnalyzer:
    """Simple Additive Weighting (SAW) algorithm implementation"""
    
    def __init__(self):
        self.criteria_types = {
            'cost_of_living': CriteriaType.COST,
            'university_ranking': CriteriaType.BENEFIT,
            'language_barrier': CriteriaType.COST,
            'visa_difficulty': CriteriaType.COST,
            'job_prospects': CriteriaType.BENEFIT,
            'climate_score': CriteriaType.BENEFIT,
            'safety_index': CriteriaType.BENEFIT
        }
    
    def analyze(self, data: Dict[str, List[float]], 
                weights: Dict[str, float], 
                country_names: List[str]) -> List[DecisionResult]:
        """
        Perform SAW analysis
        
        Args:
            data: Country data for each criterion
            weights: User-defined weights for each criterion
            country_names: List of country names
        
        Returns:
            List of DecisionResult objects sorted by score (descending)
        """
        if not data or not weights or not country_names:
            raise ValueError("Data, weights, and country names are required")
        
        num_countries = len(country_names)
        if num_countries == 0:
            return []
        
        # Validate data consistency
        for criterion, values in data.items():
            if len(values) != num_countries:
                raise ValueError(f"Data length mismatch for criterion {criterion}")
        
        # Normalize data
        normalized_data = DataNormalizer.normalize_dataset(data, self.criteria_types)
        
        # Calculate weighted scores
        results = []
        for i in range(num_countries):
            score = 0
            criteria_scores = {}
            
            for criterion, norm_values in normalized_data.items():
                weight_key = criterion + '_weight'
                if weight_key in weights:
                    weighted_score = weights[weight_key] * norm_values[i]
                    score += weighted_score
                    criteria_scores[criterion] = weighted_score
            
            results.append({
                'country': country_names[i],
                'score': score,
                'criteria_scores': criteria_scores
            })
        
        # Sort by score (descending)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Calculate percentages and ranks
        max_score = max(result['score'] for result in results) if results else 1
        
        decision_results = []
        for rank, result in enumerate(results, 1):
            decision_results.append(DecisionResult(
                country=result['country'],
                score=round(result['score'], 4),
                rank=rank,
                percentage=round((result['score'] / max_score) * 100, 2),
                criteria_scores=result['criteria_scores']
            ))
        
        return decision_results


class SensitivityAnalyzer:
    """Performs sensitivity analysis on decision weights"""
    
    def __init__(self, saw_analyzer: SAWAnalyzer):
        self.saw_analyzer = saw_analyzer
    
    def analyze(self, data: Dict[str, List[float]], 
                base_weights: Dict[str, float], 
                country_names: List[str],
                variation_range: List[float] = None) -> Dict:
        """
        Perform sensitivity analysis
        
        Args:
            data: Country data for each criterion
            base_weights: Base weight configuration
            country_names: List of country names
            variation_range: List of variation percentages (default: [-0.2, -0.1, 0, 0.1, 0.2])
        
Returns:
            Dictionary containing sensitivity analysis results
        """
        if variation_range is None:
            variation_range = [-0.2, -0.1, 0, 0.1, 0.2]
        
        # Get baseline analysis
        baseline_results = self.saw_analyzer.analyze(data, base_weights, country_names)
        baseline_ranking = [result.country for result in baseline_results]
        
        sensitivity_results = {}
        
        # Test each weight
        for weight_name in base_weights.keys():
            if not weight_name.endswith('_weight'):
                continue
                
            criterion_name = weight_name.replace('_weight', '')
            sensitivity_results[criterion_name] = {
                'variations': [],
                'ranking_changes': [],
                'score_changes': []
            }
            
            for variation in variation_range:
                # Create modified weights
                modified_weights = base_weights.copy()
                modified_weights[weight_name] *= (1 + variation)
                
                # Run analysis with modified weights
                try:
                    modified_results = self.saw_analyzer.analyze(data, modified_weights, country_names)
                    modified_ranking = [result.country for result in modified_results]
                    
                    # Calculate ranking changes
                    ranking_changes = self._calculate_ranking_changes(baseline_ranking, modified_ranking)
                    
                    # Calculate score changes for top country
                    baseline_top_score = baseline_results[0].score
                    modified_top_score = modified_results[0].score
                    score_change = ((modified_top_score - baseline_top_score) / baseline_top_score) * 100
                    
                    sensitivity_results[criterion_name]['variations'].append({
                        'variation_percentage': variation * 100,
                        'new_weight_value': modified_weights[weight_name],
                        'top_country': modified_results[0].country,
                        'top_score': modified_results[0].score,
                        'score_change_percent': round(score_change, 2)
                    })
                    
                    sensitivity_results[criterion_name]['ranking_changes'].append(ranking_changes)
                    sensitivity_results[criterion_name]['score_changes'].append(score_change)
                    
                except Exception as e:
                    print(f"Error in sensitivity analysis for {criterion_name} at {variation}: {str(e)}")
        
        return {
            'baseline_ranking': baseline_ranking,
            'sensitivity_results': sensitivity_results,
            'summary': self._generate_sensitivity_summary(sensitivity_results)
        }
    
    def _calculate_ranking_changes(self, baseline: List[str], modified: List[str]) -> int:
        """Calculate number of ranking position changes"""
        changes = 0
        for i, country in enumerate(baseline):
            if i < len(modified) and modified[i] != country:
                changes += 1
        return changes
    
    def _generate_sensitivity_summary(self, results: Dict) -> Dict:
        """Generate summary of sensitivity analysis"""
        most_sensitive = None
        max_avg_change = 0
        
        for criterion, data in results.items():
            if 'score_changes' in data and data['score_changes']:
                avg_change = np.mean([abs(change) for change in data['score_changes']])
                if avg_change > max_avg_change:
                    max_avg_change = avg_change
                    most_sensitive = criterion
        
        return {
            'most_sensitive_criterion': most_sensitive,
            'max_average_change': round(max_avg_change, 2),
            'analysis_method': 'Weight variation ±20%'
        }


class DecisionManager:
    """Manages decision analysis operations and database interactions"""
    
    def __init__(self, db_path: str = 'dss.db'):
        self.db_path = db_path
        self.saw_analyzer = SAWAnalyzer()
        self.sensitivity_analyzer = SensitivityAnalyzer(self.saw_analyzer)
    
    def get_connection(self) -> sqlite3.Connection:
        """Create database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def save_preferences(self, preferences: UserPreferences) -> int:
        """Save user preferences to database"""
        # Validate preferences
        is_valid, message = preferences.validate()
        if not is_valid:
            raise ValueError(f"Invalid preferences: {message}")
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO user_preferences 
                (session_id, cost_weight, ranking_weight, language_weight, 
                 visa_weight, job_weight, climate_weight, safety_weight)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (preferences.session_id, preferences.cost_weight, preferences.ranking_weight,
                  preferences.language_weight, preferences.visa_weight, preferences.job_weight,
                  preferences.climate_weight, preferences.safety_weight))
            
            preference_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return preference_id
            
        except Exception as e:
            raise Exception(f"Error saving preferences: {str(e)}")
    
    def get_preferences(self, session_id: str) -> Optional[UserPreferences]:
        """Get latest preferences for session"""
        try:
            conn = self.get_connection()
            cursor = conn.execute('''
                SELECT * FROM user_preferences 
                WHERE session_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            ''', (session_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return UserPreferences(
                session_id=row['session_id'],
                cost_weight=row['cost_weight'],
                ranking_weight=row['ranking_weight'],
                language_weight=row['language_weight'],
                visa_weight=row['visa_weight'],
                job_weight=row['job_weight'],
                climate_weight=row['climate_weight'],
                safety_weight=row['safety_weight'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            
        except Exception as e:
            raise Exception(f"Error retrieving preferences: {str(e)}")
    
    def save_analysis_result(self, session_id: str, results: List[DecisionResult], 
                           preferences: UserPreferences) -> int:
        """Save analysis results to database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Convert results to JSON
            results_json = json.dumps([{
                'rank': result.rank,
                'country': result.country,
                'score': result.score,
                'percentage': result.percentage,
                'criteria_scores': result.criteria_scores
            } for result in results])
            
            preferences_json = json.dumps(preferences.to_analysis_weights())
            
            cursor.execute('''
                INSERT INTO decision_results (session_id, country_scores, preferences)
                VALUES (?, ?, ?)
            ''', (session_id, results_json, preferences_json))
            
            result_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return result_id
            
        except Exception as e:
            raise Exception(f"Error saving analysis results: {str(e)}")
    
    def get_analysis_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get analysis history for session"""
        try:
            conn = self.get_connection()
            cursor = conn.execute('''
                SELECT * FROM decision_results 
                WHERE session_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (session_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            history = []
            for row in rows:
                history.append({
                    'id': row['id'],
                    'session_id': row['session_id'],
                    'results': json.loads(row['country_scores']),
                    'preferences': json.loads(row['preferences']),
                    'created_at': row['created_at']
                })
            
            return history
            
        except Exception as e:
            raise Exception(f"Error retrieving analysis history: {str(e)}")
