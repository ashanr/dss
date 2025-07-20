# Student Migration Decision Support System (DSS) - Flask Backend

A comprehensive web application that helps students make informed decisions about studying abroad by comparing countries based on personal preferences and multiple criteria using advanced decision analysis algorithms.

## 🚀 Features

### Core Functionality
- **Multi-Criteria Decision Analysis**: Compare countries using 7 key factors
- **Personalized Recommendations**: Adjust weights based on individual priorities
- **Advanced Algorithms**: Simple Additive Weighting (SAW) with normalized scoring
- **Sensitivity Analysis**: Understand how preference changes affect rankings

### Backend Capabilities
- **RESTful API**: Clean, documented endpoints for all operations
- **Database Management**: SQLite with automated setup and sample data
- **Session Tracking**: Save user preferences and analysis history
- **Data Validation**: Comprehensive input validation and error handling
- **CORS Support**: Seamless frontend integration

## 🏗️ Architecture


## 📊 Decision Criteria

The system evaluates countries based on:

| Criterion | Type | Description |
|-----------|------|-------------|
| **Cost of Living** | Cost | Lower values preferred |
| **University Rankings** | Benefit | Higher values preferred |
| **Language Barrier** | Cost | Lower values preferred |
| **Visa Difficulty** | Cost | Lower values preferred |
| **Job Prospects** | Benefit | Higher values preferred |
| **Climate Score** | Benefit | Higher values preferred |
| **Safety Index** | Benefit | Higher values preferred |

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup Instructions

1. **Clone the repository**
