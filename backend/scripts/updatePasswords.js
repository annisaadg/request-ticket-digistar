import Users from '../models/UserModel.js'; // Mengimpor default export
import argon2 from 'argon2'; // Mengimpor argon2 untuk hashing

// Fungsi untuk memperbarui password
const updatePasswords = async () => {
    try {
        const users = await Users.findAll(); // Ambil semua pengguna
        for (const user of users) {
            if (user.password && !user.password.startsWith('$')) { // Periksa jika password belum di-hash
                const hashedPassword = await argon2.hash(user.password);
                await Users.update({ password: hashedPassword }, { where: { id: user.id } });
                console.log(`Password untuk user ${user.email} berhasil diperbarui.`);
            }
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
};

updatePasswords();
