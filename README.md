
# Project DIGISTAR CLUB: Ticket for Request to Dev Team

## Problem / Opportunity
Belum adanya fitur request technical issue di Bigbox sehingga masih mengandalkan WhatsApp dan Telegram personal, sehingga menyulitkan membuat priority request.

## Installation & Running
### Clone Repository
```
git clone https://github.com/annisaadg/request-ticket-digistar.git
```
### Atur Koneksi Database
1. Buka file backend\config\Database.js
2. Perhatikan nama schema yang didefinisikan ("digistar")
3. Buat schema baru di database mysql dengan nama schema "digistar"

### Run backend
```
cd backend
```
```
node index
```

## Dokumentasi API 
### Membuat user pertama, yaitu admin
1. **Ubah permission agar dapat menambah user tanpa perlu login terlebih dahulu.**  <br />
Buka file backend\routes\UserRoute.js. Lalu, hapus 'verifyUser' dan 'adminOnly' pada line ke-22.
Before:
```
router.post('/users', verifyUser, adminOnly, upload.single('profile_picture'), createUser);
```
After:
```
router.post('/users', upload.single('profile_picture'), createUser);
```
Selanjutnya, run ulang aplikasi
```
node index
```

2. **Hit POST request di Postman**
Setelah perubahan pada nomor 1 disimpan, hit API POST di Postman untuk menambahkan user pertama, yaitu admin.
![Screenshot 2024-09-09 225736](https://github.com/user-attachments/assets/17b337b2-fbfd-4b1a-b6c6-96dfc1bb574c)
![Screenshot 2024-09-09 230355](https://github.com/user-attachments/assets/ffbbeca2-c8f4-42c1-96d9-f5dcefad652a)
Disini user pertama yaitu admin telah dibuat. 

3. **Kembalikan permission 'verifyUser' dan 'adminOnly' yang dibahas pada nomor 1.**  <br />
Setelah berhasil membuat user pertama, kembalikan permission seperti semula pada file backend\routes\UserRoute.js.
Before:
```
router.post('/users', upload.single('profile_picture'), createUser);
```
After:
```
router.post('/users', verifyUser, adminOnly, upload.single('profile_picture'), createUser);
```
Selanjutnya, run ulang aplikasi
```
node index
```
Setelah langkah ini, jika ingin menambah atau membuat user cukup login sebagai admin lalu hit API untuk create user baru, karena permission untuk menambah user hanya untuk admin.

### Dokumentasi API lainnya
Dokumentasi lengkap mengenai API terdapat pada path berikut: 
```
backend\request_based_on_feature
```
Disana terdapat dokumentasi lengkap API beserta comment-nya, untuk masing masing fitur/page 
