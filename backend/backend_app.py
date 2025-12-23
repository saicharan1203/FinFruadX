from flask import Flask, request, jsonify, send_file

from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pandas as pd
import os
import sys
import math

# Ensure this directory is on the path so sibling modules can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from werkzeug.utils import secure_filename
from ml_models import FraudDetectionModel
from data_processor import DataProcessor
from auth import UserManager
import json
from datetime import datetime, timedelta
import uuid
import numpy as np
import requests  # For Google OAuth token verification

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fraud-detection-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALERT_RULES_FILE = os.path.join('models', 'alert_rules.json')
TRAINING_HISTORY_FILE = os.path.join('models', 'training_history.json')
CASES_FILE = os.path.join('models', 'cases.json')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '711763554995-j7l0sglmojndro8399bh033buqecdu1d.apps.googleusercontent.com')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('models', exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Global model instance
fraud_model = FraudDetectionModel()
processor = DataProcessor()
user_manager = UserManager()

BASE_CASE_FIELDS = [
    'id', 'transaction_id', 'customer_id', 'merchant_id',
    'amount', 'risk_level', 'status', 'notes', 'tags',
    'probability', 'confidence_score', 'merchant_category',
    'created_at', 'updated_at'
]
DEFAULT_RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low', 'Investigating']

def normalize_tags_field(tags):
    if tags is None:
        return []
    if isinstance(tags, str):
        raw = [tag.strip() for tag in tags.split(',')]
    elif isinstance(tags, (list, tuple, set)):
        raw = [str(tag).strip() for tag in tags]
    else:
        raw = [str(tags).strip()]
    cleaned = [tag.lower() for tag in raw if tag]
    # Preserve order while removing duplicates
    return list(dict.fromkeys(cleaned))

def coerce_json_value(value):
    if isinstance(value, (np.generic,)):
        value = value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, np.ndarray):
        return value.tolist()
    return value

def determine_case_schema(existing_cases, additional_fields=None):
    schema = []

    def add_field(field_name):
        if field_name and field_name not in schema:
            schema.append(field_name)

    for field in BASE_CASE_FIELDS:
        add_field(field)

    for case in existing_cases or []:
        for key in case.keys():
            add_field(key)

    if additional_fields:
        for field in additional_fields:
            add_field(field)

    return schema

def safe_float(value, default=0.0, digits=None):
    try:
        val = float(value)
        if digits is not None:
            return round(val, digits)
        return val
    except (TypeError, ValueError):
        return default

