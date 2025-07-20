# Student Migration Decision Support System (DSS)

A comprehensive web application that helps students make informed decisions about studying abroad by comparing countries based on personal preferences using advanced decision analysis algorithms.

## 🚀 Features

### Core Decision Support Functions
- **Multi-Criteria Decision Analysis**: Compare countries using 7 key factors
- **Interactive Weight Adjustment**: Real-time slider controls for user preferences
- **Personalized Country Rankings**: SAW algorithm-based recommendations
- **Sensitivity Analysis**: Understand how preference changes affect rankings
- **Country Comparison**: Side-by-side detailed comparisons
- **Historical Analysis**: Track and review previous decisions

### Technical Stack
- **Frontend**: React.js with responsive design
- **Backend**: Flask REST API with SQLite database
- **Algorithm**: Simple Additive Weighting (SAW) with normalization
- **Deployment**: Docker containerization with Nginx

## 🏗️ Architecture

dss/
├── api/ # Flask Backend
│ ├── app.py # Main API application
│ ├── models/ # Data models
│ ├── routes/ # API endpoints
│ ├── services/ # Business logic
│ └── Dockerfile # Backend container
├── frontend/ # React Frontend
│ ├── src/ # React components
│ ├── public/ # Static assets
│ └── Dockerfile # Frontend container
├── index.html # Demo DSS application
├── docker-compose.yml # Production setup
└── nginx.conf # Reverse proxy config


## 📊 Decision Criteria

The system evaluates countries based on:

| Criterion | Type | Weight Range | Description |
|-----------|------|--------------|-------------|
| **Cost of Living** | Cost | 0-5 | Monthly expenses and affordability |
| **University Rankings** | Benefit | 0-5 | Academic reputation and quality |
| **Language Barrier** | Cost | 0-5 | Communication difficulty level |
| **Visa Process** | Cost | 0-5 | Application complexity and requirements |
| **Job Prospects** | Benefit | 0-5 | Post-graduation employment opportunities |
| **Climate** | Benefit | 0-5 | Weather and environmental conditions |
| **Safety & Security** | Benefit | 0-5 | Personal safety and crime rates |

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- 4GB RAM available
- Ports 80, 5000, 3000 available

### Installation & Run

Clone the repository
git clone https://github.com/ashanr/dss.git
cd dss

Create data directories
mkdir -p data logs

Start the complete application
docker-compose up --build -d

Verify services are running
docker-compose ps


### Access Points
- **Complete Application**: http://localhost:80
- **Demo DSS**: http://localhost:80/index.html
- **API Documentation**: http://localhost:5000/api/
- **Health Check**: http://localhost:80/health

## 🎯 Using the DSS Application

### Step 1: Access the Application
Navigate to `http://localhost:80` in your browser.

### Step 2: Set Your Preferences
1. Use the interactive sliders to adjust importance weights (0-5 scale)
2. Higher values = more important to your decision
3. Real-time feedback shows current weight values

### Step 3: Run Analysis
1. Click "Analyze Countries" to start decision analysis
2. View ranked recommendations with scores and percentages
3. Explore detailed country information

### Step 4: Advanced Analysis
1. Perform sensitivity analysis to test decision stability
2. Compare top countries side-by-side
3. Review analysis history and preferences

## 🔗 API Endpoints

### Country Data
- `GET /api/data/countries` - Retrieve all countries
- `POST /api/data/countries` - Add new country
- `PUT /api/data/countries/{id}` - Update country data

### Decision Analysis
- `POST /api/decision/analyze` - Run SAW analysis
- `POST /api/sensitivity/analyze` - Perform sensitivity analysis
- `POST /api/compare` - Compare selected countries

### User Preferences
- `POST /api/preferences` - Save user weights
- `GET /api/preferences/{session_id}` - Retrieve preferences
- `GET /api/history/{session_id}` - Get analysis history

## 🧪 Testing the Integration

### Backend API Test

Test health endpoint
curl http://localhost:5000/health

Test countries endpoint
curl http://localhost:5000/api/data/countries

