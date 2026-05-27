from flask import Flask, render_template, jsonify, request
from ml_arena import run_arena
import threading
import time

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/run')
def api_run_arena():
    dataset = request.args.get('dataset', 'breast_cancer')
    # Run the machine learning models and get the leaderboard
    try:
        results = run_arena(dataset_name=dataset)
        return jsonify({
            'status': 'success',
            'data': results
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
