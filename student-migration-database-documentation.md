# Student Migration Decision Support Database Documentation

## Overview

This database contains comprehensive data on 1,000 international students and their migration decisions, specifically designed for predictive modeling and decision support system development. The dataset incorporates research-backed factors that influence student migration decisions, making it suitable for academic research and machine learning applications.

## Database Structure

### Main Table: `students`
- **Records**: 1,000 students
- **Attributes**: 60 columns
- **File Size**: 1.5 MB
- **Format**: SQLite database + CSV file

### Reference Tables:
- `countries`: Source country information
- `destination_countries`: Destination country details with costs
- `fields_of_study`: Academic fields categorization
- `career_fields`: Career field growth rates

## Data Categories and Attributes

### 1. Personal Information (10 attributes)
- `student_id`: Primary key
- `first_name`, `last_name`: Student names
- `email`, `phone`: Contact information
- `date_of_birth`: Birth date
- `gender`: Male/Female/Other
- `nationality`: Source country
- `home_country`, `home_city`: Origin location
- `native_language`: Primary language

### 2. Academic Background (7 attributes)
- `current_gpa`: Grade point average (2.5-4.0)
- `previous_education_level`: High School/Bachelor's/Master's/Diploma
- `field_of_study`: Academic discipline
- `institution_type`: Public/Private/International
- `standardized_test_score`: GRE/SAT scores
- `academic_achievements`: Research publications/awards (0-10)
- `research_experience`: Boolean

### 3. Financial Profile (6 attributes)
- `family_income_bracket`: Income categories
- `financial_aid_needed`: Boolean
- `tuition_budget`: Available tuition funding ($15K-$80K)
- `living_expense_budget`: Living costs budget ($8K-$25K)
- `has_scholarship`: Boolean
- `financial_support_source`: Funding source

### 4. Career Aspirations (6 attributes)
- `intended_career_field`: Target industry
- `career_importance_score`: Career priority (1-10)
- `job_market_priority`: Job market concern (1-10)
- `entrepreneurship_interest`: Entrepreneurial inclination (1-10)
- `research_interest`: Research career interest (1-10)
- `industry_preference`: Preferred industry sector

### 5. Migration Preferences (6 attributes)
- `preferred_destinations`: Comma-separated country list
- `language_barrier_concern`: Language difficulty concern (1-10)
- `cultural_adaptation_confidence`: Cultural adjustment confidence (1-10)
- `visa_processing_importance`: Visa ease importance (1-10)
- `post_study_work_priority`: Work visa priority (1-10)
- `permanent_residence_interest`: PR interest (1-10)

### 6. Decision Factors (6 attributes)
- `family_influence_score`: Family opinion weight (1-10)
- `peer_influence_score`: Peer influence level (1-10)
- `consultant_influence_score`: Consultant dependency (1-10)
- `university_ranking_importance`: Ranking priority (1-10)
- `cost_sensitivity_score`: Cost concern level (1-10)
- `safety_importance_score`: Safety priority (1-10)

### 7. Behavioral Characteristics (6 attributes)
- `risk_tolerance_score`: Risk acceptance (1-10)
- `decision_making_style`: Decision approach (8 categories)
- `information_seeking_behavior`: Research behavior (8 categories)
- `technology_comfort_level`: Tech proficiency (1-10)
- `social_network_size`: Network strength (1-10)
- `adaptability_score`: Adaptation ability (1-10)

### 8. Application Outcomes (6 attributes)
- `applications_submitted`: Number of applications (3-12)
- `acceptances_received`: Number of acceptances (0-8)
- `final_destination_country`: Chosen destination
- `final_university_tier`: University ranking tier
- `application_success_rate`: Success percentage
- `decision_satisfaction_score`: Final satisfaction (1-10)

### 9. Engagement Metrics (6 attributes)
- `consultation_sessions`: Number of sessions (1-15)
- `information_search_hours`: Research time (10-200 hours)
- `application_preparation_time`: Prep time (30-365 days)
- `decision_timeline_days`: Decision duration (30-730 days)
- `stress_level_score`: Stress during process (1-10)
- `confidence_level_score`: Confidence level (1-10)

## Key Statistics

### Demographics
- **Age Range**: 18-29 years (Average: 23.5 years)
- **Gender**: 37.4% Female, 32.3% Male, 30.3% Other
- **Top Source Countries**: Pakistan (68), Iran (61), Nepal (58)

### Academic Profile
- **Average GPA**: 3.24 (Range: 2.5-4.0)
- **Education Levels**: High School (27%), Diploma (27%), Master's (23%), Bachelor's (23%)
- **Popular Fields**: Medicine (61), Chemistry (60), Psychology (58)

