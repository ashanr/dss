# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
db = SQLAlchemy()

class User(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role     = db.Column(db.String(20), default='analyst')  # admin | analyst

class StudentOutcome(db.Model):
    __tablename__ = 'student_outcomes'
    id        = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    # … (all previous columns unchanged)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,
                           default=datetime.utcnow,
                           onupdate=datetime.utcnow)

class PerformanceMetric(db.Model):
    __tablename__ = 'performance_metrics'
    id       = db.Column(db.Integer, primary_key=True)
    metric_name  = db.Column(db.String(100), nullable=False)
    metric_value = db.Column(db.Float)
    metric_date  = db.Column(db.Date, default=datetime.utcnow)
    calculation_method = db.Column(db.String(200))
    category = db.Column(db.String(50), default='general')
