from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Response, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'secret')
JWT_ALGO = "HS256"
APP_NAME = os.environ.get('APP_NAME', 'lawanglimo')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# ============ Storage ============
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============ Models ============
class LoginRequest(BaseModel):
    username: str
    password: str

class ChangeCredentialsRequest(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str = ""
    image_url: str = ""
    discount_code: Optional[str] = None
    discount_percent: Optional[float] = None
    stock: int = 0

class CategoryIn(BaseModel):
    name: str

class SlidesIn(BaseModel):
    images: List[str]

class DiscountCheckRequest(BaseModel):
    code: str

# ============ Helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Tidak terotorisasi")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        username = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    admin = await db.admins.find_one({"username": username}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin tidak ditemukan")
    return admin

def clean_doc(doc):
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

# ============ Startup ============
@app.on_event("startup")
async def startup():
    # Seed admin
    admin = await db.admins.find_one({})
    if not admin:
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Seeded default admin: admin / admin123")
    # Seed settings (slides) with design defaults
    settings = await db.settings.find_one({"key": "carousel"})
    if not settings:
        await db.settings.insert_one({
            "key": "carousel",
            "images": [
                "https://images.pexels.com/photos/7996793/pexels-photo-7996793.jpeg",
                "https://images.unsplash.com/photo-1604719312566-8912e9227c6a",
                "https://images.pexels.com/photos/27088193/pexels-photo-27088193.jpeg"
            ]
        })
    # Init storage (non-blocking)
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (will retry): {e}")

# ============ Auth Routes ============
@api_router.post("/auth/login")
async def login(req: LoginRequest):
    admin = await db.admins.find_one({"username": req.username})
    if not admin or not verify_password(req.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    token = create_token(req.username)
    return {"token": token, "username": req.username}

@api_router.get("/auth/me")
async def me(admin = Depends(get_current_admin)):
    return {"username": admin["username"]}

@api_router.post("/auth/change-credentials")
async def change_credentials(req: ChangeCredentialsRequest, admin = Depends(get_current_admin)):
    full = await db.admins.find_one({"username": admin["username"]})
    if not verify_password(req.current_password, full["password_hash"]):
        raise HTTPException(status_code=400, detail="Password lama salah")
    update = {}
    if req.new_username and req.new_username.strip():
        # Ensure unique
        exists = await db.admins.find_one({"username": req.new_username, "id": {"$ne": full["id"]}})
        if exists:
            raise HTTPException(status_code=400, detail="Username sudah dipakai")
        update["username"] = req.new_username.strip()
    if req.new_password and req.new_password.strip():
        update["password_hash"] = hash_password(req.new_password)
    if update:
        await db.admins.update_one({"id": full["id"]}, {"$set": update})
    new_username = update.get("username", full["username"])
    token = create_token(new_username)
    return {"token": token, "username": new_username}

# ============ Upload Routes ============
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), admin = Depends(get_current_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size"),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Public URL via our backend
    return {"id": file_id, "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def download(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type") or content_type)

# ============ Products ============
@api_router.get("/products")
async def list_products(category: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    products = await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # Hide discount_code from public
    for p in products:
        p.pop("discount_code", None)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    p.pop("discount_code", None)
    return p

@api_router.post("/products")
async def create_product(payload: ProductIn, admin = Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductIn, admin = Depends(get_current_admin)):
    update = payload.model_dump()
    res = await db.products.update_one({"id": product_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin = Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return {"ok": True}

@api_router.get("/admin/products")
async def admin_list_products(admin = Depends(get_current_admin)):
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return products

# ============ Categories ============
@api_router.get("/categories")
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return cats

@api_router.post("/categories")
async def create_category(payload: CategoryIn, admin = Depends(get_current_admin)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nama kategori kosong")
    exists = await db.categories.find_one({"name": name})
    if exists:
        raise HTTPException(status_code=400, detail="Kategori sudah ada")
    doc = {"id": str(uuid.uuid4()), "name": name}
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin = Depends(get_current_admin)):
    res = await db.categories.delete_one({"id": category_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    return {"ok": True}

# ============ Carousel/Slides ============
@api_router.get("/slides")
async def get_slides():
    s = await db.settings.find_one({"key": "carousel"}, {"_id": 0})
    return {"images": s.get("images", []) if s else []}

@api_router.put("/slides")
async def update_slides(payload: SlidesIn, admin = Depends(get_current_admin)):
    images = [i for i in payload.images if i][:3]
    while len(images) < 3:
        images.append("")
    await db.settings.update_one(
        {"key": "carousel"},
        {"$set": {"images": images}},
        upsert=True
    )
    return {"images": images}

# ============ Discount ============
@api_router.post("/discounts/validate")
async def validate_discount(req: DiscountCheckRequest):
    code = req.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Kode diskon kosong")
    # Find any product with this code
    product = await db.products.find_one({"discount_code": code})
    if not product:
        raise HTTPException(status_code=404, detail="Kode diskon tidak valid")
    return {
        "code": code,
        "discount_percent": product.get("discount_percent", 0),
        "product_id": product.get("id"),
        "product_name": product.get("name")
    }

# ============ Health ============
@api_router.get("/")
async def root():
    return {"message": "Toko Lawanglimo API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
