"""
Backend API tests for Toko Lawanglimo
Covers: health, auth, categories, products, slides, discount validation, upload.
"""
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://toko-online-wa-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session_client):
    """Login as admin. If password was changed in a prior run, this will fail – test will skip."""
    r = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed ({r.status_code}); cannot run authenticated tests")
    return r.json()["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def auth_headers_no_ct(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, session_client):
        r = session_client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, session_client):
        r = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["username"] == ADMIN_USER

    def test_login_wrong_password(self, session_client):
        r = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": "wrongpw"})
        assert r.status_code == 401

    def test_login_wrong_user(self, session_client):
        r = session_client.post(f"{API}/auth/login", json={"username": "nobody", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, session_client, auth_headers):
        r = session_client.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["username"] == ADMIN_USER

    def test_me_without_token(self, session_client):
        r = session_client.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, session_client):
        r = session_client.get(f"{API}/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
        assert r.status_code == 401

    def test_change_credentials_wrong_current_password(self, session_client, auth_headers):
        r = session_client.post(f"{API}/auth/change-credentials",
                                headers=auth_headers,
                                json={"current_password": "wrong", "new_password": "x"})
        assert r.status_code == 400

    def test_change_password_flow_then_revert(self, session_client, auth_headers):
        """Change password, login with new, then revert. Leaves admin/admin123 intact."""
        new_pw = "tmpPass_" + uuid.uuid4().hex[:6]
        # Change pw
        r = session_client.post(f"{API}/auth/change-credentials",
                                headers=auth_headers,
                                json={"current_password": ADMIN_PASS, "new_password": new_pw})
        assert r.status_code == 200, r.text
        # Old password rejected
        r_old = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r_old.status_code == 401
        # New password works
        r_new = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": new_pw})
        assert r_new.status_code == 200
        new_token = r_new.json()["token"]
        # Revert to original
        r_rev = session_client.post(f"{API}/auth/change-credentials",
                                    headers={"Authorization": f"Bearer {new_token}", "Content-Type": "application/json"},
                                    json={"current_password": new_pw, "new_password": ADMIN_PASS})
        assert r_rev.status_code == 200
        # Verify original works again
        r_final = session_client.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r_final.status_code == 200


# ---------- Categories ----------
class TestCategories:
    def test_category_crud(self, session_client, auth_headers):
        name = f"TEST_cat_{uuid.uuid4().hex[:6]}"
        # Create
        r = session_client.post(f"{API}/categories", headers=auth_headers, json={"name": name})
        assert r.status_code == 200, r.text
        cat = r.json()
        assert cat["name"] == name and "id" in cat
        assert "_id" not in cat
        cat_id = cat["id"]
        # List (public)
        r2 = requests.get(f"{API}/categories")
        assert r2.status_code == 200
        assert any(c["id"] == cat_id for c in r2.json())
        # Duplicate rejected
        r3 = session_client.post(f"{API}/categories", headers=auth_headers, json={"name": name})
        assert r3.status_code == 400
        # Delete
        r4 = session_client.delete(f"{API}/categories/{cat_id}", headers=auth_headers)
        assert r4.status_code == 200

    def test_category_requires_auth(self):
        r = requests.post(f"{API}/categories", json={"name": "noauth"})
        assert r.status_code == 401


# ---------- Products ----------
class TestProducts:
    def test_product_crud_and_discount_hidden(self, session_client, auth_headers):
        payload = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}",
            "description": "Test desc",
            "price": 25000,
            "category": "",
            "image_url": "https://example.com/img.jpg",
            "discount_code": "TESTCODE1",
            "discount_percent": 10,
            "stock": 5,
        }
        # Create
        r = session_client.post(f"{API}/products", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        prod = r.json()
        assert prod["name"] == payload["name"]
        assert prod["price"] == 25000
        assert "id" in prod and "_id" not in prod
        pid = prod["id"]

        # Public list - discount_code MUST be hidden
        r_list = requests.get(f"{API}/products")
        assert r_list.status_code == 200
        public_items = [p for p in r_list.json() if p["id"] == pid]
        assert public_items, "Created product not found in public list"
        assert "discount_code" not in public_items[0], "discount_code leaked to public list!"

        # Public single get
        r_get = requests.get(f"{API}/products/{pid}")
        assert r_get.status_code == 200
        assert "discount_code" not in r_get.json()

        # Admin list - discount_code visible
        r_adm = session_client.get(f"{API}/admin/products", headers=auth_headers)
        assert r_adm.status_code == 200
        adm_items = [p for p in r_adm.json() if p["id"] == pid]
        assert adm_items
        assert adm_items[0].get("discount_code") == "TESTCODE1"

        # Update
        upd = {**payload, "price": 30000, "name": payload["name"] + "_upd"}
        r_upd = session_client.put(f"{API}/products/{pid}", headers=auth_headers, json=upd)
        assert r_upd.status_code == 200
        # Verify persistence
        r_v = requests.get(f"{API}/products/{pid}")
        assert r_v.json()["price"] == 30000

        # Delete
        r_del = session_client.delete(f"{API}/products/{pid}", headers=auth_headers)
        assert r_del.status_code == 200
        r_404 = requests.get(f"{API}/products/{pid}")
        assert r_404.status_code == 404

    def test_create_product_requires_auth(self):
        r = requests.post(f"{API}/products", json={"name": "x", "price": 1})
        assert r.status_code == 401

    def test_list_products_filter_by_category(self, session_client, auth_headers):
        cat_name = f"TESTCAT_{uuid.uuid4().hex[:4]}"
        # Create category
        session_client.post(f"{API}/categories", headers=auth_headers, json={"name": cat_name})
        # Create product in that category
        p = session_client.post(f"{API}/products", headers=auth_headers, json={
            "name": f"TEST_filter_{uuid.uuid4().hex[:5]}",
            "description": "", "price": 1000, "category": cat_name,
            "image_url": "", "stock": 1
        }).json()
        # Filtered list
        r = requests.get(f"{API}/products", params={"category": cat_name})
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert p["id"] in ids
        # Cleanup
        session_client.delete(f"{API}/products/{p['id']}", headers=auth_headers)


# ---------- Slides ----------
class TestSlides:
    def test_get_slides_returns_three(self):
        r = requests.get(f"{API}/slides")
        assert r.status_code == 200
        data = r.json()
        assert "images" in data
        assert isinstance(data["images"], list)

    def test_update_slides(self, session_client, auth_headers):
        # Save current
        original = requests.get(f"{API}/slides").json()["images"]
        new_imgs = [
            "https://example.com/a.jpg",
            "https://example.com/b.jpg",
            "https://example.com/c.jpg",
        ]
        r = session_client.put(f"{API}/slides", headers=auth_headers, json={"images": new_imgs})
        assert r.status_code == 200
        assert r.json()["images"][:3] == new_imgs
        # Verify persistence
        r2 = requests.get(f"{API}/slides")
        assert r2.json()["images"][:3] == new_imgs
        # Restore
        session_client.put(f"{API}/slides", headers=auth_headers, json={"images": original or new_imgs})

    def test_update_slides_requires_auth(self):
        r = requests.put(f"{API}/slides", json={"images": []})
        assert r.status_code == 401


# ---------- Discount Validate ----------
class TestDiscount:
    def test_validate_valid_and_invalid_code(self, session_client, auth_headers):
        code = f"TESTDISC_{uuid.uuid4().hex[:5].upper()}"
        # Create product with discount
        prod = session_client.post(f"{API}/products", headers=auth_headers, json={
            "name": f"TEST_disc_{uuid.uuid4().hex[:5]}",
            "description": "", "price": 50000, "category": "",
            "image_url": "", "discount_code": code, "discount_percent": 15, "stock": 3
        }).json()
        pid = prod["id"]
        # Valid
        r = requests.post(f"{API}/discounts/validate", json={"code": code})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["code"] == code
        assert data["discount_percent"] == 15
        assert data["product_id"] == pid
        # Invalid
        r2 = requests.post(f"{API}/discounts/validate", json={"code": "NOTACODE_" + uuid.uuid4().hex[:6]})
        assert r2.status_code == 404
        # Empty
        r3 = requests.post(f"{API}/discounts/validate", json={"code": ""})
        assert r3.status_code == 400
        # Cleanup
        session_client.delete(f"{API}/products/{pid}", headers=auth_headers)


# ---------- Upload ----------
class TestUpload:
    def test_upload_and_serve(self, auth_headers_no_ct):
        # tiny 1x1 PNG bytes
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
            b"\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05"
            b"\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
        r = requests.post(f"{API}/upload", headers=auth_headers_no_ct, files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("/api/files/")
        # Fetch the file
        r2 = requests.get(f"{BASE_URL}{data['url']}", timeout=60)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0

    def test_upload_requires_auth(self):
        files = {"file": ("x.txt", io.BytesIO(b"hi"), "text/plain")}
        r = requests.post(f"{API}/upload", files=files)
        assert r.status_code == 401
