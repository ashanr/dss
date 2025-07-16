#!/usr/bin/env python3
"""
Application entry point for Student Migration DSS
Run this file to start the Flask application
"""

import os
from flask import Flask
from config import config

def create_app(config_name=None):
    """Create and configure the Flask application"""
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy(app)
    
    # Register blueprints
    from app import main_bp
    app.register_blueprint(main_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Get configuration
    debug = app.config.get('DEBUG', False)
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    
    print(f"Starting Student Migration DSS on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Configuration: {os.environ.get('FLASK_CONFIG', 'development')}")
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )