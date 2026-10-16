from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Usar SQLite síncrono si DATABASE_URL no tiene driver específico o es sqlite
db_url = settings.DATABASE_URL
if "aiosqlite" in db_url:
    db_url = db_url.replace("+aiosqlite", "")

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
engine = create_engine(db_url, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