def build_prediction_insights(df):
    insights = {
        'top_transactions': [],
        'hot_customers': [],
        'merchant_hotspots': [],
        'risk_pulse': {}
    }

    if df is None or df.empty:
        return insights

    df_copy = df.copy()
    prob_col = 'ensemble_fraud_probability'

    if prob_col not in df_copy.columns:
        df_copy[prob_col] = 0.0
    df_copy[prob_col] = pd.to_numeric(df_copy[prob_col], errors='coerce').fillna(0.0)

    if 'amount' not in df_copy.columns:
        df_copy['amount'] = 0.0
    df_copy['amount'] = pd.to_numeric(df_copy['amount'], errors='coerce').fillna(0.0)

    if 'customer_id' not in df_copy.columns:
        df_copy['customer_id'] = '--'
    df_copy['customer_id'] = df_copy['customer_id'].astype(str)

    if 'merchant_id' not in df_copy.columns:
        df_copy['merchant_id'] = '--'
    df_copy['merchant_id'] = df_copy['merchant_id'].astype(str)

    if 'is_anomaly' not in df_copy.columns:
        df_copy['is_anomaly'] = 0
    df_copy['is_anomaly'] = pd.to_numeric(df_copy['is_anomaly'], errors='coerce').fillna(0)

    top_transactions_df = df_copy.sort_values(prob_col, ascending=False).head(5)
    insights['top_transactions'] = [
        {
            'transaction_id': str(row.get('transaction_id') or f"TXN-{idx + 1:03d}"),
            'customer_id': str(row.get('customer_id', '--')),
            'merchant_id': str(row.get('merchant_id', '--')),
            'amount': safe_float(row.get('amount'), 0.0, 2),
            'probability': safe_float(row.get(prob_col), 0.0, 4),
            'risk_level': row.get('risk_level', 'Low')
        }
        for idx, (_, row) in enumerate(top_transactions_df.iterrows())
    ]

    cust_df = df_copy[[
        'customer_id', prob_col, 'amount'
    ]].copy()
    cust_df['is_high_risk'] = cust_df[prob_col] >= 0.7
    customer_group = cust_df.groupby('customer_id', dropna=False)
    customer_stats = customer_group.agg(
        avg_probability=(prob_col, 'mean'),
        transaction_count=('customer_id', 'count'),
        total_amount=('amount', 'sum'),
        high_risk_count=('is_high_risk', 'sum')
    ).reset_index()
    customer_stats = customer_stats.sort_values(
        ['high_risk_count', 'avg_probability', 'transaction_count'],
        ascending=False
    ).head(5)
    insights['hot_customers'] = [
        {
            'customer_id': str(row.get('customer_id')),
            'avg_probability': safe_float(row.get('avg_probability'), 0.0, 4),
            'transaction_count': int(row.get('transaction_count') or 0),
            'total_amount': safe_float(row.get('total_amount'), 0.0, 2),
            'high_risk_count': int(row.get('high_risk_count') or 0)
        }
        for _, row in customer_stats.iterrows()
        if row.get('customer_id') not in {None, 'nan', 'NaN'}
    ]

    merchant_df = df_copy[[
        'merchant_id', prob_col, 'amount'
    ]].copy()
    merchant_df['is_high_risk'] = merchant_df[prob_col] >= 0.7
    merchant_group = merchant_df.groupby('merchant_id', dropna=False)
    merchant_stats = merchant_group.agg(
        avg_probability=(prob_col, 'mean'),
        transaction_count=('merchant_id', 'count'),
        total_amount=('amount', 'sum'),
        high_risk_count=('is_high_risk', 'sum')
    ).reset_index()
    merchant_stats = merchant_stats.sort_values(
        ['high_risk_count', 'avg_probability', 'transaction_count'],
        ascending=False
    ).head(5)
    insights['merchant_hotspots'] = [
        {
            'merchant_id': str(row.get('merchant_id')),
            'avg_probability': safe_float(row.get('avg_probability'), 0.0, 4),
            'transaction_count': int(row.get('transaction_count') or 0),
            'total_amount': safe_float(row.get('total_amount'), 0.0, 2),
            'high_risk_count': int(row.get('high_risk_count') or 0)
        }
        for _, row in merchant_stats.iterrows()
        if row.get('merchant_id') not in {None, 'nan', 'NaN'}
    ]

    total_records = len(df_copy)
    if total_records > 0:
        high_ratio = float((df_copy[prob_col] >= 0.7).sum()) / total_records
        medium_ratio = float(((df_copy[prob_col] >= 0.5) & (df_copy[prob_col] < 0.7)).sum()) / total_records
        low_ratio = float((df_copy[prob_col] < 0.3).sum()) / total_records
        anomaly_rate = float((df_copy['is_anomaly'] == 1).sum()) / total_records
        insights['risk_pulse'] = {
            'avg_probability': safe_float(df_copy[prob_col].mean(), 0.0, 3),
            'high_risk_ratio': round(high_ratio * 100, 2),
            'medium_risk_ratio': round(medium_ratio * 100, 2),
            'low_risk_ratio': round(low_ratio * 100, 2),
            'anomaly_rate': round(anomaly_rate * 100, 2)
        }

    return insights

def summarize_alerts(custom_alerts, watchlist_hits):
    summary = {
        'total_alerts': len(custom_alerts),
        'watchlist_hits': len(watchlist_hits),
        'by_type': {}
    }

    for alert in custom_alerts:
        alert_type = alert.get('type', 'other')
        summary['by_type'][alert_type] = summary['by_type'].get(alert_type, 0) + 1

    summary['amount_breaches'] = summary['by_type'].get('amount', 0)
    summary['critical_flags'] = summary['by_type'].get('critical_probability', 0)
    summary['high_flags'] = summary['by_type'].get('high_probability', 0)

    return summary

def is_empty_value(value):
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and value.strip() == '':
        return True
    if isinstance(value, (list, tuple, set, dict)) and len(value) == 0:
        return True
    return False


