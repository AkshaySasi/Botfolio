from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import logging
import uuid
import shutil
from dotenv import load_dotenv
import bcrypt
import jwt

# Import RAG engine
from rag_engine import setup_rag_chain, query_chatbot

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'botiee_db')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Botiee API", version="1.0.0")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== MODELS =====

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    auth_provider: str = "email"  # email or google
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_tier: str = "free"  # free, pro, enterprise
    portfolios_count: int = 0

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google OAuth token
    
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
    resume_path: Optional[str] = None
    details_path: Optional[str] = None
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

# ===== AUTH UTILITIES =====

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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
    user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ===== AUTH ENDPOINTS =====

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        auth_provider="email"
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = hashed_pwd
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"user_id": user.id, "email": user.email})
    
    return TokenResponse(
        access_token=token,
        user=user.model_dump(mode='json')
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user['id'], "email": user['email']})
    user_obj = User(**user)
    
    return TokenResponse(
        access_token=token,
        user=user_obj.model_dump(mode='json')
    )

@app.post("/api/auth/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest):
    # For now, this is a placeholder
    # In production, verify the Google token
    # For development, we'll use Emergent integration
    raise HTTPException(status_code=501, detail="Google OAuth coming soon")

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ===== PORTFOLIO ENDPOINTS =====

@app.post("/api/portfolios/create")
async def create_portfolio(
    name: str = Form(...),
    custom_url: str = Form(...),
    resume: UploadFile = File(...),
    details: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check portfolio limit based on subscription
    if current_user.subscription_tier == "free" and current_user.portfolios_count >= 1:
        raise HTTPException(status_code=403, detail="Free tier allows only 1 portfolio. Upgrade to create more.")
    
    # Check if custom_url is unique
    existing = await db.portfolios.find_one({"custom_url": custom_url})
    if existing:
        raise HTTPException(status_code=400, detail="This URL is already taken")
    
    # Save files
    portfolio_id = str(uuid.uuid4())
    upload_dir = Path(ROOT_DIR) / "uploads" / portfolio_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    resume_path = upload_dir / f"resume_{resume.filename}"
    details_path = upload_dir / f"details_{details.filename}"
    
    with open(resume_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    with open(details_path, "wb") as f:
        shutil.copyfileobj(details.file, f)
    
    # Create portfolio
    portfolio = Portfolio(
        id=portfolio_id,
        user_id=current_user.id,
        name=name,
        custom_url=custom_url,
        resume_path=str(resume_path),
        details_path=str(details_path),
        is_processed=False
    )
    
    portfolio_dict = portfolio.model_dump()
    portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
    
    await db.portfolios.insert_one(portfolio_dict)
    
    # Update user portfolio count
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"portfolios_count": 1}}
    )
    
    # Trigger AI processing in background
    try:
        setup_rag_chain(portfolio_id, str(resume_path), str(details_path))
        await db.portfolios.update_one(
            {"id": portfolio_id},
            {"$set": {"is_processed": True}}
        )
    except Exception as e:
        logger.error(f"RAG setup error for portfolio {portfolio_id}: {e}")
    
    return {"message": "Portfolio created successfully", "portfolio_id": portfolio_id, "custom_url": custom_url}

@app.get("/api/portfolios", response_model=List[Portfolio])
async def get_portfolios(current_user: User = Depends(get_current_user)):
    portfolios = await db.portfolios.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    
    for p in portfolios:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return portfolios

@app.get("/api/portfolios/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str, current_user: User = Depends(get_current_user)):
    portfolio = await db.portfolios.find_one({"id": portfolio_id, "user_id": current_user.id}, {"_id": 0})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if isinstance(portfolio.get('created_at'), str):
        portfolio['created_at'] = datetime.fromisoformat(portfolio['created_at'])
    
    return Portfolio(**portfolio)

@app.delete("/api/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: str, current_user: User = Depends(get_current_user)):
    portfolio = await db.portfolios.find_one({"id": portfolio_id, "user_id": current_user.id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Delete files
    upload_dir = Path(ROOT_DIR) / "uploads" / portfolio_id
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
    
    # Delete vector store
    vector_dir = Path(ROOT_DIR) / "vector_stores" / portfolio_id
    if vector_dir.exists():
        shutil.rmtree(vector_dir)
    
    # Delete from DB
    await db.portfolios.delete_one({"id": portfolio_id})
    
    # Update user portfolio count
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"portfolios_count": -1}}
    )
    
    return {"message": "Portfolio deleted successfully"}

@app.put("/api/portfolios/{portfolio_id}")
async def update_portfolio(
    portfolio_id: str,
    name: Optional[str] = None,
    custom_domain: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
):
    portfolio = await db.portfolios.find_one({"id": portfolio_id, "user_id": current_user.id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    update_data = {}
    if name is not None:
        update_data['name'] = name
    if custom_domain is not None:
        update_data['custom_domain'] = custom_domain
    if is_active is not None:
        update_data['is_active'] = is_active
    
    if update_data:
        await db.portfolios.update_one(
            {"id": portfolio_id},
            {"$set": update_data}
        )
    
    return {"message": "Portfolio updated successfully"}

@app.get("/api/portfolios/{portfolio_id}/analytics")
async def get_analytics(portfolio_id: str, current_user: User = Depends(get_current_user)):
    portfolio = await db.portfolios.find_one({"id": portfolio_id, "user_id": current_user.id}, {"_id": 0})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get chat sessions
    sessions = await db.chat_sessions.find({"portfolio_id": portfolio_id}, {"_id": 0}).to_list(1000)
    
    total_chats = len(sessions)
    total_messages = sum(len(s.get('messages', [])) for s in sessions)
    
    return {
        "total_chats": total_chats,
        "total_messages": total_messages,
        "analytics": portfolio.get('analytics', {})
    }

# ===== PUBLIC ENDPOINTS =====

@app.get("/api/public/{custom_url}", response_model=PortfolioPublic)
async def get_public_portfolio(custom_url: str):
    portfolio = await db.portfolios.find_one({"custom_url": custom_url}, {"_id": 0})
    if not portfolio or not portfolio.get('is_active'):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get owner info
    user = await db.users.find_one({"id": portfolio['user_id']}, {"_id": 0})
    
    return PortfolioPublic(
        name=portfolio['name'],
        custom_url=portfolio['custom_url'],
        owner_name=user.get('name', 'Portfolio Owner') if user else 'Portfolio Owner',
        is_active=portfolio['is_active']
    )

@app.post("/api/chat/{custom_url}", response_model=ChatResponse)
async def chat_with_portfolio(custom_url: str, chat: ChatMessage):
    portfolio = await db.portfolios.find_one({"custom_url": custom_url}, {"_id": 0})
    if not portfolio or not portfolio.get('is_active') or not portfolio.get('is_processed'):
        raise HTTPException(status_code=404, detail="Portfolio chatbot not available")
    
    # Query RAG
    try:
        response = query_chatbot(portfolio['id'], chat.message)
        
        # Log chat session
        session_data = {
            "id": str(uuid.uuid4()),
            "portfolio_id": portfolio['id'],
            "visitor_name": chat.visitor_name,
            "messages": [
                {"role": "user", "content": chat.message},
                {"role": "assistant", "content": response}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_sessions.insert_one(session_data)
        
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service error")

# ===== HEALTH CHECK =====

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
