/*==============================================================*/
/*    SISTEMA ADMINISTRATIVO Y VENTAS - GUITAR SHOP             */
/*    MODELO DE BASE DE DATOS LIMPIO Y NORMALIZADO (POSTGRES)   */
/*==============================================================*/

/* Limpieza segura: elimina tablas si existen (para rehacer todo) */

DROP TABLE IF EXISTS cuota         CASCADE;
DROP TABLE IF EXISTS credito       CASCADE;
DROP TABLE IF EXISTS detalle_factura CASCADE;
DROP TABLE IF EXISTS factura       CASCADE;
DROP TABLE IF EXISTS producto_compra CASCADE;
DROP TABLE IF EXISTS compra        CASCADE;
DROP TABLE IF EXISTS kardex        CASCADE;
DROP TABLE IF EXISTS producto      CASCADE;
DROP TABLE IF EXISTS proveedor     CASCADE;
DROP TABLE IF EXISTS cliente       CASCADE;
DROP TABLE IF EXISTS usuario       CASCADE;
DROP TABLE IF EXISTS estado_registro CASCADE;

/*==============================================================*/
/* 1. CATÁLOGO DE ESTADOS                                       */
/*==============================================================*/

CREATE TABLE estado_registro (
    id_estado       SERIAL PRIMARY KEY,
    nombre_estado   VARCHAR(30)  NOT NULL UNIQUE,
    descripcion     VARCHAR(100)
);

INSERT INTO estado_registro (nombre_estado, descripcion) VALUES
  ('ACTIVO',   'Registro activo'),
  ('INACTIVO', 'Registro inactivo / dado de baja'),
  ('ANULADO',  'Registro anulado'),
  ('PENDIENTE','Pendiente de completar');

/*==============================================================*/
/* 2. USUARIOS                                                  */
/*==============================================================*/

CREATE TABLE usuario (
    id_usuario          SERIAL PRIMARY KEY,
    nombre_completo     VARCHAR(100) NOT NULL,
    correo              VARCHAR(120) NOT NULL UNIQUE,
    telefono            VARCHAR(20),
    direccion           VARCHAR(150),
    cedula              VARCHAR(10) UNIQUE,
    rol                 VARCHAR(30) NOT NULL DEFAULT 'VENDEDOR',
    password_hash       VARCHAR(255) NOT NULL,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT NOW(),
    id_estado           INT NOT NULL DEFAULT 1,
    id_usuario_modifi   INT NULL
);

ALTER TABLE usuario
  ADD CONSTRAINT chk_usuario_cedula
  CHECK (
    cedula IS NULL
    OR (char_length(cedula) = 10 AND cedula ~ '^[0-9]+$')
  );

