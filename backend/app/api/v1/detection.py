from fastapi import APIRouter, HTTPException

from detection import score_account, build_graph

router = APIRouter()


@router.get("/account/{account_id}")
def get_detection_score(account_id: str):
    try:
        return score_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/graph")
def get_detection_graph():
    try:
        return build_graph()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
