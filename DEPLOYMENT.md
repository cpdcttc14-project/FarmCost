# FarmCost: PWA, Netlify และ APK

## 1. ตรวจสอบ PWA

ไฟล์ที่เกี่ยวข้อง:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon-180.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `src/registerServiceWorker.js`
- `index.html`

คำสั่ง build:

```bash
npm run build
```

หลัง build ให้เปิดผ่าน HTTP/HTTPS เช่น `http://localhost:4293/` หรือ Netlify เพราะ Service Worker และ PWA ไม่ทำงานเต็มรูปแบบเมื่อเปิดด้วย `file://`

เมื่อต้องการอัปเดต cache ของ PWA ให้เปลี่ยนค่า `CACHE_NAME` ใน `public/sw.js` เช่นจาก `farmcost-pwa-v1` เป็น `farmcost-pwa-v2` แล้ว build/deploy ใหม่

## 2. Deploy ไป Netlify

โปรเจกต์มีไฟล์ `netlify.toml` แล้ว:

- Build command: `npm run build`
- Publish directory: `dist`
- ตั้ง cache header สำหรับ `sw.js`, manifest และ assets
- ตั้ง redirect สำหรับ SPA ไปที่ `index.html`

ขั้นตอนผ่าน Netlify UI:

1. สร้าง Project ใหม่ใน Netlify
2. เลือก repo หรืออัปโหลดโฟลเดอร์ build
3. ตั้ง Build command เป็น `npm run build`
4. ตั้ง Publish directory เป็น `dist`
5. Deploy

ขั้นตอนผ่าน Netlify CLI:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build
netlify deploy --build --prod
```

ถ้าต้องการให้ Codex deploy ผ่าน Netlify connector ให้ยืนยันชื่อไซต์หรือ site id ก่อน เพราะตอนนี้บัญชี Netlify ที่เชื่อมอยู่ยังไม่มีไซต์

## 3. เตรียม APK ด้วย Capacitor

ติดตั้ง Capacitor:

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli @capacitor/assets
```

เพิ่ม Android project ครั้งแรก:

```bash
npm run build
npm run cap:add:android
npm run cap:assets
npm run cap:sync
```

เปิดใน Android Studio:

```bash
npx cap open android
```

สร้าง APK แบบ Debug บน Windows:

```bash
npm run apk:debug
```

ไฟล์ APK จะอยู่ที่:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

สร้าง APK แบบ Release:

```bash
npm run apk:release
```

หมายเหตุ: APK release ต้องตั้งค่า signing/keystore ใน Android Studio หรือ Gradle ก่อนจึงจะนำไปเผยแพร่ได้

## 4. เมื่อแก้ไขโค้ดในอนาคต

สำหรับ PWA:

1. แก้โค้ด
2. ถ้าแก้ไฟล์สำคัญของ app shell ให้เพิ่มเวอร์ชัน `CACHE_NAME` ใน `public/sw.js`
3. รัน `npm run build`
4. Deploy ขึ้น Netlify ใหม่
5. ทดสอบหน้าเว็บด้วย URL เวอร์ชันใหม่หรือ Hard refresh

สำหรับ APK:

1. แก้โค้ด
2. รัน `npm run build`
3. รัน `npm run cap:sync`
4. ถ้าเปลี่ยนไอคอน/สแปลช ให้รัน `npm run cap:assets`
5. เพิ่ม version code/version name ใน Android project
6. รัน `npm run apk:debug` หรือ `npm run apk:release`
