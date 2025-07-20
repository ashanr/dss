# Key routes you'll need:
/api/countries              # GET: List all countries
/api/decision/analyze       # POST: Run decision analysis
/api/sensitivity/analyze    # POST: Perform sensitivity analysis
/api/user/preferences       # GET/POST: Manage user preferences
/api/data/update           # POST: Update country data


dss-backend/
├── app.py                 # Main Flask application
├── models/
│   ├── __init__.py
│   ├── country.py         # Country data models
│   └── decision.py        # Decision analysis models
├── routes/
│   ├── __init__.py
│   ├── api.py            # API endpoints
│   └── data.py           # Data management routes
├── services/
│   ├── __init__.py
│   ├── saw_algorithm.py   # Enhanced SAW implementation
│   └── analytics.py      # Advanced analytics service
├── data/
│   ├── countries.json    # Country database
│   └── migration_data.db # SQLite database
└── requirements.txt
