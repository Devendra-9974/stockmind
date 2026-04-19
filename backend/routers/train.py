"""
routers/train.py
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
import asyncio, json, uuid, traceback
from backend.models.schemas import TrainRequest
from services.predictor import SelfCorrectingPredictor, TrainingProgress

router = APIRouter()
JOBS: dict = {}


def _run_training(job_id: str, req: TrainRequest):
    progress = JOBS[job_id]["progress"]
    try:
        p = SelfCorrectingPredictor(req.ticker, seq_len=req.seq_len)

        if p.model_exists() and not req.retrain:
            progress.emit("status", {"message": f"Loading existing model for {req.ticker}..."})
            p.load()
            p.fetch_and_prepare(req.period)
        else:
            progress.emit("status", {"message": f"Fetching {req.ticker} data ({req.period})..."})
            p.fetch_and_prepare(req.period)
            progress.emit("status", {"message": f"Loaded {len(p.X)} sequences — starting training"})
            p.train(epochs=req.epochs, progress=progress)
            p.save()

        progress.emit("status", {"message": "Evaluating model..."})
        metrics  = p.evaluate()
        progress.emit("status", {"message": "Generating forecast..."})
        forecast = p.predict_next_n(10)

        result = {
            "metrics":    {k: metrics[k] for k in ["mae","rmse","mape","accuracy"]},
            "history":    {
                "dates":     metrics["dates"],
                "actual":    metrics["actual"],
                "predicted": metrics["predicted"],
            },
            "forecast":   forecast,
            "train_loss": p.train_loss,
            "val_loss":   p.val_loss,
        }
        JOBS[job_id]["result"] = result
        progress.emit("done", result)
        progress.finish()

    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
        tb = traceback.format_exc()
        print(f"[train error] {err_msg}\n{tb}")
        progress.emit("error", {"message": err_msg})
        progress.fail(err_msg)


@router.post("/start")
async def start_training(req: TrainRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    JOBS[job_id] = {
        "status":   "running",
        "progress": TrainingProgress(),
        "ticker":   req.ticker,
        "result":   None,
    }
    background_tasks.add_task(_run_training, job_id, req)
    return {"job_id": job_id, "ticker": req.ticker}


@router.get("/stream/{job_id}")
async def stream_progress(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")

    async def event_gen():
        progress = JOBS[job_id]["progress"]
        sent = 0
        while True:
            events = progress.events
            while sent < len(events):
                ev = events[sent]
                yield f"event: {ev['event']}\ndata: {json.dumps(ev['data'])}\n\n"
                sent += 1
            if progress.done:
                yield f"event: end\ndata: {{}}\n\n"
                break
            await asyncio.sleep(0.2)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.get("/status/{job_id}")
def job_status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    job  = JOBS[job_id]
    prog = job["progress"]
    return {
        "job_id": job_id,
        "ticker": job["ticker"],
        "done":   prog.done,
        "error":  prog.error,
        "result": job.get("result"),
    }