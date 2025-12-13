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
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001').split(','),
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
    is_admin: bool = False
    subscription_expiry: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))
    daily_queries_count: int = 0
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

async def check_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

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

    raise HTTPException(status_code=501, detail="Google OAuth coming soon")

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ===== PORTFOLIO ENDPOINTS =====

@app.post("/api/portfolios/create")
async def create_portfolio(
    name: str = Form(...),
    custom_url: str = Form(...),
    text_content: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    details: Optional[UploadFile] = File(None),
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
    
    resume_path = None
    if resume:
        resume_path = upload_dir / f"resume_{resume.filename}"
        with open(resume_path, "wb") as f:
            shutil.copyfileobj(resume.file, f)
            
    details_path = None
    if details:
        details_path = upload_dir / f"details_{details.filename}"
        with open(details_path, "wb") as f:
            shutil.copyfileobj(details.file, f)
    
    # Create portfolio
    portfolio = Portfolio(
        id=portfolio_id,
        user_id=current_user.id,
        name=name,
        custom_url=custom_url,
        resume_path=str(resume_path) if resume_path else None,
        details_path=str(details_path) if details_path else None,
        text_content=text_content,
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
        setup_rag_chain(portfolio_id, str(resume_path) if resume_path else None, str(details_path) if details_path else None, text_content)
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

@app.post("/api/portfolios/{portfolio_id}/update-files")
async def update_portfolio_files(
    portfolio_id: str,
    resume: Optional[UploadFile] = File(None),
    details: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    portfolio = await db.portfolios.find_one({"id": portfolio_id, "user_id": current_user.id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    upload_dir = Path(ROOT_DIR) / "uploads" / portfolio_id
    
    # Update resume if provided
    if resume:
        resume_path = upload_dir / f"resume_{resume.filename}"
        with open(resume_path, "wb") as f:
            shutil.copyfileobj(resume.file, f)
        await db.portfolios.update_one(
            {"id": portfolio_id},
            {"$set": {"resume_path": str(resume_path)}}
        )
        portfolio['resume_path'] = str(resume_path)
    
    # Update details if provided
    if details:
        details_path = upload_dir / f"details_{details.filename}"
        with open(details_path, "wb") as f:
            shutil.copyfileobj(details.file, f)
        await db.portfolios.update_one(
            {"id": portfolio_id},
            {"$set": {"details_path": str(details_path)}}
        )
        portfolio['details_path'] = str(details_path)
    
    # Retrain chatbot
    try:
        setup_rag_chain(portfolio_id, portfolio['resume_path'], portfolio['details_path'])
        await db.portfolios.update_one(
            {"id": portfolio_id},
            {"$set": {"is_processed": True}}
        )
        return {"message": "Portfolio files updated and chatbot retrained successfully"}
    except Exception as e:
        logger.error(f"Failed to retrain chatbot: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrain chatbot")

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
    
    # Get owner to check limits
    user = await db.users.find_one({"id": portfolio['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="Portfolio owner not found")
        
    # Check subscription & limits
    now = datetime.now(timezone.utc)
    
    # Reset daily count if new day
    if user.get('last_query_date'):
        last_date = user['last_query_date'].replace(tzinfo=timezone.utc) if user['last_query_date'].tzinfo is None else user['last_query_date']
        if last_date.date() < now.date():
            user['daily_queries_count'] = 0
            await db.users.update_one({"id": user['id']}, {"$set": {"daily_queries_count": 0}})

    # Check limits
    daily_limit = 5 # Default Free
    if user.get('subscription_tier') == 'starter':
        daily_limit = 50
    elif user.get('subscription_tier') == 'pro' or user.get('subscription_tier') == 'enterprise':
        daily_limit = 999999 # Unlimited
        
    if user.get('daily_queries_count', 0) >= daily_limit:
          raise HTTPException(status_code=402, detail=f"Daily chat limit of {daily_limit} reached. Please upgrade.")
             
    # Check expiry
    if user.get('subscription_expiry'):
        expiry = user['subscription_expiry'].replace(tzinfo=timezone.utc) if user['subscription_expiry'].tzinfo is None else user['subscription_expiry']
        if now > expiry:
             raise HTTPException(status_code=402, detail="Portfolio subscription expired")

    # Increment usage
    await db.users.update_one(
        {"id": user['id']},
        {"$inc": {"daily_queries_count": 1}, "$set": {"last_query_date": now}}
    )

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
        # Sanitize error for user
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
             raise HTTPException(status_code=429, detail="The AI engine is out of power. Please try again in a few minutes.")
        if "permission" in error_msg:
             raise HTTPException(status_code=403, detail="AI engine access denied. Please contact support.")
             
        raise HTTPException(status_code=500, detail="The AI server is experiencing heavy load. Please try again later.")

# ===== PAYMENT ENDPOINTS (RAZORPAY) =====
import razorpay

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'secret_placeholder')

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class OrderRequest(BaseModel):
    plan_id: str  # 'starter' or 'pro'

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

@app.post("/api/payment/create-order")
async def create_order(request: OrderRequest, current_user: User = Depends(get_current_user)):
    amount = 0
    if request.plan_id == 'starter':
        amount = 9900  # ₹99.00 in paise
    elif request.plan_id == 'pro':
        amount = 49900 # ₹499.00 in paise
    else:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    try:
        data = { "amount": amount, "currency": "INR", "receipt": f"receipt_{current_user.id[:8]}" }
        order = razorpay_client.order.create(data=data)
        return order
    except Exception as e:
        logger.error(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Could not create order")

@app.post("/api/payment/verify")
async def verify_payment(data: PaymentVerification, current_user: User = Depends(get_current_user)):
    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update User Subscription
        expiry = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "subscription_tier": data.plan_id,
                    "subscription_expiry": expiry,
                    "daily_queries_count": 0 # Reset count on upgrade
                }
            }
        )
        return {"status": "success", "tier": data.plan_id}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
         logger.error(f"Payment Confirm Error: {e}")
         raise HTTPException(status_code=500, detail="Internal server error")


# ===== ADMIN ENDPOINTS =====

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: User = Depends(check_admin)):
    total_users = await db.users.count_documents({})
    total_portfolios = await db.portfolios.count_documents({})
    # Revenue is mocked for now as we don't have payments yet
    revenue = 0 
    pending_approvals = 0
    
    return {
        "total_users": total_users,
        "total_portfolios": total_portfolios,
        "revenue": revenue,
        "pending_approvals": pending_approvals
    }

@app.get("/api/admin/users", response_model=List[User])
async def get_all_users(limit: int = 100, current_user: User = Depends(check_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(limit)
    return users

@app.put("/api/admin/users/{user_id}")
async def update_user_admin(user_id: str, updates: UserUpdate, current_user: User = Depends(check_admin)):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No updates provided"}
        
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "User updated successfully"}

# ===== CONTACT/MESSAGES =====

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@app.post("/api/contact")
async def submit_contact(msg: ContactMessage):
    await db.messages.insert_one(msg.model_dump())
    return {"message": "Message received"}

@app.get("/api/admin/messages")
async def get_messages(current_user: User = Depends(check_admin)):
    messages = await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return messages

# ===== HEALTH CHECK =====

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
