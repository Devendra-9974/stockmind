import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health():
    try:
        import tensorflow as tf
        tf_ver = tf.__version__
    except ImportError:
        tf_ver = "not installed (NumPy fallback active)"
    return {
        "status": "ok",
        "time": datetime.now().isoformat(),
        "tensorflow": tf_ver
    }