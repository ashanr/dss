"""
Country model for the DSS system.
Handles all country-related data operations and validations.
"""

import sqlite3
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Country:
    """Country data class with validation"""
    id: Optional[int] = None
    name: str = ""
    cost_of_living: float = 0.0
    university_ranking: float = 0.0
    language_barrier: float = 0.0
    visa_difficulty: float = 0.0
    job_prospects: float = 0.0
    climate_score: float = 0.0
    safety_index: float = 0.0
    created_at: Optional[datetime] = None
    
    def validate(self) -> Tuple[bool, str]:
        """Validate country data"""
        if not self.name or len(self.name.strip()) == 0:
            return False, "Country name is required"
        
        if len(self.name) > 100:
            return False, "Country name must be less than 100 characters"
        
        # Validate score ranges (0-10)
        score_fields = [
            ('cost_of_living', self.cost_of_living),
            ('university_ranking', self.university_ranking),
            ('language_barrier', self.language_barrier),
            ('visa_difficulty', self.visa_difficulty),
            ('job_prospects', self.job_prospects),
            ('climate_score', self.climate_score),
            ('safety_index', self.safety_index)
        ]
        
        for field_name, value in score_fields:
            if not isinstance(value, (int, float)):
                return False, f"{field_name} must be a number"
            if not (0 <= value <= 10):
                return False, f"{field_name} must be between 0 and 10"
        
        return True, "Valid"
    
    def to_dict(self) -> Dict:
        """Convert country to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'cost_of_living': self.cost_of_living,
            'university_ranking': self.university_ranking,
            'language_barrier': self.language_barrier,
            'visa_difficulty': self.visa_difficulty,
            'job_prospects': self.job_prospects,
            'climate_score': self.climate_score,
            'safety_index': self.safety_index,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Country':
        """Create country from dictionary"""
        return cls(
            id=data.get('id'),
            name=data.get('name', ''),
            cost_of_living=float(data.get('cost_of_living', 0)),
            university_ranking=float(data.get('university_ranking', 0)),
            language_barrier=float(data.get('language_barrier', 0)),
            visa_difficulty=float(data.get('visa_difficulty', 0)),
            job_prospects=float(data.get('job_prospects', 0)),
            climate_score=float(data.get('climate_score', 0)),
            safety_index=float(data.get('safety_index', 0))
        )


class CountryManager:
    """Manages country data operations"""
    
    def __init__(self, db_path: str = 'dss.db'):
        self.db_path = db_path
    
    def get_connection(self) -> sqlite3.Connection:
        """Create database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_all_countries(self) -> List[Country]:
        """Retrieve all countries from database"""
        try:
            conn = self.get_connection()
            cursor = conn.execute('SELECT * FROM countries ORDER BY name')
            rows = cursor.fetchall()
            conn.close()
            
            countries = []
            for row in rows:
                country = Country(
                    id=row['id'],
                    name=row['name'],
                    cost_of_living=row['cost_of_living'],
                    university_ranking=row['university_ranking'],
                    language_barrier=row['language_barrier'],
                    visa_difficulty=row['visa_difficulty'],
                    job_prospects=row['job_prospects'],
                    climate_score=row['climate_score'],
                    safety_index=row['safety_index'],
                    created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
                )
                countries.append(country)
            
            return countries
            
        except Exception as e:
            raise Exception(f"Error retrieving countries: {str(e)}")
    
    def get_country_by_id(self, country_id: int) -> Optional[Country]:
        """Get country by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.execute('SELECT * FROM countries WHERE id = ?', (country_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return Country(
                id=row['id'],
                name=row['name'],
                cost_of_living=row['cost_of_living'],
                university_ranking=row['university_ranking'],
                language_barrier=row['language_barrier'],
                visa_difficulty=row['visa_difficulty'],
                job_prospects=row['job_prospects'],
                climate_score=row['climate_score'],
                safety_index=row['safety_index'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            
        except Exception as e:
            raise Exception(f"Error retrieving country: {str(e)}")
    
    def get_country_by_name(self, name: str) -> Optional[Country]:
        """Get country by name"""
        try:
            conn = self.get_connection()
            cursor = conn.execute('SELECT * FROM countries WHERE LOWER(name) = LOWER(?)', (name,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return Country(
                id=row['id'],
                name=row['name'],
                cost_of_living=row['cost_of_living'],
                university_ranking=row['university_ranking'],
                language_barrier=row['language_barrier'],
                visa_difficulty=row['visa_difficulty'],
                job_prospects=row['job_prospects'],
                climate_score=row['climate_score'],
                safety_index=row['safety_index'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            
        except Exception as e:
            raise Exception(f"Error retrieving country by name: {str(e)}")
    
    def add_country(self, country: Country) -> int:
        """Add new country to database"""
        # Validate country data
        is_valid, message = country.validate()
        if not is_valid:
            raise ValueError(f"Invalid country data: {message}")
        
        # Check if country already exists
        existing = self.get_country_by_name(country.name)
        if existing:
            raise ValueError(f"Country '{country.name}' already exists")
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO countries (name, cost_of_living, university_ranking, 
                                     language_barrier, visa_difficulty, job_prospects, 
                                     climate_score, safety_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (country.name, country.cost_of_living, country.university_ranking,
                  country.language_barrier, country.visa_difficulty, country.job_prospects,
                  country.climate_score, country.safety_index))
            
            country_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return country_id
            
        except Exception as e:
            raise Exception(f"Error adding country: {str(e)}")
    
    def update_country(self, country_id: int, updates: Dict) -> bool:
        """Update existing country"""
        existing_country = self.get_country_by_id(country_id)
        if not existing_country:
            raise ValueError(f"Country with ID {country_id} not found")
        
        # Create updated country object for validation
        country_data = existing_country.to_dict()
        country_data.update(updates)
        updated_country = Country.from_dict(country_data)
        
        # Validate updated data
        is_valid, message = updated_country.validate()
        if not is_valid:
            raise ValueError(f"Invalid update data: {message}")
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            updatable_fields = ['name', 'cost_of_living', 'university_ranking', 
                               'language_barrier', 'visa_difficulty', 'job_prospects', 
                               'climate_score', 'safety_index']
            
            for field in updatable_fields:
                if field in updates:
                    update_fields.append(f"{field} = ?")
                    update_values.append(updates[field])
            
            if not update_fields:
                return False
            
            update_values.append(country_id)
            query = f"UPDATE countries SET {', '.join(update_fields)} WHERE id = ?"
            
            cursor.execute(query, update_values)
            rows_affected = cursor.rowcount
            conn.commit()
            conn.close()
            
            return rows_affected > 0
            
        except Exception as e:
            raise Exception(f"Error updating country: {str(e)}")
    
    def delete_country(self, country_id: int) -> bool:
        """Delete country from database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM countries WHERE id = ?', (country_id,))
            rows_affected = cursor.rowcount
            conn.commit()
            conn.close()
            
            return rows_affected > 0
            
        except Exception as e:
            raise Exception(f"Error deleting country: {str(e)}")
    
    def get_countries_data_for_analysis(self) -> Dict[str, List[float]]:
        """Get countries data formatted for decision analysis"""
        countries = self.get_all_countries()
        
        if not countries:
            raise Exception("No countries available for analysis")
        
        data = {
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
            country_names.append(country.name)
            data['cost_of_living'].append(country.cost_of_living)
            data['university_ranking'].append(country.university_ranking)
            data['language_barrier'].append(country.language_barrier)
            data['visa_difficulty'].append(country.visa_difficulty)
            data['job_prospects'].append(country.job_prospects)
            data['climate_score'].append(country.climate_score)
            data['safety_index'].append(country.safety_index)
        
        return data, country_names
    
    def get_statistics(self) -> Dict:
        """Get statistics about countries in database"""
        countries = self.get_all_countries()
        
        if not countries:
            return {
                'total_countries': 0,
                'statistics': {}
            }
        
        # Calculate statistics for each criterion
        criteria = ['cost_of_living', 'university_ranking', 'language_barrier',
                   'visa_difficulty', 'job_prospects', 'climate_score', 'safety_index']
        
        stats = {}
        for criterion in criteria:
            values = [getattr(country, criterion) for country in countries]
            stats[criterion] = {
                'min': min(values),
                'max': max(values),
                'avg': sum(values) / len(values),
                'count': len(values)
            }
        
        return {
            'total_countries': len(countries),
            'statistics': stats,
            'countries_list': [country.name for country in countries]
        }
