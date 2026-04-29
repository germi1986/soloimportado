# Solo Importado Mayorista

Base limpia para portal mayorista privado en Next.js + Vercel.

## Variables necesarias en Vercel

Mínimo para login:

```env
WHOLESALE_USER=cliente
WHOLESALE_PASSWORD=clave-segura
AUTH_COOKIE_NAME=soloimportado_auth
```

Para productos desde Google Sheets hay dos opciones.

### Opción A: CSV publicado

```env
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0
```

### Opción B: Google Sheet privado con Service Account

```env
GOOGLE_SHEETS_ID=id_de_la_hoja
GOOGLE_SHEETS_RANGE=Productos!A:Z
GOOGLE_SERVICE_ACCOUNT_EMAIL=cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Importante: compartir la hoja con el email de la service account como lector.

## Columnas aceptadas en la hoja

La primera fila debe tener encabezados. Se reconocen estos nombres:

- `id`
- `sku`
- `nombre` o `name` o `producto`
- `marca` o `brand`
- `categoria` o `category`
- `descripcion` o `description`
- `precio` o `price` o `precio_mayorista`
- `stock` o `disponible`
- `imagen` o `image` o `image_url`

## Comandos

```bash
npm install
npm run dev
npm run build
```
Deploy trigger