ALTER TABLE usuario
  ADD CONSTRAINT chk_usuario_correo
  CHECK (correo ~ '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 3. CLIENTES                                                  */
/*==============================================================*/

CREATE TABLE cliente (
    id_cliente        SERIAL PRIMARY KEY,
    nombres           VARCHAR(60)  NOT NULL,
    apellidos         VARCHAR(60)  NOT NULL,
    cedula            VARCHAR(10)  NOT NULL UNIQUE,
    correo            VARCHAR(120),
    telefono          VARCHAR(20),
    direccion         VARCHAR(150),
    fecha_registro    TIMESTAMP NOT NULL DEFAULT NOW(),
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE cliente
  ADD CONSTRAINT chk_cliente_cedula
  CHECK (char_length(cedula) = 10 AND cedula ~ '^[0-9]+$');

ALTER TABLE cliente
  ADD CONSTRAINT chk_cliente_correo
  CHECK (correo IS NULL OR correo ~ '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE cliente
  ADD CONSTRAINT fk_cliente_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE cliente
  ADD CONSTRAINT fk_cliente_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 4. PROVEEDORES                                               */
/*==============================================================*/

CREATE TABLE proveedor (
    id_proveedor      SERIAL PRIMARY KEY,
    nombre_proveedor  VARCHAR(100) NOT NULL,
    ruc_cedula        VARCHAR(13)  NOT NULL UNIQUE,
    correo            VARCHAR(120),
    telefono          VARCHAR(20),
    direccion         VARCHAR(150),
    fecha_registro    TIMESTAMP NOT NULL DEFAULT NOW(),
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE proveedor
  ADD CONSTRAINT chk_proveedor_correo
  CHECK (correo IS NULL OR correo ~ '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE proveedor
  ADD CONSTRAINT fk_proveedor_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE proveedor
  ADD CONSTRAINT fk_proveedor_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 5. PRODUCTOS                                                 */
/*==============================================================*/

CREATE TABLE producto (
    id_producto         SERIAL PRIMARY KEY,
    codigo_producto     VARCHAR(30)  NOT NULL UNIQUE,
    nombre_producto     VARCHAR(100) NOT NULL,
    descripcion         VARCHAR(255),
    id_proveedor        INT NULL,
    precio_compra       NUMERIC(12,2) NOT NULL DEFAULT 0,
    precio_venta        NUMERIC(12,2) NOT NULL DEFAULT 0,
    cantidad_stock      INT NOT NULL DEFAULT 0,
    stock_minimo        INT NOT NULL DEFAULT 0,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT NOW(),
    id_estado           INT NOT NULL DEFAULT 1,
    id_usuario_modifi   INT NULL
);

ALTER TABLE producto
  ADD CONSTRAINT chk_producto_precios
  CHECK (precio_compra >= 0 AND precio_venta >= 0);

ALTER TABLE producto
  ADD CONSTRAINT chk_producto_stock
  CHECK (cantidad_stock >= 0 AND stock_minimo >= 0);

ALTER TABLE producto
  ADD CONSTRAINT fk_producto_proveedor
  FOREIGN KEY (id_proveedor)
  REFERENCES proveedor(id_proveedor);

ALTER TABLE producto
  ADD CONSTRAINT fk_producto_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE producto
  ADD CONSTRAINT fk_producto_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 6. COMPRAS (CABECERA)                                       */
/*==============================================================*/

CREATE TABLE compra (
    id_compra         SERIAL PRIMARY KEY,
    fecha_compra      TIMESTAMP NOT NULL DEFAULT NOW(),
    id_proveedor      INT NOT NULL,
    id_usuario        INT NOT NULL, -- quién registra la compra
    observacion       VARCHAR(255),
    subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
    impuesto          NUMERIC(12,2) NOT NULL DEFAULT 0,
    total             NUMERIC(12,2) NOT NULL DEFAULT 0,
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE compra
  ADD CONSTRAINT fk_compra_proveedor
  FOREIGN KEY (id_proveedor)
  REFERENCES proveedor(id_proveedor);

ALTER TABLE compra
  ADD CONSTRAINT fk_compra_usuario
  FOREIGN KEY (id_usuario)
  REFERENCES usuario(id_usuario);

ALTER TABLE compra
  ADD CONSTRAINT fk_compra_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE compra
  ADD CONSTRAINT fk_compra_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 7. DETALLE DE COMPRAS (PRODUCTO_COMPRA)                      */
/*==============================================================*/

CREATE TABLE producto_compra (
    id_producto_compra SERIAL PRIMARY KEY,
    id_compra          INT NOT NULL,
    id_producto        INT NOT NULL,
    cantidad_compra    INT NOT NULL,
    costo_unitario     NUMERIC(12,2) NOT NULL,
    subtotal           NUMERIC(12,2) NOT NULL,
    id_estado          INT NOT NULL DEFAULT 1,
    id_usuario_modifi  INT NULL
);

ALTER TABLE producto_compra
  ADD CONSTRAINT chk_producto_compra_cantidad
  CHECK (cantidad_compra > 0);

ALTER TABLE producto_compra
  ADD CONSTRAINT chk_producto_compra_costos
  CHECK (costo_unitario >= 0 AND subtotal >= 0);

ALTER TABLE producto_compra
  ADD CONSTRAINT fk_producto_compra_compra
  FOREIGN KEY (id_compra)
  REFERENCES compra(id_compra)
  ON DELETE CASCADE;

ALTER TABLE producto_compra
  ADD CONSTRAINT fk_producto_compra_producto
  FOREIGN KEY (id_producto)
  REFERENCES producto(id_producto);

ALTER TABLE producto_compra
  ADD CONSTRAINT fk_producto_compra_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE producto_compra
  ADD CONSTRAINT fk_producto_compra_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_producto_compra_unico
ON producto_compra (id_compra, id_producto);

/*==============================================================*/
/* 8. FACTURAS (VENTAS - CABECERA)                             */
/*==============================================================*/

CREATE TABLE factura (
    id_factura        SERIAL PRIMARY KEY,
    numero_factura    VARCHAR(30) NOT NULL UNIQUE,
    fecha_factura     TIMESTAMP NOT NULL DEFAULT NOW(),
    id_cliente        INT NOT NULL,
    id_usuario        INT NOT NULL, -- vendedor
    observacion       VARCHAR(255),
    forma_pago        VARCHAR(30) NOT NULL DEFAULT 'CONTADO',
    subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
    impuesto          NUMERIC(12,2) NOT NULL DEFAULT 0,
    total             NUMERIC(12,2) NOT NULL DEFAULT 0,
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE factura
  ADD CONSTRAINT fk_factura_cliente
  FOREIGN KEY (id_cliente)
  REFERENCES cliente(id_cliente);

ALTER TABLE factura
  ADD CONSTRAINT fk_factura_usuario
  FOREIGN KEY (id_usuario)
  REFERENCES usuario(id_usuario);

ALTER TABLE factura
  ADD CONSTRAINT fk_factura_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE factura
  ADD CONSTRAINT fk_factura_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 9. DETALLE DE FACTURA                                        */
/*==============================================================*/

CREATE TABLE detalle_factura (
    id_detalle_factura SERIAL PRIMARY KEY,
    id_factura         INT NOT NULL,
    id_producto        INT NOT NULL,
    cantidad           INT NOT NULL,
    precio_unitario    NUMERIC(12,2) NOT NULL,
    descuento          NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal           NUMERIC(12,2) NOT NULL,
    id_estado          INT NOT NULL DEFAULT 1,
    id_usuario_modifi  INT NULL
);

ALTER TABLE detalle_factura
  ADD CONSTRAINT chk_detalle_factura_cantidad
  CHECK (cantidad > 0);

ALTER TABLE detalle_factura
  ADD CONSTRAINT chk_detalle_factura_precios
  CHECK (precio_unitario >= 0 AND descuento >= 0 AND subtotal >= 0);

ALTER TABLE detalle_factura
  ADD CONSTRAINT fk_detalle_factura_factura
  FOREIGN KEY (id_factura)
  REFERENCES factura(id_factura)
  ON DELETE CASCADE;

ALTER TABLE detalle_factura
  ADD CONSTRAINT fk_detalle_factura_producto
  FOREIGN KEY (id_producto)
  REFERENCES producto(id_producto);

ALTER TABLE detalle_factura
  ADD CONSTRAINT fk_detalle_factura_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE detalle_factura
  ADD CONSTRAINT fk_detalle_factura_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_detalle_factura_unico
ON detalle_factura (id_factura, id_producto);

/*==============================================================*/
/* 10. CRÉDITOS Y CUOTAS                                        */
/*==============================================================*/

CREATE TABLE credito (
    id_credito        SERIAL PRIMARY KEY,
    id_factura        INT NOT NULL,
    monto_total       NUMERIC(12,2) NOT NULL,
    saldo_pendiente   NUMERIC(12,2) NOT NULL,
    fecha_inicio      DATE NOT NULL,
    fecha_fin         DATE,
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE credito
  ADD CONSTRAINT chk_credito_montos
  CHECK (monto_total >= 0 AND saldo_pendiente >= 0);

ALTER TABLE credito
  ADD CONSTRAINT fk_credito_factura
  FOREIGN KEY (id_factura)
  REFERENCES factura(id_factura);

ALTER TABLE credito
  ADD CONSTRAINT fk_credito_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE credito
  ADD CONSTRAINT fk_credito_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;


CREATE TABLE cuota (
    id_cuota          SERIAL PRIMARY KEY,
    id_credito        INT NOT NULL,
    numero_cuota      INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto_cuota       NUMERIC(12,2) NOT NULL,
    monto_pagado      NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado_cuota      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago        DATE,
    id_usuario_modifi INT NULL
);

ALTER TABLE cuota
  ADD CONSTRAINT chk_cuota_montos
  CHECK (monto_cuota >= 0 AND monto_pagado >= 0);

ALTER TABLE cuota
  ADD CONSTRAINT chk_cuota_estado
  CHECK (estado_cuota IN ('PENDIENTE','PAGADA','VENCIDA'));

ALTER TABLE cuota
  ADD CONSTRAINT fk_cuota_credito
  FOREIGN KEY (id_credito)
  REFERENCES credito(id_credito)
  ON DELETE CASCADE;

ALTER TABLE cuota
  ADD CONSTRAINT fk_cuota_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_cuota_unica
ON cuota (id_credito, numero_cuota);

/*==============================================================*/
/* 11. KARDEX (HISTORIAL DE MOVIMIENTOS DE INVENTARIO)          */
/*==============================================================*/

CREATE TABLE kardex (
    id_kardex         SERIAL PRIMARY KEY,
    id_producto       INT NOT NULL,
    fecha_movimiento  TIMESTAMP NOT NULL DEFAULT NOW(),
    tipo_movimiento   VARCHAR(20) NOT NULL,  -- ENTRADA, SALIDA, AJUSTE
    origen            VARCHAR(20) NOT NULL,  -- COMPRA, VENTA, AJUSTE
    id_referencia     INT,
    cantidad          INT NOT NULL,
    costo_unitario    NUMERIC(12,2) NOT NULL,
    comentario        VARCHAR(255),
    id_estado         INT NOT NULL DEFAULT 1,
    id_usuario_modifi INT NULL
);

ALTER TABLE kardex
  ADD CONSTRAINT chk_kardex_cantidad
  CHECK (cantidad > 0);

ALTER TABLE kardex
  ADD CONSTRAINT chk_kardex_tipo_mov
  CHECK (tipo_movimiento IN ('ENTRADA','SALIDA','AJUSTE'));

ALTER TABLE kardex
  ADD CONSTRAINT chk_kardex_origen
  CHECK (origen IN ('COMPRA','VENTA','AJUSTE'));

ALTER TABLE kardex
  ADD CONSTRAINT fk_kardex_producto
  FOREIGN KEY (id_producto)
  REFERENCES producto(id_producto);

ALTER TABLE kardex
  ADD CONSTRAINT fk_kardex_estado
  FOREIGN KEY (id_estado)
  REFERENCES estado_registro(id_estado);

ALTER TABLE kardex
  ADD CONSTRAINT fk_kardex_usuario_modifi
  FOREIGN KEY (id_usuario_modifi)
  REFERENCES usuario(id_usuario)
  ON DELETE SET NULL;

/*==============================================================*/
/* 12. FUNCIONES Y TRIGGERS DE NEGOCIO                          */
/*==============================================================*/

/*---- 12.1 Recalcular totales de una compra ------------------*/

CREATE OR REPLACE FUNCTION fn_recalcular_totales_compra(p_id_compra INT)
RETURNS VOID AS
$$
DECLARE
    v_subtotal NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO v_subtotal
    FROM producto_compra
    WHERE id_compra = p_id_compra
      AND id_estado <> (SELECT id_estado FROM estado_registro WHERE nombre_estado = 'ANULADO');

    UPDATE compra
    SET subtotal = v_subtotal,
      impuesto = ROUND(v_subtotal * 0.15, 2),
      total    = ROUND(v_subtotal * 1.15, 2)
    WHERE id_compra = p_id_compra;
END;
$$ LANGUAGE plpgsql;


/*---- 12.2 Recalcular totales de una factura -----------------*/

CREATE OR REPLACE FUNCTION fn_recalcular_totales_factura(p_id_factura INT)
RETURNS VOID AS
$$
DECLARE
    v_subtotal NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO v_subtotal
    FROM detalle_factura
    WHERE id_factura = p_id_factura
      AND id_estado <> (SELECT id_estado FROM estado_registro WHERE nombre_estado = 'ANULADO');

    UPDATE factura
    SET subtotal = v_subtotal,
      impuesto = ROUND(v_subtotal * 0.15, 2),
      total    = ROUND(v_subtotal * 1.15, 2)
    WHERE id_factura = p_id_factura;
END;
$$ LANGUAGE plpgsql;


/*---- 12.3 Trigger: al insertar producto_compra ---------------*/
/*     - Actualiza stock del producto                           */
/*     - Inserta movimiento ENTRADA en KARDEX                   */
/*     - Recalcula totales de la compra                         */

CREATE OR REPLACE FUNCTION trg_producto_compra_after_insert()
RETURNS TRIGGER AS
$$
BEGIN
    -- Actualizar stock
    UPDATE producto
    SET cantidad_stock = cantidad_stock + NEW.cantidad_compra
    WHERE id_producto = NEW.id_producto;

    -- Registrar en kardex
    INSERT INTO kardex (
        id_producto,
        fecha_movimiento,
        tipo_movimiento,
        origen,
        id_referencia,
        cantidad,
        costo_unitario,
        comentario
    )
    VALUES (
        NEW.id_producto,
        NOW(),
        'ENTRADA',
        'COMPRA',
        NEW.id_compra,
        NEW.cantidad_compra,
        NEW.costo_unitario,
        'Ingreso por compra'
    );

    -- Recalcular totales de la compra
    PERFORM fn_recalcular_totales_compra(NEW.id_compra);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER producto_compra_ai
AFTER INSERT ON producto_compra
FOR EACH ROW
EXECUTE FUNCTION trg_producto_compra_after_insert();


/*---- 12.4 Trigger: al insertar detalle_factura ---------------*/
/*     - Verifica stock suficiente                              */
/*     - Actualiza stock del producto                           */
/*     - Inserta movimiento SALIDA en KARDEX                    */
/*     - Recalcula totales de la factura                        */

CREATE OR REPLACE FUNCTION trg_detalle_factura_after_insert()
RETURNS TRIGGER AS
$$
DECLARE
    v_stock_actual INT;
BEGIN
    SELECT cantidad_stock
    INTO v_stock_actual
    FROM producto
    WHERE id_producto = NEW.id_producto
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION 'Producto % no existe', NEW.id_producto;
    END IF;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto %: stock actual %, cantidad solicitada %',
            NEW.id_producto, v_stock_actual, NEW.cantidad;
    END IF;

    -- Descontar stock
    UPDATE producto
    SET cantidad_stock = cantidad_stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;

    -- Registrar en kardex
    INSERT INTO kardex (
        id_producto,
        fecha_movimiento,
        tipo_movimiento,
        origen,
        id_referencia,
        cantidad,
        costo_unitario,
        comentario
    )
    VALUES (
        NEW.id_producto,
        NOW(),
        'SALIDA',
        'VENTA',
        NEW.id_factura,
        NEW.cantidad,
        NEW.precio_unitario,
        'Salida por venta'
    );

    -- Recalcular totales de la factura
    PERFORM fn_recalcular_totales_factura(NEW.id_factura);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detalle_factura_ai
AFTER INSERT ON detalle_factura
FOR EACH ROW
EXECUTE FUNCTION trg_detalle_factura_after_insert();

/*==============================================================*/
/*  FIN DEL SCRIPT                                              */
/*==============================================================*/
