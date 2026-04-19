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