# Key routes you'll need:
/api/countries              # GET: List all countries
/api/decision/analyze       # POST: Run decision analysis
/api/sensitivity/analyze    # POST: Perform sensitivity analysis
/api/user/preferences       # GET/POST: Manage user preferences
/api/data/update           # POST: Update country data




dss/
├── api/                          # Flask Backend
│   ├── app.py                    # Main Flask application
│   ├── models/
│   │   ├── __init__.py
│   │   ├── country.py            # Country data models
│   │   └── decision.py           # Decision analysis models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── api.py               # API endpoints
│   │   └── data.py              # Data management routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── saw_algorithm.py     # SAW algorithm service
│   │   └── analytics.py         # Analytics service
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Backend Docker config
│   └── dss.db                  # SQLite database (auto-created)
│
├── frontend/                    # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── DecisionAnalysis/
│   │   │   │   ├── DecisionAnalysis.jsx
│   │   │   │   ├── WeightSliders.jsx
│   │   │   │   └── ResultsDisplay.jsx
│   │   │   ├── CountryComparison/
│   │   │   │   ├── CountryComparison.jsx
│   │   │   │   └── ComparisonChart.jsx
│   │   │   ├── SensitivityAnalysis/
│   │   │   │   ├── SensitivityAnalysis.jsx
│   │   │   │   └── SensitivityModal.jsx
│   │   │   ├── common/
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── ErrorMessage.jsx
│   │   │   │   └── Modal.jsx
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Footer.jsx
│   │   │       └── Navigation.jsx
│   │   ├── services/
│   │   │   └── api.js            # API service (converted from your app.js)
│   │   ├── hooks/
│   │   │   ├── useDecisionAnalysis.js
│   │   │   └── useCountries.js
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env                     # Environment variables
│
├── docker-compose.yml           # Docker configuration for both services
├── .gitignore
└── README.md
