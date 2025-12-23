import json
import os
import bcrypt
from datetime import datetime
import uuid

class UserManager:
    """Simple user management system using JSON file storage"""
    
    def __init__(self, users_file='models/users.json'):
        self.users_file = users_file
        os.makedirs(os.path.dirname(users_file), exist_ok=True)
        self._ensure_users_file()
    
    def _ensure_users_file(self):
        """Create users file if it doesn't exist"""
        if not os.path.exists(self.users_file):
            self._save_users([])
    
    def _load_users(self):
        """Load users from JSON file"""
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    
    def _save_users(self, users):
        """Save users to JSON file"""
        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    
    def hash_password(self, password):
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password, hashed):
        """Verify a password against a hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_user(self, username, email, password, full_name=''):
        """Create a new user"""
        users = self._load_users()
        
        # Check if user already exists
        if any(u['username'] == username for u in users):
            return None, "Username already exists"
        
        if any(u['email'] == email for u in users):
            return None, "Email already exists"
        
        # Create new user
        user = {
            'id': str(uuid.uuid4()),
            'username': username,
            'email': email,
            'password_hash': self.hash_password(password),
            'full_name': full_name,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'is_active': True
        }
        
        users.append(user)
        self._save_users(users)
        
        # Return user without password hash
        user_safe = {k: v for k, v in user.items() if k != 'password_hash'}
        return user_safe, None
    
    def authenticate(self, username, password):
        """Authenticate a user"""
        users = self._load_users()
        
        # Find user by username or email
        user = next((u for u in users if u['username'] == username or u['email'] == username), None)
        
        if not user:
            return None, "Invalid username or password"
        
        if not user.get('is_active', True):
            return None, "Account is disabled"
        
        # Verify password
        if not self.verify_password(password, user['password_hash']):
            return None, "Invalid username or password"
        
        # Update last login
        user['last_login'] = datetime.now().isoformat()
        self._save_users(users)
        
        # Return user without password hash
        user_safe = {k: v for k, v in user.items() if k != 'password_hash'}
        return user_safe, None
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        users = self._load_users()
        user = next((u for u in users if u['id'] == user_id), None)
        
        if user:
            return {k: v for k, v in user.items() if k != 'password_hash'}
        return None
    
    def get_user_by_username(self, username):
        """Get user by username"""
        users = self._load_users()
        user = next((u for u in users if u['username'] == username), None)
        
        if user:
            return {k: v for k, v in user.items() if k != 'password_hash'}
        return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        users = self._load_users()
        user = next((u for u in users if u['email'] == email), None)
        
        if user:
            return {k: v for k, v in user.items() if k != 'password_hash'}
        return None
    
    def find_or_create_google_user(self, google_id, email, name, picture=None):
        """Find existing user by email or create new user from Google profile"""
        users = self._load_users()
        
        # First, check if user exists by email
        existing_user = next((u for u in users if u['email'] == email), None)
        
        if existing_user:
            # Update Google ID and picture if not already set
            if not existing_user.get('google_id'):
                existing_user['google_id'] = google_id
            if picture and not existing_user.get('picture'):
                existing_user['picture'] = picture
            existing_user['last_login'] = datetime.now().isoformat()
            self._save_users(users)
            return {k: v for k, v in existing_user.items() if k != 'password_hash'}, None
        
        # Create new user from Google profile
        # Generate a unique username from email
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while any(u['username'] == username for u in users):
            username = f"{base_username}{counter}"
            counter += 1
        
        user = {
            'id': str(uuid.uuid4()),
            'username': username,
            'email': email,
            'password_hash': None,  # No password for Google users
            'full_name': name or '',
            'google_id': google_id,
            'picture': picture,
            'auth_provider': 'google',
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat(),
            'is_active': True
        }
        
        users.append(user)
        self._save_users(users)
        
        # Return user without password hash
        user_safe = {k: v for k, v in user.items() if k != 'password_hash'}
        return user_safe, None