Test analysis endpoint
curl -X POST http://localhost:5000/api/decision/analyze
-H "Content-Type: application/json"
-d '{
"cost_weight": 2.0,
"ranking_weight": 1.5,
"language_weight": 1.0,
"visa_weight": 1.2,
"job_weight": 2.5,
"climate_weight": 1.0,
"safety_weight": 1.8
}'


### Frontend Integration Test
1. Open browser developer tools
2. Navigate to the DSS application
3. Adjust sliders and click "Analyze"
4. Check Network tab for API calls
5. Verify results display correctly

## 📈 Sample Countries

The system includes 10 pre-loaded countries with realistic data:

| Country | Cost | Ranking | Language | Visa | Jobs | Climate | Safety |
|---------|------|---------|----------|------|------|---------|--------|
| Canada | 6.5 | 8.0 | 2.5 | 5.0 | 8.0 | 5.5 | 9.0 |
| Australia | 7.0 | 8.5 | 2.0 | 6.5 | 7.0 | 8.0 | 8.5 |
| Germany | 5.5 | 8.5 | 6.0 | 4.0 | 7.5 | 6.5 | 8.0 |
| USA | 7.5 | 9.0 | 3.0 | 6.0 | 8.5 | 7.0 | 8.0 |
| UK | 8.0 | 9.5 | 2.0 | 7.0 | 7.5 | 6.0 | 8.5 |

## 🔧 Configuration

### Environment Variables


API Configuration
FLASK_ENV=production
DATABASE_URL=sqlite:///data/dss.db
CORS_ORIGINS=http://localhost:80

Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api


### Docker Services
- **dss-backend**: Flask API server (Port 5000)
- **dss-frontend**: React application (Port 3000)
- **nginx**: Reverse proxy and load balancer (Port 80)

## 🛠️ Troubleshooting

### Common Issues

**Port Conflicts**

Check what's using ports
lsof -i :80
lsof -i :5000

Stop conflicting services
sudo systemctl stop apache2 # If Apache is running


**Container Issues**

Check container status
docker-compose ps

View service logs
docker-compose logs dss-backend
docker-compose logs dss-frontend
docker-compose logs nginx

Restart specific service
docker-compose restart dss-backend


**Frontend Not Loading**

Check nginx configuration
docker-compose exec nginx nginx -t

Rebuild frontend
docker-compose up --build dss-frontend


### Health Checks


Backend health
curl http://localhost:5000/health

Frontend via nginx
curl http://localhost:80/health

Check API response
curl http://localhost:80/api/data/countries



## 🚀 Production Deployment

### Performance Optimization
- Frontend assets are minified and compressed
- API responses are optimized for speed
- Database queries use proper indexing
- Nginx provides caching and load balancing

### Security Features
- CORS properly configured
- Input validation on all endpoints
- SQL injection protection
- XSS protection headers

### Scaling Options


Scale backend instances
docker-compose up --scale dss-backend=3 -d

Monitor resource usage
docker stats


## 📝 Development

### Adding New Countries


curl -X POST http://localhost:5000/api/data/countries
-H "Content-Type: application/json"
-d '{
"name": "Japan",
"cost_of_living": 8.0,
"university_ranking": 7.5,
"language_barrier": 8.5,
"visa_difficulty": 7.0,
"job_prospects": 6.5,
"climate_score": 7.0,
"safety_index": 9.5
}'


### Customizing Weights
The decision algorithm supports custom weight ranges and criteria types. Modify the backend models to add new criteria or adjust calculation methods.

## 📞 Support

### Getting Help
- **Issues**: Create GitHub issues for bugs
- **Documentation**: Check API endpoints at `/api/`
- **Logs**: Use `docker-compose logs` for debugging

### Version Information
- **Version**: 1.0.0
- **Last Updated**: July 2025
- **License**: MIT
- **Python**: 3.9+
- **Node.js**: 18+

---

## 🎉 Quick Demo

1. **Start**: `docker-compose up -d`
2. **Open**: http://localhost:80
3. **Adjust**: Move sliders to set preferences
4. **Analyze**: Click "Analyze Countries"
5. **Explore**: View rankings and detailed results

Your Student Migration Decision Support System is now ready to help students make informed decisions about studying abroad!


Frontend-Backend Integration Code
JavaScript API Integration
Add this to your index.html or create a separate dss-integration.js file: