import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def generar_uuid():
    return str(uuid.uuid4())


class Asesoria(Base):
    __tablename__ = "asesorias"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    cif = Column(String(20), unique=True, nullable=False, index=True)
    razon_social = Column(String(150), nullable=False)
    email_contacto = Column(String(120), nullable=False)
    telefono = Column(String(20), nullable=True)
    codigo_invitacion = Column(String(20), unique=True, nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    usuarios = relationship("Usuario", back_populates="asesoria", cascade="all, delete-orphan")
    gastos = relationship("Gasto", back_populates="asesoria")
    exportaciones = relationship("ExportacionContable", back_populates="asesoria")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    asesoria_id = Column(String(36), ForeignKey("asesorias.id"), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="AUTONOMO")  # ADMIN, ASESOR, AUTONOMO
    nombre = Column(String(80), nullable=False)
    apellidos = Column(String(120), nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asesoria = relationship("Asesoria", back_populates="usuarios")
    perfil_autonomo = relationship("ClienteAutonomo", back_populates="usuario", uselist=False, cascade="all, delete-orphan")


class ClienteAutonomo(Base):
    __tablename__ = "clientes_autonomos"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), unique=True, nullable=False)
    asesoria_id = Column(String(36), ForeignKey("asesorias.id"), nullable=False)
    nif = Column(String(20), unique=True, nullable=False, index=True)
    nombre_fiscal = Column(String(150), nullable=False)
    actividad_iae = Column(String(150), nullable=True)
    telefono = Column(String(20), nullable=True)
    domicilio_fiscal = Column(String(200), nullable=True)
    fecha_alta = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    usuario = relationship("Usuario", back_populates="perfil_autonomo")
    gastos = relationship("Gasto", back_populates="cliente", cascade="all, delete-orphan")


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    cliente_id = Column(String(36), ForeignKey("clientes_autonomos.id"), nullable=False, index=True)
    asesoria_id = Column(String(36), ForeignKey("asesorias.id"), nullable=False, index=True)
    
    fecha_emision = Column(DateTime, nullable=False)
    nif_emisor = Column(String(20), nullable=True)
    razon_social_emisor = Column(String(150), nullable=False)
    nif_receptor = Column(String(20), nullable=True)
    
    base_imponible = Column(Float, nullable=False)
    tipo_iva = Column(Integer, nullable=False, default=21)
    cuota_iva = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
    categoria = Column(String(50), nullable=False)
    cuenta_pgc = Column(String(20), nullable=False, default="629")
    tipo_documento = Column(String(30), nullable=False, default="ticket")
    
    estado_semaforo = Column(String(20), nullable=False, default="verde")  # verde, amarillo, rojo
    motivo_riesgo = Column(Text, nullable=True)
    
    url_documento = Column(String(255), nullable=True)
    hash_sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asesoria = relationship("Asesoria", back_populates="gastos")
    cliente = relationship("ClienteAutonomo", back_populates="gastos")
    justificacion = relationship("JustificacionFiscal", back_populates="gasto", uselist=False, cascade="all, delete-orphan")


class JustificacionFiscal(Base):
    __tablename__ = "justificaciones_fiscales"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    gasto_id = Column(String(36), ForeignKey("gastos.id"), unique=True, nullable=False)
    motivo_profesional = Column(Text, nullable=False)
    nif_cliente_reunion = Column(String(20), nullable=True)
    nombre_cliente_reunion = Column(String(150), nullable=True)
    fecha_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    gasto = relationship("Gasto", back_populates="justificacion")


class ExportacionContable(Base):
    __tablename__ = "exportaciones_contables"

    id = Column(String(36), primary_key=True, default=generar_uuid)
    asesoria_id = Column(String(36), ForeignKey("asesorias.id"), nullable=False)
    trimestre = Column(Integer, nullable=False)  # 1, 2, 3, 4
    anio = Column(Integer, nullable=False)
    formato = Column(String(20), nullable=False, default="CSV")  # CSV, JSON, A3, SAGE
    num_asientos = Column(Integer, nullable=False, default=0)
    total_importe = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asesoria = relationship("Asesoria", back_populates="exportaciones")