def generate_placeholder_for_field(field):
    field_lower = (field or '').lower()
    if field_lower == 'id':
        return str(uuid.uuid4())
    if 'transaction' in field_lower and 'id' in field_lower:
        return f"TXN-{uuid.uuid4().hex[:8].upper()}"
    if 'customer' in field_lower and 'id' in field_lower:
        return f"CUST-{uuid.uuid4().hex[:6].upper()}"
    if 'merchant' in field_lower and 'id' in field_lower:
        return f"MCH-{uuid.uuid4().hex[:6].upper()}"
    if 'amount' in field_lower or field_lower.endswith('_value') or 'total' in field_lower:
        return round(float(np.random.uniform(20, 5000)), 2)
    if 'probability' in field_lower or 'score' in field_lower:
        return round(float(np.random.uniform(0.2, 0.95)), 4)
    if 'risk' in field_lower:
        return np.random.choice(DEFAULT_RISK_LEVELS)
    if 'status' in field_lower:
        return 'Open'
    if 'tag' in field_lower:
        return ['sample']
    if 'note' in field_lower or 'comment' in field_lower:
        return 'Auto-generated sample case. Please review details.'
    if field_lower.endswith('at') or 'date' in field_lower or 'time' in field_lower:
        return datetime.now().isoformat()
    if 'location' in field_lower:
        return np.random.choice(['New York', 'London', 'Singapore', 'Sydney'])
    if 'currency' in field_lower:
        return 'USD'
    return f"Sample {field.replace('_', ' ').title()}"


def ensure_case_field_value(field, value):
    cleaned = coerce_json_value(value)
    if is_empty_value(cleaned):
        cleaned = generate_placeholder_for_field(field)

    if field == 'tags':
        return normalize_tags_field(cleaned)

    field_lower = field.lower()
    if field_lower in {'amount'} or field_lower.endswith('_amount') or field_lower.endswith('_value'):
        try:
            return round(float(cleaned), 2)
        except (TypeError, ValueError):
            return round(float(np.random.uniform(20, 5000)), 2)

    if 'probability' in field_lower or 'score' in field_lower:
        try:
            return round(float(cleaned), 4)
        except (TypeError, ValueError):
            return round(float(np.random.uniform(0.2, 0.95)), 4)

    return cleaned


def assemble_case_from_schema(row_dict, schema_fields):
    case = {}
    now_iso = datetime.now().isoformat()

    for field in schema_fields:
        if field == 'created_at':
            case[field] = row_dict.get(field) or now_iso
            continue
        if field == 'updated_at':
            case[field] = row_dict.get(field) or now_iso
            continue
        case[field] = ensure_case_field_value(field, row_dict.get(field))

    case.setdefault('id', str(uuid.uuid4()))
    case.setdefault('created_at', now_iso)
    case.setdefault('updated_at', now_iso)
    case['tags'] = normalize_tags_field(case.get('tags'))
    case['status'] = case.get('status') or 'Open'
    case['notes'] = case.get('notes') or 'Auto-generated sample case. Please review details.'
    case['risk_level'] = case.get('risk_level') or 'Investigating'
    return case


def synthesize_case_from_row(row_dict, extra_fields=None):
    existing_cases = load_cases()
    schema = determine_case_schema(existing_cases, extra_fields)
    return assemble_case_from_schema(row_dict, schema)


