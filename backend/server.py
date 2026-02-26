import os
import sys
import re
import io
import logging
import asyncio
import tempfile

# Setup logging immediately to catch import errors
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("server_startup")
logger.info("Initializing server...")

try:
    import uuid
    import shutil
    import bcrypt
    import jwt
    import razorpay
    from datetime import datetime, timezone, timedelta
    from pathlib import Path
    from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, status, Request, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from pydantic import BaseModel, Field, ConfigDict, EmailStr
    from typing import List, Optional
    from supabase_client import supabase, supabase_admin
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    # Import RAG engine with error handling
    try:
        from rag_engine import setup_rag_chain, query_chatbot, clear_rag_chain, generate_summary
        logger.info("RAG Engine imported successfully")
    except ImportError as e:
        logger.error(f"Failed to import rag_engine: {e}")
        def setup_rag_chain(*args, **kwargs): pass
        def query_chatbot(*args, **kwargs): return "Chatbot unavailable"
        def clear_rag_chain(*args, **kwargs): pass
        def generate_summary(*args, **kwargs): return "Summary unavailable"

except Exception as e:
    logger.critical(f"CRITICAL ERROR during imports: {e}")
    sys.exit(1)

# =============================================
# APP SETUP
# =============================================

SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

ROOT_DIR = Path(__file__).parent

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Botfolio API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

TECH_KEYWORDS = {
    "react", "python", "javascript", "fastapi", "supabase", "aws", "docker",
    "machine learning", "frontend", "backend", "fullstack", "ui/ux", "rust",
    "next.js", "tailwind", "node.js", "sql", "nosql", "cicd", "git", "java",
    "c++", "c#", "flutter", "react native", "typescript", "leadership", "management",
    "agile", "scrum", "devops", "cloud", "security"
}

security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Server is starting up...")

# Supabase Storage bucket names
STORAGE_FILES_BUCKET = "portfolio-files"
STORAGE_INDEXES_BUCKET = "portfolio-indexes"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://mybotfolio.vercel.app'
    ).split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maintenance mode middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class MaintenanceMiddleware(BaseHTTPMiddleware):
    BYPASS_PATHS = {"/api/health", "/api/admin/", "/api/auth/login", "/docs", "/openapi.json", "/console-admin5353v1"}

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Always allow health, admin, and login endpoints
        if any(path.startswith(p) for p in self.BYPASS_PATHS):
            return await call_next(request)
        try:
            row = supabase.table("settings").select("value").eq("key", "maintenance_mode").single().execute()
            if row.data and row.data.get("value") == "true":
                return JSONResponse(
                    status_code=503,
                    content={"detail": "maintenance", "message": "Botfolio is under maintenance. We'll be back shortly!"}
                )
        except Exception:
            pass  # If settings table doesn't exist yet, skip
        return await call_next(request)

app.add_middleware(MaintenanceMiddleware)

# =============================================
# HEALTH CHECK — keeps Render warm
# =============================================

