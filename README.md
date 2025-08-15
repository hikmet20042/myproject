# Gender Violence Analysis System

A sophisticated AI-powered system for detecting and analyzing gender violence content from news sources, designed for single-user private deployment.

## Features

- **Dual AI Provider Support**: OpenRouter (primary) + Gemini (fallback) with automatic failover
- **Smart Analysis**: AI-powered gender violence detection and classification
- **JSON Storage**: Simple, portable data management without database complexity  
- **Comprehensive Reporting**: Advanced statistics and trend analysis
- **Export Capabilities**: Clean JSON exports with detailed analysis reports

## Quick Start

### Prerequisites
- Python 3.8+
- OpenRouter API key
- Gemini API key

### Installation
```bash
# Setup virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
set OPENROUTER_API_KEY=your_openrouter_api_key
set GEMINI_API_KEY=your_gemini_api_key
```

### Easy Usage (Always uses virtual environment)
```bash
# Windows Command Prompt
run_analysis.bat --analyze

# Windows PowerShell
.\run_analysis.ps1 --analyze

# Manual activation (if needed)
.venv\Scripts\activate  # Then run: python gender_violence_scraper.py --analyze
```

### Usage
```bash
# Run complete analysis
python gender_violence_scraper.py --analyze

# Check AI system status
python gender_violence_scraper.py --ai-status

# Export data and generate reports
python gender_violence_scraper.py --export-results

# View statistics
python gender_violence_scraper.py --cache-stats
```

## Configuration

Edit `config/settings.yaml` to customize:
- Analysis parameters
- AI provider settings
- Scraping configuration
- Cache and export options

## Testing

```bash
# Run system tests
python test_system.py

# Test AI fallback system
python gender_violence_scraper.py --test-ai-fallback
```

## How the Python Scraper Works

### Architecture Overview

The Gender Violence Analysis System is a sophisticated multi-component Python application designed to automatically detect, analyze, and classify gender-based violence content from news sources.

### Core Components

#### 1. Main Scraper Engine (`gender_violence_scraper.py`)
- **Web Scraping**: Uses Selenium WebDriver to navigate and extract content from news websites
- **Content Extraction**: Intelligently parses article titles, content, publication dates, and metadata
- **Rate Limiting**: Implements configurable delays between requests to respect website policies
- **Error Handling**: Robust retry mechanisms and graceful failure handling

#### 2. AI Analysis Pipeline (`ai_manager.py`)
- **Dual Provider System**: Primary OpenRouter API with Gemini fallback
- **Automatic Failover**: Switches to backup AI provider if primary fails (3 consecutive failures trigger fallback)
- **Smart Classification**: AI models analyze content for gender violence indicators:
  - Femicide detection
  - Domestic violence identification
  - Sexual assault recognition
  - Harassment and discrimination detection
  - LGBTQ+ rights violations
- **Response Parsing**: Structured JSON output with confidence scores and reasoning

#### 3. Data Management (`data_manager.py`)
- **JSON Storage**: Lightweight, portable data storage without database dependencies
- **Caching System**: Prevents re-analysis of previously processed articles
- **Statistics Generation**: Comprehensive analytics including:
  - Article count by category
  - Confidence score distributions
  - Temporal trend analysis
  - AI provider performance metrics

#### 4. Configuration Management (`config_manager.py`)
- **YAML Configuration**: Centralized settings management
- **Environment Variables**: Secure API key handling
- **Dynamic Settings**: Runtime configuration updates

### Scraping Process Flow

```
1. Configuration Loading
   ├── Load settings.yaml
   ├── Validate environment variables
   └── Initialize AI providers

2. Web Scraping Phase
   ├── Initialize Selenium WebDriver
   ├── Navigate to target news website
   ├── Extract article URLs from category pages
   ├── For each article:
   │   ├── Extract title and content
   │   ├── Check cache for existing analysis
   │   └── Queue for AI analysis if new

3. AI Analysis Phase
   ├── Batch process articles through AI pipeline
   ├── Primary provider (OpenRouter/Llama):
   │   ├── Send structured prompt
   │   ├── Receive JSON classification
   │   └── Validate response format
   ├── Fallback on failure to Gemini API
   └── Store results with metadata

4. Data Processing
   ├── Update cache with new analyses
   ├── Generate comprehensive statistics
   ├── Create exportable reports
   └── Log performance metrics

5. Export & Reporting
   ├── JSON exports with full dataset
   ├── Statistical summaries
   ├── Trend analysis reports
   └── AI provider performance logs
```

### AI Classification System

#### Analysis Criteria
- **Content Context**: Analyzes full article text and headlines
- **Violence Indicators**: Identifies explicit and implicit violence references
- **Gender Context**: Determines if violence is gender-motivated
- **Victim Demographics**: Classifies victim gender (female/male/LGBTQ+/unknown)
- **Confidence Scoring**: Provides 0-100 confidence ratings

#### Categories Detected
- **Femicide**: Gender-motivated killings
- **Domestic Violence**: Partner/family violence
- **Sexual Violence**: Assault, rape, harassment
- **Discrimination**: Gender-based discrimination
- **Rights Violations**: Women's and LGBTQ+ rights issues

### Performance Features

#### Efficiency Optimizations
- **Smart Caching**: Avoids re-processing identical content
- **Batch Processing**: Groups API calls for efficiency
- **Async Operations**: Concurrent web requests and API calls
- **Resource Management**: Automatic cleanup and memory management

#### Reliability Features
- **Provider Redundancy**: Dual AI provider setup prevents single points of failure
- **Retry Mechanisms**: Automatic retry on transient failures
- **Graceful Degradation**: System continues operating even with partial component failures
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

#### Monitoring & Analytics
- **Real-time Statistics**: Live provider performance tracking
- **Success Rate Monitoring**: API call success/failure ratios
- **Response Time Tracking**: Performance metrics for optimization
- **Error Pattern Analysis**: Identifies and reports recurring issues

### Data Output Structure

```json
{
  "article_id": "unique_identifier",
  "title": "Article headline",
  "content_preview": "First 500 characters...",
  "url": "https://source-url.com/article",
  "publication_date": "2025-08-09T12:00:00Z",
  "analysis": {
    "is_gender_related": true,
    "confidence_score": 85,
    "category": "domestic_violence",
    "victim_gender": "female",
    "ai_reasoning": "Article describes domestic violence incident...",
    "analyzed_by": "openrouter",
    "analysis_timestamp": "2025-08-09T12:30:00Z"
  },
  "metadata": {
    "word_count": 450,
    "source_website": "bakuplus.az",
    "language": "azerbaijani"
  }
}
```

## File Structure

- `gender_violence_scraper.py` - Main analysis application
- `ai_manager.py` - Dual AI provider management with fallback
- `data_manager.py` - JSON data storage and reporting
- `config_manager.py` - Configuration handling
- `config/settings.yaml` - Main configuration file
- `exports/` - Analysis results and reports

## License

Private single-user deployment system.