def load_json_file(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default

def save_json_file(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

def get_alert_rules():
    default_rules = {
        'thresholds': {
            'critical_probability': 0.85,
            'high_probability': 0.65,
            'amount_limit': 2000
        },
        'watchlist': {
            'customers': [],
            'merchants': []
        },
        'notes': ''
    }
    rules = load_json_file(ALERT_RULES_FILE, default_rules)
    # Ensure required keys exist
    rules.setdefault('thresholds', default_rules['thresholds'])
    rules.setdefault('watchlist', default_rules['watchlist'])
    rules.setdefault('notes', '')
    return rules

def append_training_history(entry):
    history = load_json_file(TRAINING_HISTORY_FILE, [])
    history.insert(0, entry)
    history = history[:50]
    save_json_file(TRAINING_HISTORY_FILE, history)

def load_cases():
    return load_json_file(CASES_FILE, [])

def save_cases(cases):
    save_json_file(CASES_FILE, cases)

def is_model_trained():
    return all([
        fraud_model.rf_model is not None,
        fraud_model.xgb_model is not None,
        fraud_model.isolation_forest is not None,
        fraud_model.feature_names is not None
    ])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/sample-data', methods=['GET'])
def get_sample_data():
    """Generate and return sample data"""
    try:
        df = processor.generate_sample_data(1000)
        filepath = os.path.join(UPLOAD_FOLDER, 'sample_data.csv')
        df.to_csv(filepath, index=False)
        
        # Make sample JSON-serializable (convert timestamps/objects to strings)
        df_json = df.head(5).copy()
        for col in df_json.columns:
            if pd.api.types.is_datetime64_any_dtype(df_json[col]):
                df_json[col] = df_json[col].astype(str)
            elif df_json[col].dtype == 'object':
                try:
                    df_json[col] = df_json[col].astype(str)
                except:
                    pass
        
        return jsonify({
            'success': True,
            'message': 'Sample data generated',
            'rows': len(df),
            'columns': list(df.columns),
            'sample': df_json.to_dict(orient='records'),
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/cases/sample', methods=['POST'])
def generate_case_sample():
    """Generate a synthetic case using the trained model"""
    try:
        if not is_model_trained():
            return jsonify({'success': False, 'error': 'Model not trained yet. Train the model before generating sample cases.'}), 400

        payload = request.get_json(silent=True) or {}
        sample_size = int(payload.get('sample_size', 200))
        sample_size = max(10, min(sample_size, 1000))
        random_state = payload.get('random_state')
        preferred_risk = (payload.get('risk_level') or '').strip().lower()

        df = processor.generate_sample_data(sample_size, random_state)
        predictions = fraud_model.predict(df)

        if predictions.empty:
            return jsonify({'success': False, 'error': 'Unable to generate sample predictions.'}), 400

        candidates = predictions.copy()
        if preferred_risk:
            candidates = candidates[candidates['risk_level'].str.lower() == preferred_risk]
            if candidates.empty:
                candidates = predictions.copy()

        candidates = candidates.sort_values('ensemble_fraud_probability', ascending=False)
        top_k = candidates.head(min(25, len(candidates)))
        sample_row = top_k.sample(1).iloc[0] if len(top_k) > 0 else candidates.sample(1).iloc[0]

        probability = float(sample_row.get('ensemble_fraud_probability', 0))
        risk_level = sample_row.get('risk_level', 'Investigating')
        merchant_category = sample_row.get('merchant_category', 'unknown')

        sample_row_dict = sample_row.to_dict()
        base_payload = {
            'transaction_id': str(sample_row.get('transaction_id') or f"TXN-{uuid.uuid4().hex[:8].upper()}"),
            'customer_id': str(sample_row.get('customer_id', 'unknown')),
            'merchant_id': str(sample_row.get('merchant_id', 'unknown')),
            'amount': float(sample_row.get('amount', 0) or 0),
            'risk_level': risk_level,
            'status': sample_row.get('status') or 'Open',
            'notes': sample_row.get('notes') or f"Sample case auto-generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (fraud probability {probability:.1%}).",
            'tags': list({tag for tag in ['sample', risk_level.lower(), merchant_category.lower()] if tag and isinstance(tag, str)}),
            'probability': probability,
            'merchant_category': merchant_category,
            'confidence_score': float(sample_row.get('confidence_score', np.abs(probability - 0.5) * 2)),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        combined_payload = {**sample_row_dict, **base_payload}
        extra_fields = list(combined_payload.keys())
        synthesized_case = synthesize_case_from_row(combined_payload, extra_fields=extra_fields)

        cases = load_cases()
        cases.insert(0, synthesized_case)
        trimmed_cases = cases[:100]
        save_cases(trimmed_cases)

        return jsonify({
            'success': True,
            'case': synthesized_case,
            'total_cases': len(trimmed_cases)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/validate-csv', methods=['POST'])
def validate_csv():
    """Validate uploaded CSV"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '' or file.filename is None:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Only CSV files allowed'}), 400
        
        # Read file content
        content = file.read()
        
        # Check if file is empty
        if len(content) == 0:
            return jsonify({'success': False, 'error': 'File is empty'}), 400
        
        # Decode content
        try:
            decoded_content = content.decode('utf-8')
        except UnicodeDecodeError:
            return jsonify({'success': False, 'error': 'File encoding not supported. Please use UTF-8 encoded CSV files.'}), 400
        
        validation_result = processor.validate_csv(decoded_content)
        
        if validation_result['success']:
            # Save file
            filename = secure_filename(file.filename or 'uploaded_file.csv')
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Write file to disk
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(decoded_content)
            
            validation_result['filepath'] = filepath
        
        return jsonify(validation_result)
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train fraud detection model"""
    try:
        data = request.get_json() if request.is_json else {}
        filepath = data.get('filepath') if isinstance(data, dict) else None
        fraud_column = data.get('fraud_column', 'is_fraud') if isinstance(data, dict) else 'is_fraud'
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Invalid filepath'}), 400
        
        # Load data
        df = pd.read_csv(filepath)
        
        print(f"Training with {len(df)} samples...")
        training_stats = fraud_model.train(df, fraud_column)

        # Save model
        fraud_model.save('models')

        training_entry = {
            'id': datetime.now().strftime('%Y%m%d%H%M%S'),
            'timestamp': datetime.now().isoformat(),
            'samples_trained': training_stats.get('samples_trained'),
            'fraud_ratio': training_stats.get('fraud_ratio'),
            'rf_score': training_stats.get('rf_score'),
            'xgb_score': training_stats.get('xgb_score'),
            'filepath': filepath,
            'feature_importance': training_stats.get('feature_importance', {})
        }
        append_training_history(training_entry)

        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'stats': training_stats
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predict fraud on new transactions"""
    try:
        # Check if we have a file or filepath
        filepath = None
        if 'file' in request.files:
            file = request.files['file']
            
            if not allowed_file(file.filename):
                return jsonify({'success': False, 'error': 'Only CSV files allowed'}), 400
            
            # Save file temporarily and read it
            filename = secure_filename(file.filename or 'prediction_file.csv')
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
        elif request.is_json:
            data = request.get_json()
            filepath = data.get('filepath') if isinstance(data, dict) else None
            
            if not filepath or not os.path.exists(filepath):
                return jsonify({'success': False, 'error': 'Invalid filepath'}), 400
        else:
            return jsonify({'success': False, 'error': 'No file or filepath provided'}), 400
        
        # Load data
        df = pd.read_csv(filepath)
        
        print(f"Predicting on {len(df)} transactions...")
        results_df = fraud_model.predict(df)
        
        # Calculate statistics
        # Add required columns if they don't exist
        required_cols = ['is_fraud_predicted', 'is_anomaly', 'ensemble_fraud_probability', 'risk_level', 'merchant_category']
        for col in required_cols:
            if col not in results_df.columns:
                if col == 'is_fraud_predicted':
                    results_df[col] = 0
                elif col == 'is_anomaly':
                    results_df[col] = 0
                elif col == 'ensemble_fraud_probability':
                    results_df[col] = 0.0
                elif col == 'risk_level':
                    results_df[col] = 'Low'
                elif col == 'merchant_category':
                    results_df[col] = 'unknown'
        
        stats = processor.get_statistics(results_df)
        insights = build_prediction_insights(results_df)

        alert_rules = get_alert_rules()
        custom_alerts = []
        watchlist_hits = []
        thresholds = alert_rules.get('thresholds', {})
        amount_limit = float(thresholds.get('amount_limit', 0) or 0)
        critical_threshold = float(thresholds.get('critical_probability', 0.85))
        high_threshold = float(thresholds.get('high_probability', 0.65))
        watch_customers = set(str(x) for x in alert_rules.get('watchlist', {}).get('customers', []))
        watch_merchants = set(str(x) for x in alert_rules.get('watchlist', {}).get('merchants', []))

        for _, row in results_df.iterrows():
            probability = float(row.get('ensemble_fraud_probability', 0))
            amount_val = float(row.get('amount', 0))
            customer_id = str(row.get('customer_id', '')).strip()
            merchant_id = str(row.get('merchant_id', '')).strip()
            risk_level = row.get('risk_level', 'Low')

            if amount_limit and amount_val >= amount_limit:
                custom_alerts.append({
                    'type': 'amount',
                    'message': f'Transaction amount ${amount_val:,.2f} exceeds watch threshold',
                    'customer_id': customer_id,
                    'merchant_id': merchant_id,
                    'risk_level': risk_level,
                    'probability': probability
                })

            if probability >= critical_threshold:
                custom_alerts.append({
                    'type': 'critical_probability',
                    'message': f'Critical probability ({probability:.2%}) detected',
                    'customer_id': customer_id,
                    'merchant_id': merchant_id,
                    'risk_level': 'Critical',
                    'probability': probability
                })
            elif probability >= high_threshold:
                custom_alerts.append({
                    'type': 'high_probability',
                    'message': f'High probability ({probability:.2%}) detected',
                    'customer_id': customer_id,
                    'merchant_id': merchant_id,
                    'risk_level': 'High',
                    'probability': probability
                })

            watch_hit = False
            if customer_id and customer_id in watch_customers:
                watch_hit = True
            if merchant_id and merchant_id in watch_merchants:
                watch_hit = True
            if watch_hit:
                watchlist_hits.append({
                    'customer_id': customer_id,
                    'merchant_id': merchant_id,
                    'amount': amount_val,
                    'risk_level': risk_level,
                    'probability': probability
                })

        alert_summary = summarize_alerts(custom_alerts, watchlist_hits)

        # Prepare response
        results_for_json = results_df.copy()
        
        # Convert to JSON-serializable format
        for col in results_for_json.columns:
            if results_for_json[col].dtype == 'object':
                try:
                    results_for_json[col] = results_for_json[col].astype(str)
                except:
                    pass
        
        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_filepath = os.path.join(UPLOAD_FOLDER, f'predictions_{timestamp}.csv')
        results_df.to_csv(results_filepath, index=False)
        
        # Pre-aggregate heatmap data (date -> fraud counts) to support full date range
        heatmap_data = []
        if 'timestamp' in results_df.columns:
            try:
                temp_df = results_df.copy()
                temp_df['timestamp'] = pd.to_datetime(temp_df['timestamp'], errors='coerce')
                temp_df['date'] = temp_df['timestamp'].dt.date.astype(str)
                prob_col = 'ensemble_fraud_probability' if 'ensemble_fraud_probability' in temp_df.columns else 'fraud_probability'
                if prob_col in temp_df.columns:
                    temp_df['is_fraud_flag'] = temp_df[prob_col] > 0.5
                else:
                    temp_df['is_fraud_flag'] = False
                grouped = temp_df.groupby('date').agg(
                    count=('date', 'size'),
                    fraud_count=('is_fraud_flag', 'sum'),
                    total_amount=('amount', 'sum') if 'amount' in temp_df.columns else ('date', 'size')
                ).reset_index()
                heatmap_data = grouped.to_dict(orient='records')
            except Exception as e:
                print(f"Heatmap aggregation error: {e}")
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'insights': insights,
            'results': results_for_json.head(500).to_dict(orient='records'),
            'total_results': len(results_df),
            'results_file': results_filepath,
            'alert_rules': alert_rules,
            'custom_alerts': custom_alerts[:100],
            'watchlist_hits': watchlist_hits[:100],
            'alert_summary': alert_summary,
            'heatmap_data': heatmap_data
        })
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/download-results/<filename>', methods=['GET'])
def download_results(filename):
    """Download prediction results"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/save-model', methods=['POST'])
def save_model():
    """Save trained models to a named version"""
    try:
        data = request.get_json() if request.is_json else {}
        name = (data or {}).get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Model name is required'}), 400
        path = os.path.join('models', secure_filename(str(name)))
        fraud_model.save(path)
        return jsonify({'success': True, 'message': f'Models saved to {path}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        if fraud_model.feature_names is None:
            return jsonify({
                'trained': False,
                'message': 'Model not trained yet'
            })
        
        return jsonify({
            'trained': True,
            'features': fraud_model.feature_names,
            'num_features': len(fraud_model.feature_names),
            'model_type': 'Ensemble (Random Forest + XGBoost + Isolation Forest)'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/load-model', methods=['POST'])
def load_model():
    """Load previously saved models from disk"""
    try:
        data = request.get_json() if request.is_json else {}
        name = (data or {}).get('name')
        path = os.path.join('models', name) if name else 'models'
        fraud_model.load(path)
        return jsonify({
            'success': True,
            'message': f"Models loaded from {path}",
            'trained': True,
            'features': fraud_model.feature_names or [],
            'num_features': len(fraud_model.feature_names or [])
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/alert-rules', methods=['GET', 'POST'])
def alert_rules():
    if request.method == 'GET':
        return jsonify(get_alert_rules())

    try:
        data = request.get_json(force=True)
        current_rules = get_alert_rules()
        current_rules.update({
            'thresholds': data.get('thresholds', current_rules['thresholds']),
            'watchlist': data.get('watchlist', current_rules['watchlist']),
            'notes': data.get('notes', current_rules.get('notes', ''))
        })
        save_json_file(ALERT_RULES_FILE, current_rules)
        return jsonify({'success': True, 'rules': current_rules})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/training-history', methods=['GET'])
def training_history():
    history = load_json_file(TRAINING_HISTORY_FILE, [])
    last_trained = history[0]['timestamp'] if history else None
    return jsonify({'history': history, 'last_trained': last_trained})

@app.route('/api/cases', methods=['GET', 'POST'])
def cases_endpoint():
    if request.method == 'GET':
        return jsonify({'cases': load_cases()})

    try:
        data = request.get_json(force=True)
        cases = load_cases()
        case = {
            'id': data.get('id') or str(uuid.uuid4()),
            'transaction_id': data.get('transaction_id'),
            'customer_id': data.get('customer_id'),
            'merchant_id': data.get('merchant_id'),
            'amount': data.get('amount'),
            'risk_level': data.get('risk_level', 'New'),
            'status': data.get('status', 'Investigating'),
            'notes': data.get('notes', ''),
            'tags': data.get('tags', []),
            'created_at': datetime.now().isoformat()
        }
        cases.insert(0, case)
        save_cases(cases[:100])
        return jsonify({'success': True, 'case': case})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/cases/<case_id>', methods=['PUT', 'DELETE'])
def case_details(case_id):
    cases = load_cases()
    if request.method == 'DELETE':
        updated_cases = [c for c in cases if c.get('id') != case_id]
        save_cases(updated_cases)
        return jsonify({'success': True, 'deleted': case_id})

    try:
        data = request.get_json(force=True)
        updated = None
        for case in cases:
            if case.get('id') == case_id:
                case.update({k: v for k, v in data.items() if v is not None})
                case['updated_at'] = datetime.now().isoformat()
                updated = case
                break
        if not updated:
            return jsonify({'success': False, 'error': 'Case not found'}), 404
        save_cases(cases)
        return jsonify({'success': True, 'case': updated})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ============================================
# Authentication Endpoints
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        
        # Validation
        if not username or len(username) < 3:
            return jsonify({'success': False, 'error': 'Username must be at least 3 characters'}), 400
        
        if not email or '@' not in email:
            return jsonify({'success': False, 'error': 'Valid email is required'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
        
        # Create user
        user, error = user_manager.create_user(username, email, password, full_name)
        
        if error:
            return jsonify({'success': False, 'error': error}), 400
        
        # Create access token
        access_token = create_access_token(identity=user['id'])
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': user,
            'access_token': access_token
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'}), 400
        
        # Authenticate user
        user, error = user_manager.authenticate(username, password)
        
        if error:
            return jsonify({'success': False, 'error': error}), 401
        
        # Create access token
        access_token = create_access_token(identity=user['id'])
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user,
            'access_token': access_token
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token and return current user"""
    try:
        current_user_id = get_jwt_identity()
        user = user_manager.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = user_manager.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Authenticate user with Google OAuth"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'success': False, 'error': 'Google credential is required'}), 400
        
        # Verify the Google ID token
        try:
            # Use Google's tokeninfo endpoint to verify the token
            token_info_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
            response = requests.get(token_info_url)
            
            if response.status_code != 200:
                return jsonify({'success': False, 'error': 'Invalid Google token'}), 401
            
            token_info = response.json()
            
            # Verify the token was issued for our app
            if token_info.get('aud') != GOOGLE_CLIENT_ID:
                return jsonify({'success': False, 'error': 'Token was not issued for this application'}), 401
            
            # Extract user info from token
            google_id = token_info.get('sub')
            email = token_info.get('email')
            name = token_info.get('name', '')
            picture = token_info.get('picture', '')
            
            if not email:
                return jsonify({'success': False, 'error': 'Email not provided by Google'}), 400
            
            # Find or create user
            user, error = user_manager.find_or_create_google_user(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture
            )
            
            if error:
                return jsonify({'success': False, 'error': error}), 400
            
            # Create access token
            access_token = create_access_token(identity=user['id'])
            
            return jsonify({
                'success': True,
                'message': 'Google authentication successful',
                'user': user,
                'access_token': access_token
            })
            
        except requests.exceptions.RequestException as e:
            print(f"Google token verification failed: {e}")
            return jsonify({'success': False, 'error': 'Failed to verify Google token'}), 500
    
    except Exception as e:
        print(f"Google auth error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)