@app.get("/api/health")
async def health_check():
    """Lightweight ping endpoint — used by keep-alive crons and frontend warm-up."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# =============================================
# MODELS

# =============================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    auth_provider: str = "email"
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_tier: str = "free"
    portfolios_count: int = 0
    is_admin: bool = False
    subscription_expiry: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30)
    )
    daily_queries_count: int = 0
    bonus_credits: int = 0
    last_query_date: Optional[datetime] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    is_admin: Optional[bool] = None
    subscription_tier: Optional[str] = None
    subscription_expiry: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class Portfolio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    custom_url: str
    resume_url: Optional[str] = None    # Supabase Storage public URL
    details_url: Optional[str] = None  # Supabase Storage public URL
    text_content: Optional[str] = None
    is_active: bool = True
    is_processed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    analytics: dict = Field(default_factory=dict)
    chatbot_config: dict = Field(default_factory=dict)
    custom_domain: Optional[str] = None

class ChatMessage(BaseModel):
    portfolio_url: str
    message: str
    visitor_name: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class PortfolioPublic(BaseModel):
    name: str
    custom_url: str
    owner_name: str
    is_active: bool

# =============================================
# HELPERS
# =============================================

CUSTOM_URL_PATTERN = re.compile(r'^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$')

def validate_custom_url(custom_url: str) -> str:
    """Validate and sanitize custom URL slug."""
    url = custom_url.lower().strip()
    url = re.sub(r'[^a-z0-9\-]', '-', url)  # replace invalid chars with dash
    url = re.sub(r'-+', '-', url)            # collapse multiple dashes
    url = url.strip('-')
    if not CUSTOM_URL_PATTERN.match(url):
        raise HTTPException(
            status_code=400,
            detail="Custom URL must be 3-50 characters, lowercase letters, numbers, and hyphens only."
        )
    return url

def upload_file_to_storage(file_bytes: bytes, path: str, content_type: str = "application/octet-stream") -> str:
    """Upload a file to Supabase Storage and return public URL. Uses service_role client."""
    try:
        supabase_admin.storage.from_(STORAGE_FILES_BUCKET).upload(
            path, file_bytes, {"content-type": content_type, "upsert": "true"}
        )
        result = supabase_admin.storage.from_(STORAGE_FILES_BUCKET).get_public_url(path)
        return result
    except Exception as e:
        err_str = str(e)
        logger.error(f"Storage upload error for {path}: {err_str}")
        if "Bucket not found" in err_str or "does not exist" in err_str.lower():
            raise HTTPException(
                status_code=500,
                detail="Storage bucket 'portfolio-files' not found. Create it in Supabase Dashboard → Storage → New Bucket (Public: ON)."
            )
        if "Unauthorized" in err_str or "403" in err_str:
            raise HTTPException(status_code=500, detail="Storage permission denied. Make sure SUPABASE_SERVICE_KEY is set in Render environment variables.")
        raise HTTPException(status_code=500, detail=f"File upload failed: {err_str[:200]}")

# =============================================
# AUTH UTILITIES
# =============================================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(payload: dict = Depends(verify_token)):
    try:
        response = supabase.table("users").select("*").eq("id", payload.get("user_id")).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**response.data)
    except Exception as e:
        logger.error(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def check_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# =============================================
# AUTH ENDPOINTS
# =============================================

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = supabase.table("users").select("email").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = hash_password(user_data.password)
    user = User(email=user_data.email, name=user_data.name, auth_provider="email")

    user_dict = user.model_dump()
    user_dict['password_hash'] = hashed_pwd
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    if user_dict.get('subscription_expiry'):
        user_dict['subscription_expiry'] = user_dict['subscription_expiry'].isoformat()

    supabase.table("users").insert(user_dict).execute()
    token = create_access_token({"user_id": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=user.model_dump(mode='json'))

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    response = supabase.table("users").select("*").eq("email", credentials.email).execute()
    user = response.data[0] if response.data else None

    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": user['id'], "email": user['email']})
    user_obj = User(**user)
    return TokenResponse(access_token=token, user=user_obj.model_dump(mode='json'))

@app.post("/api/auth/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest):
    raise HTTPException(status_code=501, detail="Google OAuth coming soon")

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# =============================================
# PORTFOLIO ENDPOINTS
# =============================================

def _do_rag_setup(portfolio_id: str, resume_url: Optional[str], details_url: Optional[str], text_content: Optional[str]):
    """
    Background helper: download files from Supabase Storage into temp dir,
    then run RAG setup, then mark portfolio as processed.
    """
    try:
        temp_dir = tempfile.mkdtemp()
        resume_path = None
        details_path = None

        if resume_url:
            try:
                file_bytes = supabase.storage.from_(STORAGE_FILES_BUCKET).download(
                    resume_url.split(f"{STORAGE_FILES_BUCKET}/")[-1].split("?")[0]
                )
                ext = resume_url.split(".")[-1].split("?")[0]
                resume_path = os.path.join(temp_dir, f"resume.{ext}")
                with open(resume_path, "wb") as f:
                    f.write(file_bytes)
            except Exception as e:
                logger.error(f"Failed to download resume: {e}")

        if details_url:
            try:
                file_bytes = supabase.storage.from_(STORAGE_FILES_BUCKET).download(
                    details_url.split(f"{STORAGE_FILES_BUCKET}/")[-1].split("?")[0]
                )
                details_path = os.path.join(temp_dir, "details.txt")
                with open(details_path, "wb") as f:
                    f.write(file_bytes)
            except Exception as e:
                logger.error(f"Failed to download details: {e}")

        # Fetch tone from config
        p_resp = supabase.table("portfolios").select("chatbot_config").eq("id", portfolio_id).single().execute()
        tone = p_resp.data.get("chatbot_config", {}).get("tone", "professional") if p_resp.data else "professional"

        setup_rag_chain(portfolio_id, resume_path, details_path, text_content, tone=tone)
        supabase.table("portfolios").update({"is_processed": True}).eq("id", portfolio_id).execute()
        logger.info(f"Portfolio {portfolio_id} RAG setup complete.")

        # Cleanup temp files
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception as e:
        logger.error(f"Background RAG setup failed for {portfolio_id}: {e}")


@app.post("/api/portfolios/create")
async def create_portfolio(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    custom_url: str = Form(...),
    text_content: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    details: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    tone: str = Form("professional"),
    context_aware: bool = Form(True)
):
    # Check portfolio limit
    tier = current_user.subscription_tier or "free"
    portfolio_limits = {"free": 1, "creator": 1, "growth": 3, "enterprise": 9999}
    p_limit = portfolio_limits.get(tier, 1)

    if current_user.portfolios_count >= p_limit:
        raise HTTPException(status_code=403, detail=f"{tier.capitalize()} tier allows {p_limit} portfolio(s). Upgrade to create more.")

    custom_url = validate_custom_url(custom_url)

    # Check URL uniqueness
    existing = supabase.table("portfolios").select("custom_url").eq("custom_url", custom_url).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="This URL is already taken")

    portfolio_id = str(uuid.uuid4())
    resume_url = None
    details_url = None

    # Upload resume to Supabase Storage
    if resume:
        file_bytes = await resume.read()
        storage_path = f"{portfolio_id}/resume_{resume.filename}"
        resume_url = upload_file_to_storage(file_bytes, storage_path, resume.content_type or "application/octet-stream")

    # Upload details to Supabase Storage
    if details:
        file_bytes = await details.read()
        storage_path = f"{portfolio_id}/details_{details.filename}"
        details_url = upload_file_to_storage(file_bytes, storage_path, details.content_type or "text/plain")

    # Create portfolio record
    portfolio = Portfolio(
        id=portfolio_id,
        user_id=current_user.id,
        name=name,
        custom_url=custom_url,
        resume_url=resume_url,
        details_url=details_url,
        text_content=text_content,
        is_processed=False,
        chatbot_config={"tone": tone, "context_aware": context_aware}
    )

    portfolio_dict = portfolio.model_dump()
    portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()

    await asyncio.to_thread(lambda: supabase.table("portfolios").insert(portfolio_dict).execute())

    # Update user portfolio count
    new_count = current_user.portfolios_count + 1
    supabase.table("users").update({"portfolios_count": new_count}).eq("id", current_user.id).execute()

    # Trigger RAG setup in background (non-blocking)
    background_tasks.add_task(_do_rag_setup, portfolio_id, resume_url, details_url, text_content)

    return {"message": "Portfolio created. Chatbot is being trained...", "portfolio_id": portfolio_id, "custom_url": custom_url}


@app.get("/api/portfolios", response_model=List[Portfolio])
async def get_portfolios(current_user: User = Depends(get_current_user)):
    response = supabase.table("portfolios").select("*").eq("user_id", current_user.id).execute()
    portfolios = response.data
    for p in portfolios:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return portfolios


@app.get("/api/portfolios/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str, current_user: User = Depends(get_current_user)):
    response = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", current_user.id).single().execute()
    portfolio = response.data
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if isinstance(portfolio.get('created_at'), str):
        portfolio['created_at'] = datetime.fromisoformat(portfolio['created_at'])
    return Portfolio(**portfolio)


@app.delete("/api/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: str, current_user: User = Depends(get_current_user)):
    response = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", current_user.id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Delete files from Supabase Storage
    try:
        files = supabase_admin.storage.from_(STORAGE_FILES_BUCKET).list(portfolio_id)
        if files:
            paths = [f"{portfolio_id}/{f['name']}" for f in files]
            supabase_admin.storage.from_(STORAGE_FILES_BUCKET).remove(paths)
    except Exception as e:
        logger.warning(f"Could not delete storage files for {portfolio_id}: {e}")

    # Delete vector store files from storage
    try:
        idx_files = supabase_admin.storage.from_(STORAGE_INDEXES_BUCKET).list(portfolio_id)
        if idx_files:
            paths = [f"{portfolio_id}/{f['name']}" for f in idx_files]
            supabase_admin.storage.from_(STORAGE_INDEXES_BUCKET).remove(paths)
    except Exception as e:
        logger.warning(f"Could not delete index files for {portfolio_id}: {e}")

    supabase.table("portfolios").delete().eq("id", portfolio_id).execute()

    new_count = max(0, current_user.portfolios_count - 1)
    supabase.table("users").update({"portfolios_count": new_count}).eq("id", current_user.id).execute()

    return {"message": "Portfolio deleted successfully"}


@app.put("/api/portfolios/{portfolio_id}")
@app.patch("/api/portfolios/{portfolio_id}")
async def update_portfolio(
    portfolio_id: str,
    name: Optional[str] = Form(None),
    custom_url: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    tone: Optional[str] = Form(None),
    context_aware: Optional[bool] = Form(None),
    current_user: User = Depends(get_current_user)
):
    response = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", current_user.id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    update_data = {}
    if name is not None and name.strip():
        update_data['name'] = name.strip()
    if custom_url is not None and custom_url.strip():
        import re as _re
        slug = custom_url.strip().lower().replace(" ", "-")
        if not _re.match(r'^[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]$', slug):
            raise HTTPException(status_code=400, detail="URL must be 3-40 characters: lowercase letters, numbers, hyphens only")
        conflict = supabase.table("portfolios").select("id").eq("custom_url", slug).execute()
        if conflict.data and conflict.data[0]['id'] != portfolio_id:
            raise HTTPException(status_code=409, detail="This URL is already taken, please choose another")
        update_data['custom_url'] = slug
    if is_active is not None:
        update_data['is_active'] = is_active
    
    if tone is not None or context_aware is not None:
        # chatbot_config is a JSONB column
        current_config = response.data.get("chatbot_config", {}) or {}
        if tone is not None: current_config["tone"] = tone
        if context_aware is not None: current_config["context_aware"] = context_aware
        
        update_data["chatbot_config"] = current_config
        # Clear in-memory chain so it reloads with new settings
        clear_rag_chain(portfolio_id)

    if update_data:
        supabase.table("portfolios").update(update_data).eq("id", portfolio_id).execute()

    return {"message": "Portfolio updated successfully", "updated": update_data}




@app.post("/api/portfolios/{portfolio_id}/update-files")
async def update_portfolio_files(
    portfolio_id: str,
    background_tasks: BackgroundTasks,
    resume: Optional[UploadFile] = File(None),
    details: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    response = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", current_user.id).single().execute()
    portfolio = response.data
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    resume_url = portfolio.get('resume_url')
    details_url = portfolio.get('details_url')

    if resume:
        file_bytes = await resume.read()
        storage_path = f"{portfolio_id}/resume_{resume.filename}"
        resume_url = upload_file_to_storage(file_bytes, storage_path, resume.content_type or "application/octet-stream")
        supabase.table("portfolios").update({"resume_url": resume_url}).eq("id", portfolio_id).execute()

    if details:
        file_bytes = await details.read()
        storage_path = f"{portfolio_id}/details_{details.filename}"
        details_url = upload_file_to_storage(file_bytes, storage_path, details.content_type or "text/plain")
        supabase.table("portfolios").update({"details_url": details_url}).eq("id", portfolio_id).execute()

    # Mark unprocessed while retraining
    supabase.table("portfolios").update({"is_processed": False}).eq("id", portfolio_id).execute()

    # Retrain RAG in background
    background_tasks.add_task(
        _do_rag_setup, portfolio_id, resume_url, details_url, portfolio.get('text_content')
    )

    return {"message": "Files uploaded. Chatbot is being retrained..."}


@app.get("/api/portfolios/{portfolio_id}/analytics")
async def get_analytics(portfolio_id: str, current_user: User = Depends(get_current_user)):
    # Verify ownership
    p_resp = supabase.table("portfolios").select("id, analytics").eq("id", portfolio_id).eq("user_id", current_user.id).single().execute()
    if not p_resp.data:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    sessions_resp = supabase.table("chat_sessions").select("*").eq("portfolio_id", portfolio_id).execute()
    sessions = sessions_resp.data or []

    total_chats = len(sessions)
    total_messages = sum(len(s.get('messages', [])) for s in sessions)

    return {
        "total_chats": total_chats,
        "total_messages": total_messages,
        "analytics": p_resp.data.get('analytics', {})
    }


@app.get("/api/sessions/{session_id}/summary")
async def get_session_summary(session_id: str, current_user: User = Depends(get_current_user)):
    """Generate a professional summary of a chat session for a recruiter."""
    # Verify session belongs to one of user's portfolios
    # We use a join check or just query session then check portfolio user_id
    resp = supabase.table("chat_sessions").select("*, portfolios!inner(user_id)").eq("id", session_id).execute()
    
    if not resp.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = resp.data[0]
    # In Supabase JS portfolios!inner(user_id) returns as an object/list. 
    # Let's check ownership
    if session.get('portfolios', {}).get('user_id') != str(current_user.id):
         # Try another way if the join return format is different
         p_id = session.get('portfolio_id')
         p_check = supabase.table("portfolios").select("user_id").eq("id", p_id).eq("user_id", current_user.id).execute()
         if not p_check.data:
             raise HTTPException(status_code=403, detail="Access denied")

    messages = session.get('messages', [])
    if len(messages) < 2:
        return {"summary": "Not enough interaction to summarize. Please have a longer conversation first."}

    summary = generate_summary(messages)
    return {"summary": summary}


@app.get("/api/portfolios/{portfolio_id}/sessions")
async def get_portfolio_sessions(portfolio_id: str, current_user: User = Depends(get_current_user)):
    """Fetch recent chat sessions for a specific portfolio."""
    # Verify ownership
    check = supabase.table("portfolios").select("id").eq("id", portfolio_id).eq("user_id", current_user.id).execute()
    if not check.data:
        raise HTTPException(status_code=403, detail="Access denied")
    
    resp = supabase.table("chat_sessions").select("*").eq("portfolio_id", portfolio_id).order("created_at", desc=True).limit(20).execute()
    return resp.data or []

# =============================================
# PUBLIC ENDPOINTS
# =============================================

@app.get("/api/public/{custom_url}", response_model=PortfolioPublic)
async def get_public_portfolio(custom_url: str):
    response = supabase.table("portfolios").select("*").eq("custom_url", custom_url).single().execute()
    portfolio = response.data
    if not portfolio or not portfolio.get('is_active'):
        raise HTTPException(status_code=404, detail="Portfolio not found")

    user_resp = supabase.table("users").select("name").eq("id", portfolio['user_id']).single().execute()
    owner_name = user_resp.data.get('name', 'Portfolio Owner') if user_resp.data else 'Portfolio Owner'

    return PortfolioPublic(
        name=portfolio['name'],
        custom_url=portfolio['custom_url'],
        owner_name=owner_name,
        is_active=portfolio['is_active']
    )


@app.post("/api/chat/{custom_url}", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_with_portfolio(custom_url: str, chat: ChatMessage, request: Request):
    resp = supabase.table("portfolios").select("*").eq("custom_url", custom_url).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    portfolio = resp.data[0]
    if not portfolio.get('is_active'):
        raise HTTPException(status_code=404, detail="Portfolio not found or inactive")
    if not portfolio.get('is_processed'):
        raise HTTPException(status_code=503, detail="Portfolio chatbot is still being trained. Please try again shortly.")

    user_resp = supabase.table("users").select("*").eq("id", portfolio['user_id']).execute()
    if not user_resp.data:
        raise HTTPException(status_code=404, detail="Portfolio owner not found")
    user = user_resp.data[0]

    now = datetime.now(timezone.utc)

    # Reset monthly count if new month
    if user.get('last_query_date'):
        try:
            last_date_str = user['last_query_date']
            if isinstance(last_date_str, str):
                last_date = datetime.fromisoformat(last_date_str.replace('Z', '+00:00'))
            else:
                last_date = last_date_str
            if last_date.month != now.month or last_date.year != now.year:
                supabase.table("users").update({"daily_queries_count": 0}).eq("id", user['id']).execute()
                user['daily_queries_count'] = 0
        except Exception:
            pass

    # Check monthly limits by tier (keeping DB field name as daily_queries_count for compatibility)
    monthly_limits = {"free": 7, "creator": 40, "growth": 180, "enterprise": 999999}
    monthly_limit = monthly_limits.get(user.get('subscription_tier', 'free'), 7)

    if user.get('daily_queries_count', 0) >= monthly_limit:
        if user.get('bonus_credits', 0) > 0:
            # Use a bonus credit
            supabase.table("users").update({
                "bonus_credits": user['bonus_credits'] - 1,
                "last_query_date": now.isoformat()
            }).eq("id", user['id']).execute()
            # We don't increment daily_queries_count when consuming a bonus credit
        else:
            raise HTTPException(status_code=429, detail=f"Monthly chat limit of {monthly_limit} reached. Please upgrade or purchase an add-on.")

    # Check subscription expiry
    if user.get('subscription_expiry'):
        try:
            exp_str = user['subscription_expiry']
            expiry = datetime.fromisoformat(exp_str.replace('Z', '+00:00')) if isinstance(exp_str, str) else exp_str
            if now > expiry:
                raise HTTPException(status_code=402, detail="Portfolio subscription expired")
        except HTTPException:
            raise
        except Exception:
            pass

    # Increment usage counter
    new_daily_count = user.get('daily_queries_count', 0) + 1
    supabase.table("users").update({
        "daily_queries_count": new_daily_count,
        "last_query_date": now.isoformat()
    }).eq("id", user['id']).execute()

    # Query RAG
    try:
        # Get configuration
        config = portfolio.get('chatbot_config', {}) or {}
        tone = config.get('tone', 'professional')
        context_aware = config.get('context_aware', False)

        answer = query_chatbot(portfolio['id'], chat.message, tone=tone, context_aware=context_aware)

        session_data = {
            "id": str(uuid.uuid4()),
            "portfolio_id": portfolio['id'],
            "visitor_name": chat.visitor_name,
            "messages": [
                {"role": "user", "content": chat.message},
                {"role": "assistant", "content": answer}
            ],
            "created_at": now.isoformat()
        }
        supabase.table("chat_sessions").insert(session_data).execute()

        # Update Portfolio Analytics (Recruiter Insights)
        msg_lower = chat.message.lower()
        detected_skills = [s for s in TECH_KEYWORDS if s in msg_lower]
        if detected_skills:
            try:
                current_analytics = portfolio.get('analytics', {}) or {}
                # Ensure structure
                if 'skills_queried' not in current_analytics:
                    current_analytics['skills_queried'] = {}
                
                skill_counts = current_analytics['skills_queried']
                for s in detected_skills:
                    skill_counts[s] = skill_counts.get(s, 0) + 1
                
                current_analytics['skills_queried'] = skill_counts
                # Also track interaction count
                current_analytics['total_interactions'] = current_analytics.get('total_interactions', 0) + 1
                
                supabase.table("portfolios").update({"analytics": current_analytics}).eq("id", portfolio['id']).execute()
            except Exception as e:
                logger.error(f"Failed to update portfolio analytics: {e}")

        return ChatResponse(response=answer)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        err = str(e).lower()
        if "429" in err or "quota" in err or "exhausted" in err:
            raise HTTPException(status_code=429, detail="The AI engine is busy. Please try again in a few minutes.")
        if "permission" in err:
            raise HTTPException(status_code=403, detail="AI engine access denied. Please contact support.")
        raise HTTPException(status_code=500, detail="The AI server is experiencing heavy load. Please try again later.")

# =============================================
# PAYMENT ENDPOINTS (RAZORPAY)
# =============================================

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    logger.warning(f"Razorpay client init failed: {e}")
    razorpay_client = None

class OrderRequest(BaseModel):
    plan_id: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

PLAN_PRICES = {
    "creator": 9900,   # ₹99
    "growth": 24900,   # ₹249
    "credits_30": 3900 # ₹39 for 30 credits
}

@app.post("/api/payment/create-order")
async def create_order(request: OrderRequest, current_user: User = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    amount = PLAN_PRICES.get(request.plan_id)
    if not amount:
        raise HTTPException(status_code=400, detail="Invalid plan")
    try:
        data = {"amount": amount, "currency": "INR", "receipt": f"receipt_{current_user.id[:8]}"}
        order = razorpay_client.order.create(data=data)
        return order
    except Exception as e:
        logger.error(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Could not create order")

@app.post("/api/payment/verify")
async def verify_payment(data: PaymentVerification, current_user: User = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    try:
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        if data.plan_id.startswith("credits_"):
            # Handle credit purchase
            amount_credits = int(data.plan_id.split("_")[1])
            # Fetch current bonus_credits (or use current_user if updated)
            # Fetching fresh to be safe
            user_resp = supabase.table("users").select("bonus_credits").eq("id", current_user.id).single().execute()
            current_bonus = user_resp.data.get("bonus_credits", 0) if user_resp.data else 0
            
            new_bonus = current_bonus + amount_credits
            supabase.table("users").update({
                "bonus_credits": new_bonus
            }).eq("id", current_user.id).execute()
            return {"status": "success", "type": "credits", "bonus_credits": new_bonus}
        else:
            # Handle tier upgrade
            expiry = datetime.now(timezone.utc) + timedelta(days=30)
            supabase.table("users").update({
                "subscription_tier": data.plan_id,
                "subscription_expiry": expiry.isoformat(),
                "daily_queries_count": 0
            }).eq("id", current_user.id).execute()
            return {"status": "success", "type": "subscription", "tier": data.plan_id}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
        logger.error(f"Payment Confirm Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# =============================================
# ADMIN ENDPOINTS
# =============================================

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: User = Depends(check_admin)):
    """Comprehensive dashboard stats."""
    total_users_resp = supabase.table("users").select("*", count="exact").execute()
    total_portfolios_resp = supabase.table("portfolios").select("*", count="exact").execute()
    users_data = total_users_resp.data or []

    pro_users = sum(1 for u in users_data if u.get("subscription_tier") not in ("free", None))
    total_messages_resp = supabase.table("messages").select("*", count="exact").execute()

    # Revenue: sum from users with paid subscriptions
    # (In real implementation, you'd track payments in a payments table)
    revenue = 0
    creator_count = sum(1 for u in users_data if u.get("subscription_tier") == "creator")
    growth_count = sum(1 for u in users_data if u.get("subscription_tier") == "growth")
    revenue = (creator_count * 99) + (growth_count * 249)

    # Maintenance status
    maint_status = False
    try:
        maint_row = supabase.table("settings").select("value").eq("key", "maintenance_mode").single().execute()
        maint_status = maint_row.data and maint_row.data.get("value") == "true"
    except Exception:
        pass

    # Recent signups (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_users_resp = supabase.table("users").select("*", count="exact").gte("created_at", week_ago).execute()

    return {
        "total_users": total_users_resp.count or 0,
        "total_portfolios": total_portfolios_resp.count or 0,
        "pro_users": pro_users,
        "revenue": revenue,
        "total_messages": total_messages_resp.count or 0,
        "maintenance_mode": maint_status,
        "new_users_this_week": recent_users_resp.count or 0,
        "plan_breakdown": {
            "free": (total_users_resp.count or 0) - pro_users,
            "creator": creator_count,
            "growth": growth_count,
        }
    }


@app.get("/api/admin/users")
async def get_all_users(
    limit: int = 100,
    offset: int = 0,
    search: str = "",
    plan: str = "",
    current_user: User = Depends(check_admin)
):
    """List users with optional search and plan filter."""
    query = supabase.table("users").select("*", count="exact")
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%")
    if plan and plan != "all":
        query = query.eq("subscription_tier", plan)
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    response = query.execute()
    # Strip password hashes from response
    users = []
    for u in (response.data or []):
        u.pop("password_hash", None)
        users.append(u)
    return {"users": users, "total": response.count or 0}


@app.put("/api/admin/users/{user_id}")
async def update_user_admin(user_id: str, updates: UserUpdate, current_user: User = Depends(check_admin)):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No updates provided"}
    await asyncio.to_thread(lambda: supabase.table("users").update(update_data).eq("id", user_id).execute())
    return {"message": "User updated successfully"}


@app.post("/api/admin/users/{user_id}/block")
async def toggle_block_user(user_id: str, current_user: User = Depends(check_admin)):
    """Block or unblock a user by toggling is_blocked field."""
    user_resp = supabase.table("users").select("is_blocked").eq("id", user_id).single().execute()
    if not user_resp.data:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = not user_resp.data.get("is_blocked", False)
    supabase.table("users").update({"is_blocked": new_status}).eq("id", user_id).execute()
    return {"message": f"User {'blocked' if new_status else 'unblocked'}", "is_blocked": new_status}


# ── Maintenance Mode ───────────────────────────────────────────────────

@app.get("/api/admin/maintenance")
async def get_maintenance_status(current_user: User = Depends(check_admin)):
    try:
        row = supabase.table("settings").select("value").eq("key", "maintenance_mode").single().execute()
        return {"maintenance_mode": row.data and row.data.get("value") == "true"}
    except Exception:
        return {"maintenance_mode": False}


@app.post("/api/admin/maintenance")
async def toggle_maintenance(current_user: User = Depends(check_admin)):
    """Toggle maintenance mode on/off."""
    try:
        row = supabase.table("settings").select("value").eq("key", "maintenance_mode").single().execute()
        current = row.data.get("value", "false") if row.data else "false"
        new_val = "false" if current == "true" else "true"
        supabase.table("settings").update({"value": new_val, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("key", "maintenance_mode").execute()
    except Exception:
        # Row doesn't exist yet — create it
        supabase.table("settings").insert({"key": "maintenance_mode", "value": "true", "updated_at": datetime.now(timezone.utc).isoformat()}).execute()
        new_val = "true"
    return {"maintenance_mode": new_val == "true", "message": f"Maintenance mode {'enabled' if new_val == 'true' else 'disabled'}"}


# ── Coupons ────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    discount_percent: int = Field(ge=1, le=100)
    max_uses: int = 100
    expires_at: Optional[str] = None  # ISO datetime string


@app.get("/api/admin/coupons")
async def list_coupons(current_user: User = Depends(check_admin)):
    resp = supabase.table("coupons").select("*").order("created_at", desc=True).execute()
    return resp.data or []


@app.post("/api/admin/coupons")
async def create_coupon(coupon: CouponCreate, current_user: User = Depends(check_admin)):
    code = coupon.code.strip().upper()
    existing = supabase.table("coupons").select("id").eq("code", code).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Coupon code already exists")
    data = {
        "id": str(uuid.uuid4()),
        "code": code,
        "discount_percent": coupon.discount_percent,
        "max_uses": coupon.max_uses,
        "current_uses": 0,
        "expires_at": coupon.expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("coupons").insert(data).execute()
    return {"message": "Coupon created", "coupon": data}


@app.delete("/api/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: User = Depends(check_admin)):
    supabase.table("coupons").delete().eq("id", coupon_id).execute()
    return {"message": "Coupon deleted"}


# Public coupon validation (for checkout)
@app.get("/api/coupons/validate/{code}")
async def validate_coupon(code: str):
    resp = supabase.table("coupons").select("*").eq("code", code.strip().upper()).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    coupon = resp.data
    if coupon.get("expires_at"):
        if datetime.fromisoformat(coupon["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Coupon has expired")
    if coupon.get("current_uses", 0) >= coupon.get("max_uses", 100):
        raise HTTPException(status_code=410, detail="Coupon usage limit reached")
    return {"valid": True, "discount_percent": coupon["discount_percent"], "code": coupon["code"]}


# ── Notifications ──────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    title: str
    message: str


@app.get("/api/admin/notifications")
async def list_notifications(current_user: User = Depends(check_admin)):
    resp = supabase.table("notifications").select("*").order("created_at", desc=True).limit(50).execute()
    return resp.data or []


@app.post("/api/admin/notifications")
async def send_notification(notification: NotificationCreate, current_user: User = Depends(check_admin)):
    data = {
        "id": str(uuid.uuid4()),
        "title": notification.title.strip(),
        "message": notification.message.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("notifications").insert(data).execute()
    return {"message": "Notification sent to all users", "notification": data}


# Users can fetch latest notifications
@app.get("/api/notifications")
async def get_user_notifications(current_user: User = Depends(get_current_user)):
    resp = supabase.table("notifications").select("*").order("created_at", desc=True).limit(10).execute()
    return resp.data or []


# ── Revenue / Analytics ────────────────────────────────────────────────

@app.get("/api/admin/revenue")
async def get_revenue_data(current_user: User = Depends(check_admin)):
    """Monthly revenue breakdown for charts (last 6 months)."""
    users_resp = supabase.table("users").select("subscription_tier,created_at").execute()
    users = users_resp.data or []

    monthly = {}
    for u in users:
        tier = u.get("subscription_tier", "free")
        if tier == "free":
            continue
        created = u.get("created_at", "")[:7]  # YYYY-MM
        if created not in monthly:
            monthly[created] = 0
        if tier == "creator":
            monthly[created] += 99
        elif tier == "growth":
            monthly[created] += 249

    # Return sorted last 6 months
    sorted_months = sorted(monthly.items())[-6:]
    return {"months": [m[0] for m in sorted_months], "revenue": [m[1] for m in sorted_months]}


@app.get("/api/admin/user-growth")
async def get_user_growth(current_user: User = Depends(check_admin)):
    """User signups per month for charts (last 6 months)."""
    users_resp = supabase.table("users").select("created_at").execute()
    users = users_resp.data or []

    monthly = {}
    for u in users:
        month = u.get("created_at", "")[:7]
        monthly[month] = monthly.get(month, 0) + 1

    sorted_months = sorted(monthly.items())[-6:]
    return {"months": [m[0] for m in sorted_months], "signups": [m[1] for m in sorted_months]}


# ── CSV Exports ────────────────────────────────────────────────────────

@app.get("/api/admin/export/users")
async def export_users_csv(current_user: User = Depends(check_admin)):
    from fastapi.responses import StreamingResponse
    resp = supabase.table("users").select("id,name,email,subscription_tier,portfolios_count,created_at").execute()
    rows = resp.data or []
    output = io.StringIO()
    output.write("id,name,email,plan,portfolios,created_at\n")
    for r in rows:
        output.write(f'{r.get("id","")},{r.get("name","")},{r.get("email","")},{r.get("subscription_tier","free")},{r.get("portfolios_count",0)},{r.get("created_at","")}\n')
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=botfolio_users.csv"}
    )


@app.get("/api/admin/export/revenue")
async def export_revenue_csv(current_user: User = Depends(check_admin)):
    from fastapi.responses import StreamingResponse
    resp = supabase.table("users").select("name,email,subscription_tier,created_at").execute()
    rows = [r for r in (resp.data or []) if r.get("subscription_tier") not in ("free", None)]
    output = io.StringIO()
    output.write("name,email,plan,amount,created_at\n")
    prices = {"starter": 99, "pro": 249, "agency": 999}
    for r in rows:
        tier = r.get("subscription_tier", "free")
        output.write(f'{r.get("name","")},{r.get("email","")},{tier},{prices.get(tier, 0)},{r.get("created_at","")}\n')
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=botfolio_revenue.csv"}
    )


# =============================================
# CONTACT / MESSAGES
# =============================================

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@app.post("/api/contact")
async def submit_contact(msg: ContactMessage):
    data = msg.model_dump()
    data['created_at'] = data['created_at'].isoformat()
    supabase.table("messages").insert(data).execute()
    return {"message": "Message received"}

@app.get("/api/admin/messages")
async def get_messages(current_user: User = Depends(check_admin)):
    response = supabase.table("messages").select("*").order("created_at", desc=True).limit(100).execute()
    return response.data or []


# =============================================
# MAINTENANCE STATUS (public, for frontend)
# =============================================

@app.get("/api/maintenance-status")
async def public_maintenance_status():
    """Public endpoint for frontend to check if maintenance mode is active."""
    try:
        row = supabase.table("settings").select("value").eq("key", "maintenance_mode").single().execute()
        return {"maintenance": row.data and row.data.get("value") == "true"}
    except Exception:
        return {"maintenance": False}


@app.on_event("shutdown")
async def shutdown_client():
    pass

