"""
Routes package initialization.
Contains all API route definitions for the DSS application.
"""

from flask import Blueprint

# Create blueprints for different route groups
api_bp = Blueprint('api', __name__, url_prefix='/api')
data_bp = Blueprint('data', __name__, url_prefix='/api/data')

# Import route modules to register them with blueprints
from . import api, data

__all__ = ['api_bp', 'data_bp']
