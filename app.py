
import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin
from datetime import datetime, timedelta
import sqlite3
import pandas as pd
import numpy as np
import json
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func, desc, text
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///student_migration_outcomes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class StudentOutcome(db.Model):
    __tablename__ = 'student_outcomes'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    recommendation_date = db.Column(db.Date)
    recommended_country = db.Column(db.String(100))
    recommended_university = db.Column(db.String(200))
    application_submitted_date = db.Column(db.Date)
    application_status = db.Column(db.String(50))
    visa_application_date = db.Column(db.Date)
    visa_status = db.Column(db.String(50))
    enrollment_date = db.Column(db.Date)
    enrollment_status = db.Column(db.String(50))
    satisfaction_score = db.Column(db.Integer)
    follow_up_date = db.Column(db.Date)
    success_indicator = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PerformanceMetric(db.Model):
    __tablename__ = 'performance_metrics'

    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)
    metric_value = db.Column(db.Float)
    metric_date = db.Column(db.Date)
    calculation_method = db.Column(db.String(200))
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SystemUsage(db.Model):
    __tablename__ = 'system_usage'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50))
    session_id = db.Column(db.String(100))
    action_type = db.Column(db.String(50))
    page_accessed = db.Column(db.String(200))
    time_spent = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))

class ConsultationTracking(db.Model):
    __tablename__ = 'consultation_tracking'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50))
    consultant_id = db.Column(db.String(50))
    consultation_date = db.Column(db.Date)
    consultation_type = db.Column(db.String(50))
    duration_minutes = db.Column(db.Integer)
    satisfaction_rating = db.Column(db.Integer)
    follow_up_required = db.Column(db.Boolean)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Analytics and Metrics Calculator
