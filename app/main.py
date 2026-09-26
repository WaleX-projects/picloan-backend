from fastapi import FastAPI, UploadFile, File, Form
from uuid import uuid4
import os
from datetime import datetime

from app.database import SessionLocal
from app.models import Loan, LoanDocument

from app.services.storage_service import upload_file_to_supabase
from app.services.ai_Service import ai_service


app = FastAPI(
    title="PickLoan API",
    description="AI-powered loan document processing backend",
    version="1.0.0"
)

# --------------------------------
# Health Check Endpoints
# --------------------------------

@app.get("/health")
async def health_check():
    """
    Health check endpoint for container orchestration systems (Docker, Kubernetes).
    Returns 200 OK if the service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/status")
async def status_check():
    """
    Detailed status check including database connectivity.
    """
    try:
        db = SessionLocal()
        # Try a simple query to verify database connection
        db.execute("SELECT 1")
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database": db_status,
        "environment": os.getenv("NODE_ENV", "development"),
        "supabase_configured": bool(os.getenv("SUPABASE_URL")),
        "nova_api_configured": bool(os.getenv("NOVA_API_KEY"))
    }


@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "PickLoan API v1.0.0",
        "description": "AI-powered loan document processing",
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "upload": "/upload (POST)",
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
    }


@app.post("/upload")
async def upload_files(
     sync_id: str = Form(...),
    files: list[UploadFile] = File(...)
):
    db = SessionLocal()

    try:
        # --------------------------------
        # 1. CREATE LOAN
        # --------------------------------

        loan = Loan(
            sync_id = sync_id,
            status="PROCESSING",
            extracted_data={}
        )

        db.add(loan)

        # We need the ID before creating documents
        db.flush()

        uploaded_files = []
        extracted_results = []

        # --------------------------------
        # 2. PROCESS EACH IMAGE
        # --------------------------------

        for file in files:

            file_data = await file.read()

            if not file_data:
                continue

            # --------------------------------
            # 3. CREATE STORAGE PATH
            # --------------------------------

            file_path = (
                f"loans/{loan.id}/"
                f"{uuid4()}-{file.filename}"
            )

            # --------------------------------
            # 4. UPLOAD TO SUPABASE
            # --------------------------------

            upload_result, url = upload_file_to_supabase(
                file_path=file_path,
                file_data=file_data,
                content_type=file.content_type
            )

            # --------------------------------
            # 5. SAVE DOCUMENT TO DATABASE
            # --------------------------------

            document = LoanDocument(
                loan_id=loan.id,
                filename=file.filename,
                storage_path=url,
                content_type=file.content_type or "application/octet-stream",
                file_size=len(file_data)
            )

            db.add(document)

            # --------------------------------
            # 6. AI EXTRACTION
            # --------------------------------

            try:

                ai_response = ai_service(url)

                print(
                    f"AI Response for {file.filename}: "
                    f"{ai_response}"
                )

                extracted_results.append(
                    ai_response
                )

            except Exception as e:

                print(
                    f"AI failed for {file.filename}: {e}"
                )

            uploaded_files.append({
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_data),
                "storage_path": file_path,
                "public_url": url
            })

        # --------------------------------
        # 7. SAVE AI RESULT
        # --------------------------------
        if extracted_results:
            loan.extracted_data = {
            "documents": extracted_results
        }
            #loan.status = "EXTRACTION_COMPLETE_AND_REVIEW_PENDING"
            loan.status = "SUCCESS"
        else:
            loan.extracted_data = {
                "documents": [],
                "error": "No valid AI extraction results."
            }
            #loan.status = "EXTRACTION_FAILED"
            loan.status = "FAILED"

        

        # --------------------------------
        # 8. COMMIT EVERYTHING
        # --------------------------------

        db.commit()

        db.refresh(loan)

        return {
            "loan_id": loan.id,
            "status": loan.status,
            "updated_at":loan.updated_at,
            "extracted_data": loan.extracted_data,
            "count": len(uploaded_files),
            "files": uploaded_files
        }

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()