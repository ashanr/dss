"""
Simple Additive Weighting (SAW) algorithm implementation.
Provides decision analysis services using SAW methodology.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from models.decision import DecisionResult, CriteriaType
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class NormalizationConfig:
    """Configuration for data normalization"""
    method: str = 'min_max'  # min_max, z_score, vector
    criteria_types: Dict[str, CriteriaType] = None


class SAWService:
    """Service class for Simple Additive Weighting algorithm"""
    
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
    
    def analyze(self, 
                data: Dict[str, List[float]], 
                weights: Dict[str, float], 
                country_names: List[str],
                config: Optional[NormalizationConfig] = None) -> List[DecisionResult]:
        """
        Perform SAW analysis with comprehensive error handling and validation
        
        Args:
            data: Country data for each criterion
            weights: User-defined weights for each criterion
            country_names: List of country names
            config: Normalization configuration (optional)
        
        Returns:
            List of DecisionResult objects sorted by score (descending)
        
        Raises:
            ValueError: For invalid input data
            Exception: For processing errors
        """
        try:
            # Input validation
            self._validate_inputs(data, weights, country_names)
            
            # Use default config if not provided
            if config is None:
                config = NormalizationConfig(criteria_types=self.criteria_types)
            
            # Data preprocessing
            processed_data = self._preprocess_data(data)
            
            # Normalize data
            normalized_data = self._normalize_data(processed_data, config)
            
            # Calculate weighted scores
            results = self._calculate_weighted_scores(
                normalized_data, weights, country_names
            )
            
            # Post-process results
            final_results = self._post_process_results(results)
            
            logger.info(f"SAW analysis completed for {len(country_names)} countries")
            return final_results
            
        except Exception as e:
            logger.error(f"SAW analysis failed: {str(e)}")
            raise
    
    def _validate_inputs(self, 
                        data: Dict[str, List[float]], 
                        weights: Dict[str, float], 
                        country_names: List[str]) -> None:
        """Validate input data for analysis"""
        
        if not data:
            raise ValueError("Data dictionary cannot be empty")
        
        if not weights:
            raise ValueError("Weights dictionary cannot be empty")
        
        if not country_names:
            raise ValueError("Country names list cannot be empty")
        
        num_countries = len(country_names)
        
        # Check data consistency
        for criterion, values in data.items():
            if not isinstance(values, list):
                raise ValueError(f"Data for {criterion} must be a list")
            
            if len(values) != num_countries:
                raise ValueError(f"Data length mismatch for {criterion}: expected {num_countries}, got {len(values)}")
            
            # Check for non-numeric values
            for i, value in enumerate(values):
                if not isinstance(value, (int, float)) or np.isnan(value):
                    raise ValueError(f"Invalid value for {criterion} at position {i}: {value}")
        
        # Validate weights
        for weight_name, weight_value in weights.items():
            if not isinstance(weight_value, (int, float)) or np.isnan(weight_value):
                raise ValueError(f"Invalid weight value for {weight_name}: {weight_value}")
            
            if weight_value < 0:
                raise ValueError(f"Weight for {weight_name} cannot be negative: {weight_value}")
        
        # Check for duplicate country names
        if len(set(country_names)) != len(country_names):
            raise ValueError("Duplicate country names found")
    
    def _preprocess_data(self, data: Dict[str, List[float]]) -> Dict[str, List[float]]:
        """Preprocess data before normalization"""
        processed_data = {}
        
        for criterion, values in data.items():
            # Handle outliers (optional - using IQR method)
            cleaned_values = self._handle_outliers(values)
            processed_data[criterion] = cleaned_values
        
        return processed_data
    
    def _handle_outliers(self, values: List[float], method: str = 'iqr') -> List[float]:
        """Handle outliers in data (optional preprocessing step)"""
        if method == 'iqr':
            q1 = np.percentile(values, 25)
            q3 = np.percentile(values, 75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            # Cap outliers instead of removing them
            capped_values = []
            for value in values:
                if value < lower_bound:
                    capped_values.append(lower_bound)
                elif value > upper_bound:
                    capped_values.append(upper_bound)
                else:
                    capped_values.append(value)
            
            return capped_values
        
        return values  # No outlier handling
    
    def _normalize_data(self, 
                       data: Dict[str, List[float]], 
                       config: NormalizationConfig) -> Dict[str, List[float]]:
        """Normalize data using specified method"""
        normalized_data = {}
        
        for criterion, values in data.items():
            if criterion not in config.criteria_types:
                logger.warning(f"Criteria type not defined for {criterion}, assuming BENEFIT")
                criteria_type = CriteriaType.BENEFIT
            else:
                criteria_type = config.criteria_types[criterion]
            
            if config.method == 'min_max':
                normalized_data[criterion] = self._min_max_normalize(values, criteria_type)
            elif config.method == 'z_score':
                normalized_data[criterion] = self._z_score_normalize(values, criteria_type)
            elif config.method == 'vector':
                normalized_data[criterion] = self._vector_normalize(values, criteria_type)
            else:
                raise ValueError(f"Unknown normalization method: {config.method}")
        
        return normalized_data
    
    def _min_max_normalize(self, values: List[float], criteria_type: CriteriaType) -> List[float]:
        """Min-Max normalization"""
        min_val = min(values)
        max_val = max(values)
        
        if max_val == min_val:
            return [1.0] * len(values)
        
        if criteria_type == CriteriaType.COST:
            # For cost criteria, lower is better
            return [(max_val - val) / (max_val - min_val) for val in values]
        else:
            # For benefit criteria, higher is better
            return [(val - min_val) / (max_val - min_val) for val in values]
    
    def _z_score_normalize(self, values: List[float], criteria_type: CriteriaType) -> List[float]:
        """Z-score normalization"""
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        if std_val == 0:
            return [1.0] * len(values)
        
        z_scores = [(val - mean_val) / std_val for val in values]
        
        # Convert to positive scale (0-1)
        min_z = min(z_scores)
        max_z = max(z_scores)
        
        if max_z == min_z:
            return [1.0] * len(values)
        
        normalized = [(z - min_z) / (max_z - min_z) for z in z_scores]
        
        if criteria_type == CriteriaType.COST:
            # Invert for cost criteria
            normalized = [1 - val for val in normalized]
        
        return normalized
    
    def _vector_normalize(self, values: List[float], criteria_type: CriteriaType) -> List[float]:
        """Vector normalization"""
        sum_of_squares = sum(val ** 2 for val in values)
        
        if sum_of_squares == 0:
            return [1.0] * len(values)
        
        normalized = [val / np.sqrt(sum_of_squares) for val in values]
        
        if criteria_type == CriteriaType.COST:
            # For cost criteria, we need to invert the preference
            max_norm = max(normalized)
            normalized = [max_norm - val for val in normalized]
        
        return normalized
    
    def _calculate_weighted_scores(self, 
                                  normalized_data: Dict[str, List[float]], 
                                  weights: Dict[str, float], 
                                  country_names: List[str]) -> List[Dict]:
        """Calculate weighted scores for each country"""
        num_countries = len(country_names)
        results = []
        
        for i in range(num_countries):
            total_score = 0.0
            criteria_scores = {}
            
            for criterion, norm_values in normalized_data.items():
                weight_key = criterion + '_weight'
                if weight_key in weights:
                    weight = weights[weight_key]
                    weighted_score = weight * norm_values[i]
                    total_score += weighted_score
                    criteria_scores[criterion] = weighted_score
                else:
                    logger.warning(f"No weight found for criterion {criterion}")
            
            results.append({
                'country': country_names[i],
                'score': total_score,
                'criteria_scores': criteria_scores
            })
        
        return results
    
    def _post_process_results(self, results: List[Dict]) -> List[DecisionResult]:
        """Post-process and format results"""
        # Sort by score (descending)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Calculate percentages relative to top score
        max_score = results[0]['score'] if results else 1.0
        if max_score == 0:
            max_score = 1.0
        
        # Create DecisionResult objects
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
    
    def get_method_info(self) -> Dict:
        """Get information about the SAW method"""
        return {
            'name': 'Simple Additive Weighting (SAW)',
            'description': 'A multi-criteria decision analysis method that calculates a weighted sum of normalized criteria values',
            'advantages': [
                'Simple and intuitive to understand',
                'Computationally efficient',
                'Allows easy sensitivity analysis',
                'Transparent decision process'
            ],
            'limitations': [
                'Assumes linear relationships between criteria',
                'May not handle extreme values well',
                'Sensitive to normalization method choice'
            ],
            'criteria_types': {
                criterion: criterion_type.value for criterion, criterion_type in self.criteria_types.items()
            }
        }
    
    def validate_weights_sum(self, weights: Dict[str, float]) -> Tuple[bool, float]:
        """Validate if weights sum to a reasonable total"""
        total_weight = sum(weights.values())
        
        # Check if weights are balanced (not necessarily sum to 1)
        min_reasonable_sum = 0.1
        max_reasonable_sum = 100.0
        
        is_valid = min_reasonable_sum <= total_weight <= max_reasonable_sum
        
        return is_valid, total_weight
