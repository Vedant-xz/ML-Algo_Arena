import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer, load_wine, load_iris, fetch_openml
from sklearn.model_selection import cross_validate, train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import time
import warnings

# Suppress some common warnings from sklearn/lgbm during live run
warnings.filterwarnings("ignore")

def run_arena(dataset_name='breast_cancer'):
    if dataset_name == 'breast_cancer':
        data = load_breast_cancer()
        X, y = data.data, data.target
    elif dataset_name == 'wine':
        data = load_wine()
        X, y = data.data, data.target
    elif dataset_name == 'iris':
        data = load_iris()
        X, y = data.data, data.target
    elif dataset_name == 'heart':
        data = fetch_openml(name='heart', version=1, as_frame=False, parser='auto')
        X, y = data.data, data.target
        # Heart disease target is typically categorical strings (e.g., '1', '2' or 'Presence', 'Absence'), need to encode
        y = LabelEncoder().fit_transform(y)
    else:
        raise ValueError(f"Unknown dataset: {dataset_name}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Use with_mean=False to support sparse matrices (like the one returned by fetch_openml for 'heart')
    scaler = StandardScaler(with_mean=False)
    X_train_scaled = scaler.fit_transform(X_train)
    # X_test_scaled = scaler.transform(X_test)

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(),
        "Random Forest": RandomForestClassifier(),
        "SVM": SVC(),
        "KNN": KNeighborsClassifier(),
        "Neural Network": MLPClassifier(max_iter=500),
        "XGBoost": XGBClassifier(eval_metric='logloss'),
        "LightGBM": LGBMClassifier(verbose=-1)
    }

    results = []
    
    scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']

    for name, model in models.items():
        if name in ["SVM", "KNN", "Neural Network"]:
            X_use = X_train_scaled
        else:
            X_use = X_train

        start = time.time()
        scores = cross_validate(model, X_use, y_train, cv=5, scoring=scoring)
        end = time.time()

        results.append({
            "Model": name,
            "Accuracy": scores['test_accuracy'].mean(),
            "Precision": scores['test_precision_macro'].mean(),
            "Recall": scores['test_recall_macro'].mean(),
            "F1": scores['test_f1_macro'].mean(),
            "Std": scores['test_accuracy'].std(),
            "Time": round(end - start, 2)
        })

    df_results = pd.DataFrame(results)
    df_results = df_results.sort_values("Accuracy", ascending=False).reset_index(drop=True)
    df_results.insert(0, "Rank", df_results.index + 1)
    
    return df_results.to_dict(orient='records')
