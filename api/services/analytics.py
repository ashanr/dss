"""
Advanced analytics service for the DSS system.
Provides sensitivity analysis, statistical computations, and reporting services.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from models.country import CountryManager
from models.decision import DecisionManager, UserPreferences
from .saw_algorithm import SAWService
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Advanced analytics and reporting service"""
    
    def __init__(self):
        self.country_manager = CountryManager()
        self.decision_manager = DecisionManager()
        self.saw_service = SAWService()
    
    def perform_sensitivity_analysis(self, 
                                   data: Dict[str, List[float]], 
                                   base_weights: Dict[str, float], 
                                   country_names: List[str],
                                   variation_range: List[float] = None) -> Dict:
        """
        Comprehensive sensitivity analysis
        
        Args:
            data: Country data for each criterion
            base_weights: Base weight configuration
            country_names: List of country names
            variation_range: Range of variations to test
        
        Returns:
            Dictionary containing detailed sensitivity analysis results
        """
        if variation_range is None:
            variation_range = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]
        
        try:
            # Get baseline analysis
            baseline_results = self.saw_service.analyze(data, base_weights, country_names)
            baseline_ranking = [result.country for result in baseline_results]
            baseline_scores = {result.country: result.score for result in baseline_results}
            
            sensitivity_results = {}
            
            # Analyze each weight criterion
            for weight_name in base_weights.keys():
                if not weight_name.endswith('_weight'):
                    continue
                
                criterion_name = weight_name.replace('_weight', '')
                sensitivity_results[criterion_name] = self._analyze_criterion_sensitivity(
                    data, base_weights, country_names, weight_name, 
                    variation_range, baseline_ranking, baseline_scores
                )
            
            # Calculate overall sensitivity metrics
            overall_sensitivity = self._calculate_overall_sensitivity(sensitivity_results)
            
            # Generate recommendations
            recommendations = self._generate_sensitivity_recommendations(
                sensitivity_results, overall_sensitivity
            )
            
            return {
                'baseline_analysis': {
                    'ranking': baseline_ranking,
                    'scores': baseline_scores,
                    'top_country': baseline_ranking[0] if baseline_ranking else None
                },
                'criterion_sensitivity': sensitivity_results,
                'overall_sensitivity': overall_sensitivity,
                'recommendations': recommendations,
                'methodology': {
                    'variation_range': variation_range,
                    'analysis_method': 'Weight Variation Analysis',
                    'base_weights': base_weights
                },
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Sensitivity analysis failed: {str(e)}")
            raise Exception(f"Sensitivity analysis error: {str(e)}")
    
    def _analyze_criterion_sensitivity(self, 
                                     data: Dict[str, List[float]], 
                                     base_weights: Dict[str, float],
                                     country_names: List[str],
                                     weight_name: str,
                                     variation_range: List[float],
                                     baseline_ranking: List[str],
                                     baseline_scores: Dict[str, float]) -> Dict:
        """Analyze sensitivity for a specific criterion"""
        
        variations = []
        ranking_changes = []
        score_changes = []
        top_country_changes = []
        
        for variation in variation_range:
            try:
                # Create modified weights
                modified_weights = base_weights.copy()
                original_weight = modified_weights[weight_name]
                modified_weights[weight_name] = original_weight * (1 + variation)
                
                # Run analysis with modified weights
                modified_results = self.saw_service.analyze(data, modified_weights, country_names)
                modified_ranking = [result.country for result in modified_results]
                modified_scores = {result.country: result.score for result in modified_results}
                
                # Calculate metrics
                ranking_change_count = self._count_ranking_changes(baseline_ranking, modified_ranking)
                score_changes_dict = self._calculate_score_changes(baseline_scores, modified_scores)
                top_country_changed = baseline_ranking[0] != modified_ranking[0] if baseline_ranking and modified_ranking else False
                
                variation_result = {
                    'variation_percentage': round(variation * 100, 1),
                    'new_weight_value': round(modified_weights[weight_name], 3),
                    'ranking_changes': ranking_change_count,
                    'top_country': modified_ranking[0] if modified_ranking else None,
                    'top_country_changed': top_country_changed,
                    'score_changes': score_changes_dict,
                    'new_ranking': modified_ranking[:5]  # Top 5 for brevity
                }
                
                variations.append(variation_result)
                ranking_changes.append(ranking_change_count)
                score_changes.append(abs(score_changes_dict.get('average_change', 0)))
                top_country_changes.append(top_country_changed)
                
            except Exception as e:
                logger.warning(f"Failed to analyze variation {variation} for {weight_name}: {str(e)}")
        
        # Calculate criterion sensitivity metrics
        return {
            'variations': variations,
            'sensitivity_metrics': {
                'average_ranking_changes': np.mean(ranking_changes) if ranking_changes else 0,
                'max_ranking_changes': max(ranking_changes) if ranking_changes else 0,
                'average_score_change': np.mean(score_changes) if score_changes else 0,
                'max_score_change': max(score_changes) if score_changes else 0,
                'top_country_change_frequency': sum(top_country_changes) / len(top_country_changes) if top_country_changes else 0,
                'stability_score': self._calculate_stability_score(ranking_changes, score_changes)
            }
        }
    
    def _count_ranking_changes(self, baseline: List[str], modified: List[str]) -> int:
        """Count number of position changes in ranking"""
        changes = 0
        for i, country in enumerate(baseline):
            try:
                new_position = modified.index(country)
                if new_position != i:
                    changes += 1
            except ValueError:
                # Country not found in modified ranking (shouldn't happen)
                changes += 1
        return changes
    
    def _calculate_score_changes(self, baseline_scores: Dict[str, float], 
                               modified_scores: Dict[str, float]) -> Dict[str, float]:
        """Calculate score changes between baseline and modified analysis"""
        changes = []
        country_changes = {}
        
        for country, baseline_score in baseline_scores.items():
            if country in modified_scores:
                change = modified_scores[country] - baseline_score
                changes.append(abs(change))
                country_changes[country] = change
        
        return {
            'average_change': np.mean(changes) if changes else 0,
            'max_change': max(changes) if changes else 0,
            'min_change': min(changes) if changes else 0,
            'country_changes': country_changes
        }
    
    def _calculate_stability_score(self, ranking_changes: List[int], 
                                 score_changes: List[float]) -> float:
        """Calculate stability score (0-100, higher = more stable)"""
        if not ranking_changes or not score_changes:
            return 100.0
        
        # Normalize ranking changes (assume max possible changes = number of countries)
        max_possible_changes = 10  # Reasonable assumption
        normalized_ranking_stability = 1 - (np.mean(ranking_changes) / max_possible_changes)
        
        # Normalize score changes (assume reasonable max change = 2.0)
        max_reasonable_score_change = 2.0
        normalized_score_stability = 1 - min(np.mean(score_changes) / max_reasonable_score_change, 1.0)
        
        # Combined stability score (equal weights)
        stability = ((normalized_ranking_stability + normalized_score_stability) / 2) * 100
        return max(0, min(100, stability))
    
    def _calculate_overall_sensitivity(self, sensitivity_results: Dict) -> Dict:
        """Calculate overall sensitivity metrics across all criteria"""
        all_stability_scores = []
        all_ranking_changes = []
        all_score_changes = []
        most_sensitive_criterion = None
        least_sensitive_criterion = None
        min_stability = float('inf')
        max_stability = 0
        
        for criterion, results in sensitivity_results.items():
            metrics = results['sensitivity_metrics']
            stability = metrics['stability_score']
            
            all_stability_scores.append(stability)
            all_ranking_changes.append(metrics['average_ranking_changes'])
            all_score_changes.append(metrics['average_score_change'])
            
            if stability < min_stability:
                min_stability = stability
                most_sensitive_criterion = criterion
            
            if stability > max_stability:
                max_stability = stability
                least_sensitive_criterion = criterion
        
        return {
            'overall_stability_score': np.mean(all_stability_scores) if all_stability_scores else 100,
            'most_sensitive_criterion': most_sensitive_criterion,
            'least_sensitive_criterion': least_sensitive_criterion,
            'average_ranking_changes': np.mean(all_ranking_changes) if all_ranking_changes else 0,
            'average_score_changes': np.mean(all_score_changes) if all_score_changes else 0,
            'sensitivity_distribution': {
                'high_sensitivity': sum(1 for s in all_stability_scores if s < 70),
                'medium_sensitivity': sum(1 for s in all_stability_scores if 70 <= s < 85),
                'low_sensitivity': sum(1 for s in all_stability_scores if s >= 85)
            }
        }
    
    def _generate_sensitivity_recommendations(self, sensitivity_results: Dict, 
                                            overall_sensitivity: Dict) -> List[str]:
        """Generate recommendations based on sensitivity analysis"""
        recommendations = []
        
        # Overall stability recommendation
        stability_score = overall_sensitivity['overall_stability_score']
        if stability_score >= 85:
            recommendations.append("Your decision is highly stable across weight variations. The ranking is reliable.")
        elif stability_score >= 70:
            recommendations.append("Your decision shows moderate stability. Consider the most sensitive criteria.")
        else:
            recommendations.append("Your decision is sensitive to weight changes. Review your preferences carefully.")
        
        # Most sensitive criterion recommendation
        most_sensitive = overall_sensitivity.get('most_sensitive_criterion')
        if most_sensitive:
            recommendations.append(f"The '{most_sensitive}' criterion has the highest impact on rankings. Ensure your weight reflects its true importance to you.")
        
        # Specific criterion recommendations
        for criterion, results in sensitivity_results.items():
            stability = results['sensitivity_metrics']['stability_score']
            if stability < 60:
                recommendations.append(f"Consider reviewing your '{criterion}' weight - small changes significantly affect rankings.")
        
        return recommendations
    
    def compare_countries(self, country_names: List[str], 
                         criteria: Optional[List[str]] = None) -> Dict:
        """
        Compare specific countries across criteria
        
        Args:
            country_names: List of countries to compare
            criteria: Optional list of criteria to include in comparison
        
        Returns:
            Dictionary containing comparison data
        """
        try:
            # Get all countries
            all_countries = self.country_manager.get_all_countries()
            country_dict = {country.name: country for country in all_countries}
            
            # Filter requested countries
            comparison_countries = []
            missing_countries = []
            
            for name in country_names:
                if name in country_dict:
                    comparison_countries.append(country_dict[name])
                else:
                    missing_countries.append(name)
            
            if not comparison_countries:
                raise ValueError("No valid countries found for comparison")
            
            # Define criteria to compare
            if criteria is None:
                criteria = ['cost_of_living', 'university_ranking', 'language_barrier',
                           'visa_difficulty', 'job_prospects', 'climate_score', 'safety_index']
            
            # Build comparison data
            comparison_data = {
                'countries': [],
                'criteria_comparison': {},
                'rankings': {},
                'statistics': {}
            }
            
            # Collect country data
            for country in comparison_countries:
                country_data = country.to_dict()
                comparison_data['countries'].append(country_data)
            
            # Build criteria comparison
            for criterion in criteria:
                values = []
                country_values = {}
                
                for country in comparison_countries:
                    value = getattr(country, criterion, 0)
                    values.append(value)
                    country_values[country.name] = value
                
                comparison_data['criteria_comparison'][criterion] = {
                    'values': country_values,
                    'best_country': max(country_values.keys(), key=lambda k: country_values[k]) if values else None,
                    'worst_country': min(country_values.keys(), key=lambda k: country_values[k]) if values else None,
                    'average': np.mean(values) if values else 0,
                    'range': max(values) - min(values) if values else 0
                }
            
            # Calculate relative rankings for each criterion
            for criterion in criteria:
                criterion_data = comparison_data['criteria_comparison'][criterion]
                sorted_countries = sorted(
                    criterion_data['values'].items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )
                comparison_data['rankings'][criterion] = [country for country, _ in sorted_countries]
            
            # Calculate statistics
            comparison_data['statistics'] = {
                'total_countries_compared': len(comparison_countries),
                'missing_countries': missing_countries,
                'criteria_analyzed': len(criteria),
                'comparison_timestamp': datetime.now().isoformat()
            }
            
            return comparison_data
            
        except Exception as e:
            logger.error(f"Country comparison failed: {str(e)}")
            raise Exception(f"Country comparison error: {str(e)}")
    
    def get_system_statistics(self) -> Dict:
        """Get comprehensive system statistics"""
        try:
            # Database statistics
            db_stats = self.country_manager.get_statistics()
            
            # Analysis statistics (from decision_results table)
            analysis_stats = self._get_analysis_statistics()
            
            # Performance statistics
            performance_stats = self._get_performance_statistics()
            
            return {
                'database': db_stats,
                'analysis_usage': analysis_stats,
                'performance': performance_stats,
                'system_info': {
                    'version': '1.0.0',
                    'algorithms': ['SAW', 'Sensitivity Analysis'],
                    'supported_criteria': list(self.saw_service.criteria_types.keys())
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"System statistics error: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_analysis_statistics(self) -> Dict:
        """Get statistics about system usage and analyses"""
        try:
            conn = self.decision_manager.get_connection()
            
            # Total analyses
            cursor = conn.execute('SELECT COUNT(*) FROM decision_results')
            total_analyses = cursor.fetchone()[0]
            
            # Analyses in last 30 days
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            cursor = conn.execute(
                'SELECT COUNT(*) FROM decision_results WHERE created_at > ?', 
                (thirty_days_ago,)
            )
            recent_analyses = cursor.fetchone()[0]
            
            # Unique sessions
            cursor = conn.execute('SELECT COUNT(DISTINCT session_id) FROM decision_results')
            unique_sessions = cursor.fetchone()[0]
            
            # Most popular top countries (from analysis results)
            cursor = conn.execute('SELECT country_scores FROM decision_results')
            results = cursor.fetchall()
            
            top_countries = {}
            for row in results:
                try:
                    scores = json.loads(row[0])
                    if scores and len(scores) > 0:
                        top_country = scores[0].get('country')
                        if top_country:
                            top_countries[top_country] = top_countries.get(top_country, 0) + 1
                except:
                    continue
            
            conn.close()
            
            return {
                'total_analyses': total_analyses,
                'recent_analyses_30d': recent_analyses,
                'unique_sessions': unique_sessions,
                'most_recommended_countries': dict(sorted(top_countries.items(), key=lambda x: x[1], reverse=True)[:5])
            }
            
        except Exception as e:
            logger.warning(f"Could not retrieve analysis statistics: {str(e)}")
            return {
                'total_analyses': 0,
                'recent_analyses_30d': 0,
                'unique_sessions': 0,
                'most_recommended_countries': {}
            }
    
    def _get_performance_statistics(self) -> Dict:
        """Get basic performance statistics"""
        # This would typically include metrics like:
        # - Average response time
        # - Error rates
        # - Cache hit rates
        # For now, returning basic placeholder data
        
        return {
            'average_analysis_time_ms': 250,  # Placeholder
            'cache_hit_rate': 0.85,  # Placeholder
            'error_rate': 0.02,  # Placeholder
            'uptime_hours': 720,  # Placeholder
            'note': 'Performance metrics are simulated for demonstration'
        }
    
    def generate_report(self, session_id: str, include_sensitivity: bool = True) -> Dict:
        """
        Generate comprehensive analysis report for a session
        
        Args:
            session_id: Session identifier
            include_sensitivity: Whether to include sensitivity analysis
        
        Returns:
            Dictionary containing comprehensive report
        """
        try:
            # Get latest analysis for session
            history = self.decision_manager.get_analysis_history(session_id, 1)
            
            if not history:
                raise ValueError(f"No analysis found for session {session_id}")
            
            latest_analysis = history[0]
            
            report = {
                'session_id': session_id,
                'analysis_results': latest_analysis['results'],
                'preferences_used': latest_analysis['preferences'],
                'analysis_timestamp': latest_analysis['created_at'],
                'methodology': 'Simple Additive Weighting (SAW)',
                'report_generated_at': datetime.now().isoformat()
            }
            
            # Add country details
            top_countries = latest_analysis['results'][:3]  # Top 3
            report['top_recommendations'] = []
            
            for result in top_countries:
                country_name = result['country']
                country_obj = self.country_manager.get_country_by_name(country_name)
                if country_obj:
                    report['top_recommendations'].append({
                        'rank': result['rank'],
                        'country': country_name,
                        'score': result['score'],
                        'percentage': result['percentage'],
                        'country_details': country_obj.to_dict()
                    })
            
            # Add sensitivity analysis if requested
            if include_sensitivity and len(history) > 0:
                try:
                    # Get countries data for sensitivity analysis
                    countries_data, country_names = self.country_manager.get_countries_data_for_analysis()
                    
                    # Convert preferences format
                    preferences = UserPreferences.from_dict({
                        'session_id': session_id,
                        **latest_analysis['preferences']
                    })
                    
                    # Perform sensitivity analysis
                    sensitivity_results = self.perform_sensitivity_analysis(
                        countries_data, 
                        preferences.to_analysis_weights(), 
                        country_names,
                        [-0.2, -0.1, 0, 0.1, 0.2]
                    )
                    
                    report['sensitivity_analysis'] = sensitivity_results
                    
                except Exception as e:
                    logger.warning(f"Could not include sensitivity analysis in report: {str(e)}")
                    report['sensitivity_analysis'] = {'error': str(e)}
            
            return report
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            raise Exception(f"Report generation error: {str(e)}")