### Financial Factors
- **Income Distribution**: 18.2% >$100K, 16.8% <$10K
- **Financial Aid**: 49% need financial aid
- **Average Budgets**: $46,254 tuition, $16,441 living

### Application Outcomes
- **Success Rate**: 45.4% average
- **Applications**: 7.4 submitted, 3.2 acceptances average
- **Zero Acceptances**: 15.2% of students

## Predictive Modeling Applications

### Target Variables
1. **Primary**: `application_success_rate`
2. **Secondary**: `acceptances_received`, `decision_satisfaction_score`
3. **Binary**: `final_destination_country` (successful/unsuccessful)

### Key Predictive Features
1. **Academic Performance**: GPA, standardized test scores
2. **Financial Capacity**: Tuition budget, financial aid status
3. **Behavioral Factors**: Risk tolerance, consultation engagement
4. **Decision Factors**: Family influence, cost sensitivity
5. **Engagement Metrics**: Research hours, consultation sessions

### Correlation Analysis
Strongest correlations with application success:
- `acceptances_received`: 0.802
- `decision_satisfaction_score`: 0.204
- `applications_submitted`: 0.182
- `consultation_sessions`: 0.071
- `standardized_test_score`: 0.064

### Machine Learning Applications

#### 1. Success Prediction
- **Input**: Student profile attributes
- **Output**: Probability of application success
- **Models**: Random Forest, Logistic Regression, Neural Networks

#### 2. Destination Recommendation
- **Input**: Student preferences and constraints
- **Output**: Ranked list of suitable destinations
- **Models**: Content-based filtering, Collaborative filtering

#### 3. Timeline Prediction
- **Input**: Student characteristics and behavior
- **Output**: Predicted decision timeline
- **Models**: Regression models, Time series analysis

#### 4. Satisfaction Prediction
- **Input**: Application outcomes and student profile
- **Output**: Predicted satisfaction score
- **Models**: Regression models, Ensemble methods

## Usage Instructions

### Database Access
```python
import sqlite3
import pandas as pd

# Connect to database
conn = sqlite3.connect('student_migration_database.db')

# Load main dataset
df = pd.read_sql_query("SELECT * FROM students", conn)

# Load reference tables
countries = pd.read_sql_query("SELECT * FROM countries", conn)
destinations = pd.read_sql_query("SELECT * FROM destination_countries", conn)
```

### CSV Access
```python
# Load from CSV
df = pd.read_csv('student_migration_data.csv')
```

### Sample Queries

#### 1. High-performing students
```sql
SELECT * FROM students 
WHERE current_gpa >= 3.5 
AND application_success_rate >= 60
```

#### 2. Financial aid impact
```sql
SELECT financial_aid_needed, 
       AVG(application_success_rate) as avg_success,
       COUNT(*) as count
FROM students 
GROUP BY financial_aid_needed
```

#### 3. Destination popularity
```sql
SELECT final_destination_country, 
       COUNT(*) as student_count,
       AVG(decision_satisfaction_score) as avg_satisfaction
FROM students 
WHERE final_destination_country IS NOT NULL
GROUP BY final_destination_country
ORDER BY student_count DESC
```

## Data Quality and Validation

### Completeness
- All mandatory fields populated
- 15.2% students have no acceptances (realistic failure rate)
- Geographic distribution covers 20 source countries

### Consistency
- Logical relationships maintained (acceptances ≤ applications)
- Score ranges properly bounded (1-10 scales)
- Dates and numerical values within realistic ranges

### Realism
- Based on empirical research on student migration factors
- Correlation patterns match academic literature
- Distribution patterns reflect real-world scenarios

## Research Applications

### Academic Research
- Student migration pattern analysis
- Decision-making behavior studies
- Cross-cultural education research
- Policy impact assessment

### Industry Applications
- Educational consulting optimization
- University recruitment strategies
- Study abroad program development
- Student support system design

### Machine Learning Research
- Multi-criteria decision making
- Recommendation systems
- Predictive analytics in education
- Behavioral pattern recognition

## Limitations and Considerations

### Data Limitations
- Synthetic data based on research patterns
- Point-in-time snapshot (no longitudinal tracking)
- Cultural nuances simplified
- Economic factors may not reflect current conditions

### Ethical Considerations
- Privacy protection in real implementations
- Bias prevention in predictive models
- Fair representation across demographics
- Transparency in decision-making algorithms

### Future Enhancements
- Real-time data integration
- Longitudinal tracking capabilities
- Additional behavioral metrics
- Integration with external data sources

## Support and Contact

This database was created for the MSc research project on "Digital Decision Support System for Student Migration Pathways" as part of the academic research on educational technology and student support systems.

For questions or support regarding this database, please refer to the research documentation or contact the development team.

---

*Last Updated: July 2025*
*Version: 1.0*
*Total Records: 1,000 students*
*Database Size: 1.5 MB*