class AnalyticsCalculator:
    def __init__(self):
        self.db = db

    def calculate_success_rate(self, start_date=None, end_date=None):
        """Calculate overall success rate of student outcomes"""
        query = StudentOutcome.query

        if start_date:
            query = query.filter(StudentOutcome.created_at >= start_date)
        if end_date:
            query = query.filter(StudentOutcome.created_at <= end_date)

        total_students = query.count()
        successful_students = query.filter(StudentOutcome.success_indicator == True).count()

        if total_students > 0:
            success_rate = (successful_students / total_students) * 100
        else:
            success_rate = 0

        return {
            'success_rate': round(success_rate, 2),
            'total_students': total_students,
            'successful_students': successful_students
        }

    def get_application_status_distribution(self):
        """Get distribution of application statuses"""
        status_counts = db.session.query(
            StudentOutcome.application_status,
            func.count(StudentOutcome.id).label('count')
        ).group_by(StudentOutcome.application_status).all()

        return {status: count for status, count in status_counts}

    def get_visa_success_rate(self):
        """Calculate visa approval success rate"""
        visa_applications = StudentOutcome.query.filter(
            StudentOutcome.visa_status.isnot(None)
        ).all()

        if not visa_applications:
            return {'visa_success_rate': 0, 'total_applications': 0}

        approved_count = sum(1 for app in visa_applications if app.visa_status == 'approved')
        total_count = len(visa_applications)

        return {
            'visa_success_rate': round((approved_count / total_count) * 100, 2),
            'total_applications': total_count,
            'approved_applications': approved_count
        }

    def get_country_performance(self):
        """Get performance metrics by country"""
        country_stats = db.session.query(
            StudentOutcome.recommended_country,
            func.count(StudentOutcome.id).label('total_recommendations'),
            func.sum(StudentOutcome.success_indicator).label('successful_outcomes'),
            func.avg(StudentOutcome.satisfaction_score).label('avg_satisfaction')
        ).filter(
            StudentOutcome.recommended_country.isnot(None)
        ).group_by(StudentOutcome.recommended_country).all()

        performance_data = []
        for country, total, successful, avg_satisfaction in country_stats:
            success_rate = (successful / total * 100) if total > 0 else 0
            performance_data.append({
                'country': country,
                'total_recommendations': total,
                'success_rate': round(success_rate, 2),
                'avg_satisfaction': round(avg_satisfaction, 2) if avg_satisfaction else 0
            })

        return performance_data

    def get_monthly_trends(self, months=12):
        """Get monthly trends for outcomes"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        monthly_data = db.session.query(
            func.strftime('%Y-%m', StudentOutcome.created_at).label('month'),
            func.count(StudentOutcome.id).label('total_students'),
            func.sum(StudentOutcome.success_indicator).label('successful_students')
        ).filter(
            StudentOutcome.created_at >= start_date
        ).group_by(
            func.strftime('%Y-%m', StudentOutcome.created_at)
        ).order_by('month').all()

        trend_data = []
        for month, total, successful in monthly_data:
            success_rate = (successful / total * 100) if total > 0 else 0
            trend_data.append({
                'month': month,
                'total_students': total,
                'successful_students': successful,
                'success_rate': round(success_rate, 2)
            })

        return trend_data

    def get_consultation_metrics(self):
        """Get consultation-related metrics"""
        total_consultations = ConsultationTracking.query.count()
        avg_duration = db.session.query(
            func.avg(ConsultationTracking.duration_minutes)
        ).scalar() or 0

        avg_satisfaction = db.session.query(
            func.avg(ConsultationTracking.satisfaction_rating)
        ).scalar() or 0

        consultation_types = db.session.query(
            ConsultationTracking.consultation_type,
            func.count(ConsultationTracking.id).label('count')
        ).group_by(ConsultationTracking.consultation_type).all()

        return {
            'total_consultations': total_consultations,
            'avg_duration': round(avg_duration, 2),
            'avg_satisfaction': round(avg_satisfaction, 2),
            'consultation_types': {ctype: count for ctype, count in consultation_types}
        }

# Dashboard Routes
@app.route('/')
def dashboard():
    """Main dashboard page"""
    calculator = AnalyticsCalculator()

    # Get key metrics
    success_metrics = calculator.calculate_success_rate()
    visa_metrics = calculator.get_visa_success_rate()
    country_performance = calculator.get_country_performance()
    monthly_trends = calculator.get_monthly_trends()
    consultation_metrics = calculator.get_consultation_metrics()

    # Create visualizations
    charts = create_dashboard_charts(
        success_metrics, visa_metrics, country_performance, 
        monthly_trends, consultation_metrics
    )

    return render_template('dashboard.html', 
                         success_metrics=success_metrics,
                         visa_metrics=visa_metrics,
                         country_performance=country_performance,
                         consultation_metrics=consultation_metrics,
                         charts=charts)

@app.route('/outcome-tracking')
def outcome_tracking():
    """Outcome tracking page"""
    page = request.args.get('page', 1, type=int)
    per_page = 20

    outcomes = StudentOutcome.query.order_by(
        desc(StudentOutcome.created_at)
    ).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return render_template('outcome_tracking.html', outcomes=outcomes)

@app.route('/performance-metrics')
def performance_metrics():
    """Performance metrics page"""
    calculator = AnalyticsCalculator()

    # Get comprehensive metrics
    success_rate = calculator.calculate_success_rate()
    visa_success = calculator.get_visa_success_rate()
    country_performance = calculator.get_country_performance()
    monthly_trends = calculator.get_monthly_trends()
    consultation_metrics = calculator.get_consultation_metrics()

    # Get system usage statistics
    system_stats = get_system_usage_stats()

    return render_template('performance_metrics.html',
                         success_rate=success_rate,
                         visa_success=visa_success,
                         country_performance=country_performance,
                         monthly_trends=monthly_trends,
                         consultation_metrics=consultation_metrics,
                         system_stats=system_stats)

@app.route('/api/outcomes', methods=['GET'])
def api_outcomes():
    """API endpoint for outcome data"""
    calculator = AnalyticsCalculator()

    # Get date range from query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')

    success_metrics = calculator.calculate_success_rate(start_date, end_date)

    return jsonify(success_metrics)

@app.route('/api/metrics/update', methods=['POST'])
def update_metrics():
    """Update performance metrics"""
    data = request.json

    metric = PerformanceMetric(
        metric_name=data['name'],
        metric_value=data['value'],
        metric_date=datetime.strptime(data['date'], '%Y-%m-%d'),
        calculation_method=data.get('method', 'manual'),
        category=data.get('category', 'general')
    )

    db.session.add(metric)
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Metric updated successfully'})

@app.route('/api/track-usage', methods=['POST'])
def track_usage():
    """Track system usage"""
    data = request.json

    usage = SystemUsage(
        user_id=data.get('user_id'),
        session_id=data.get('session_id'),
        action_type=data.get('action_type'),
        page_accessed=data.get('page_accessed'),
        time_spent=data.get('time_spent'),
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )

    db.session.add(usage)
    db.session.commit()

    return jsonify({'status': 'success'})

def create_dashboard_charts(success_metrics, visa_metrics, country_performance, 
                          monthly_trends, consultation_metrics):
    """Create chart data for dashboard"""
    charts = {}

    # Success Rate Gauge Chart
    success_gauge = go.Figure(go.Indicator(
        mode = "gauge+number",
        value = success_metrics['success_rate'],
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Success Rate (%)"},
        gauge = {
            'axis': {'range': [None, 100]},
            'bar': {'color': "darkgreen"},
            'steps': [
                {'range': [0, 50], 'color': "lightgray"},
                {'range': [50, 80], 'color': "yellow"},
                {'range': [80, 100], 'color': "lightgreen"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 90
            }
        }
    ))

    charts['success_gauge'] = json.dumps(success_gauge, cls=PlotlyJSONEncoder)

    # Country Performance Chart
    if country_performance:
        countries = [cp['country'] for cp in country_performance]
        success_rates = [cp['success_rate'] for cp in country_performance]

        country_chart = go.Figure(data=[
            go.Bar(name='Success Rate', x=countries, y=success_rates)
        ])
        country_chart.update_layout(
            title="Success Rate by Country",
            xaxis_title="Country",
            yaxis_title="Success Rate (%)"
        )

        charts['country_performance'] = json.dumps(country_chart, cls=PlotlyJSONEncoder)

    # Monthly Trends Chart
    if monthly_trends:
        months = [mt['month'] for mt in monthly_trends]
        success_rates = [mt['success_rate'] for mt in monthly_trends]
        total_students = [mt['total_students'] for mt in monthly_trends]

        trend_chart = go.Figure()
        trend_chart.add_trace(go.Scatter(
            x=months, y=success_rates,
            mode='lines+markers',
            name='Success Rate (%)',
            yaxis='y'
        ))
        trend_chart.add_trace(go.Bar(
            x=months, y=total_students,
            name='Total Students',
            yaxis='y2'
        ))

        trend_chart.update_layout(
            title="Monthly Trends",
            xaxis_title="Month",
            yaxis=dict(title="Success Rate (%)", side="left"),
            yaxis2=dict(title="Total Students", side="right", overlaying="y")
        )

        charts['monthly_trends'] = json.dumps(trend_chart, cls=PlotlyJSONEncoder)

    return charts

def get_system_usage_stats():
    """Get system usage statistics"""
    total_sessions = SystemUsage.query.distinct(SystemUsage.session_id).count()
    total_page_views = SystemUsage.query.count()

    avg_time_spent = db.session.query(
        func.avg(SystemUsage.time_spent)
    ).scalar() or 0

    popular_pages = db.session.query(
        SystemUsage.page_accessed,
        func.count(SystemUsage.id).label('views')
    ).group_by(SystemUsage.page_accessed).order_by(desc('views')).limit(5).all()

    return {
        'total_sessions': total_sessions,
        'total_page_views': total_page_views,
        'avg_time_spent': round(avg_time_spent, 2),
        'popular_pages': {page: views for page, views in popular_pages}
    }

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
