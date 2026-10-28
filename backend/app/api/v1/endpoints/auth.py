from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    crear_access_token,
    decodificar_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.entities import Asesoria, ClienteAutonomo, Usuario
from app.schemas.auth import LoginRequest, RegistroRequest, TokenResponse, UsuarioResponse

router = APIRouter()


def obtener_usuario_actual(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
) -> Usuario:
    """Dependencia FastAPI para extraer y verificar el usuario autenticado."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Encabezado de autorización inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    payload = decodificar_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    usuario_id = payload["sub"]
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")
    return usuario


@router.post("/auth/login", response_model=TokenResponse)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión con email y contraseña, devolviendo el JWT y el rol del usuario."""
    email_limpio = login_in.email.strip().lower()
    usuario = db.query(Usuario).filter(Usuario.email == email_limpio).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    if not verify_password(login_in.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Esta cuenta se encuentra pausada o desactivada")

    cliente_id = None
    if usuario.perfil_autonomo:
        cliente_id = usuario.perfil_autonomo.id

    token = crear_access_token(
        data={
            "sub": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol,
            "asesoria_id": usuario.asesoria_id,
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuarioId=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        rol=usuario.rol,
        asesoriaId=usuario.asesoria_id,
        clienteId=cliente_id,
    )


@router.post("/auth/registro", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registro_autonomo(reg_in: RegistroRequest, db: Session = Depends(get_db)):
    """Registra un nuevo autónomo vinculado a una asesoría mediante código de invitación."""
    # 1. Validar código de asesoría
    codigo_limpio = reg_in.codigoInvitacion.strip().upper()
    asesoria = db.query(Asesoria).filter(
        Asesoria.codigo_invitacion == codigo_limpio,
        Asesoria.activo == True,  # noqa: E712
    ).first()
    if not asesoria:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de invitación no válido o asesoría inactiva",
        )

    # 2. Comprobar email duplicado
    email_limpio = reg_in.email.strip().lower()
    if db.query(Usuario).filter(Usuario.email == email_limpio).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta con este correo electrónico",
        )

    # 3. Comprobar NIF duplicado
    nif_limpio = reg_in.nif.strip().upper()
    if db.query(ClienteAutonomo).filter(ClienteAutonomo.nif == nif_limpio).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un autónomo registrado con este NIF",
        )

    # 4. Crear usuario
    nuevo_usuario = Usuario(
        asesoria_id=asesoria.id,
        email=email_limpio,
        password_hash=hash_password(reg_in.password),
        rol="AUTONOMO",
        nombre=reg_in.nombre.strip(),
        apellidos=reg_in.apellidos.strip() if reg_in.apellidos else None,
        activo=True,
    )
    db.add(nuevo_usuario)
    db.flush()  # Para obtener nuevo_usuario.id

    # 5. Crear perfil de cliente autónomo
    nombre_fiscal = reg_in.nombreFiscal.strip() if reg_in.nombreFiscal else f"{reg_in.nombre} {reg_in.apellidos or ''}".strip()
    nuevo_cliente = ClienteAutonomo(
        usuario_id=nuevo_usuario.id,
        asesoria_id=asesoria.id,
        nif=nif_limpio,
        nombre_fiscal=nombre_fiscal,
        actividad_iae=reg_in.actividadIae.strip() if reg_in.actividadIae else None,
        telefono=reg_in.telefono.strip() if reg_in.telefono else None,
        domicilio_fiscal=reg_in.domicilioFiscal.strip() if reg_in.domicilioFiscal else None,
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_usuario)
    db.refresh(nuevo_cliente)

    token = crear_access_token(
        data={
            "sub": nuevo_usuario.id,
            "email": nuevo_usuario.email,
            "rol": nuevo_usuario.rol,
            "asesoria_id": nuevo_usuario.asesoria_id,
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuarioId=nuevo_usuario.id,
        email=nuevo_usuario.email,
        nombre=nuevo_usuario.nombre,
        rol=nuevo_usuario.rol,
        asesoriaId=nuevo_usuario.asesoria_id,
        clienteId=nuevo_cliente.id,
    )


@router.get("/auth/me", response_model=UsuarioResponse)
def perfil_actual(usuario: Usuario = Depends(obtener_usuario_actual)):
    """Obtiene los datos del usuario actualmente autenticado."""
    return UsuarioResponse(
        id=usuario.id,
        email=usuario.email,
        rol=usuario.rol,
        nombre=usuario.nombre,
        apellidos=usuario.apellidos,
        activo=usuario.activo,
        asesoriaId=usuario.asesoria_id,
        createdAt=usuario.created_at.isoformat() if usuario.created_at else "",
    )

