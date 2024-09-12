import User from "../models/UserModel.js";
import argon2 from "argon2";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const validRoles = ["admin", "user", "teknis", "manager"];

export const createUser = async (req, res) => {
    const { name, email, password, confPassword, role, nomor_handphone } = req.body;

    // Validasi input
    if (!name || name.trim() === '') return res.status(400).json({ msg: "Name is required" });
    if (!email || email.trim() === '') return res.status(400).json({ msg: "Email is required" });
    if (!role || role.trim() === '') return res.status(400).json({ msg: "Role is required" });

    // Validasi role
    const normalizedRole = role.trim().toLowerCase();
    if (!validRoles.includes(normalizedRole)) return res.status(400).json({ msg: "Invalid role" });

    // Validasi password
    if (password !== confPassword) return res.status(400).json({ msg: "Password and Confirm Password Don't Match" });
    const hashPassword = await argon2.hash(password);

    // Handle profile picture if it exists
    let profile_picture = null;
    let profile_picture_filename = null;
    let profile_picture_mimetype = null;

    if (req.file) {
        // Validate file size
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({ msg: "File size exceeds 2MB limit" });
        }

        // Validate file type
        if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
            return res.status(400).json({ msg: "Invalid file type. Only JPG, PNG, and JPEG are allowed." });
        }

        profile_picture = req.file.buffer;  // Use file buffer
        profile_picture_filename = req.file.originalname;
        profile_picture_mimetype = req.file.mimetype;
    }

    try {
        await User.create({
            name: name,
            email: email,
            password: hashPassword,
            role: normalizedRole,
            nomor_handphone: nomor_handphone,
            profile_picture,
            profile_picture_filename,
            profile_picture_mimetype
        });
        res.status(201).json({ msg: "A New User Registered Successfully" });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: "Email already in use" });
        }
        res.status(500).json({ msg: error.message });
    }
}

export const patchUser = async (req, res) => {
    const userIdToUpdate = req.params.id;
    const loggedInUserId = req.userId; // Misalnya, id pengguna yang sedang login disimpan di req.userId

    // Pastikan pengguna yang sedang login adalah admin atau memodifikasi akun mereka sendiri
    const loggedInUser = await User.findOne({
        where: { id: loggedInUserId }
    });

    if (!loggedInUser) return res.status(401).json({ msg: "Unauthorized" });

    // Hanya admin yang dapat mengubah user lain, tetapi tidak bisa mengubah `role`
    if (loggedInUser.role !== "admin" && loggedInUser.uuid !== userIdToUpdate) {
        return res.status(403).json({ msg: "Forbidden: You can only update your own profile" });
    }

    const user = await User.findOne({
        where: { uuid: userIdToUpdate }
    });

    if (!user) return res.status(404).json({ msg: "User Not Found" });

    const { name, email, password, confPassword, nomor_handphone } = req.body;

    // Validasi: Tidak ada yang dapat mengubah `role`
    if (req.body.role) {
        return res.status(400).json({ msg: "Forbidden: Role cannot be updated" });
    }

    // Validasi password jika disertakan
    if (password) {
        if (password !== confPassword) return res.status(400).json({ msg: "Password and Confirm Password Don't Match" });
    }

    // Handle file attachment if it exists
    let profile_picture = user.profile_picture; // Preserve existing picture if not updated
    let profile_picture_filename = user.profile_picture_filename;
    let profile_picture_mimetype = user.profile_picture_mimetype;

    if (req.file) {
        // Validate file size
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({ msg: "File size exceeds 2MB limit" });
        }

        // Validate file type
        if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
            return res.status(400).json({ msg: "Invalid file type. Only JPG, PNG, and JPEG are allowed." });
        }

        profile_picture = req.file.buffer;  // Use file buffer
        profile_picture_filename = req.file.originalname;
        profile_picture_mimetype = req.file.mimetype;
    }

    try {
        // Update user with provided data, except for `role`
        await User.update({
            name: name ? name : user.name,
            email: email ? email : user.email,
            password: password ? await argon2.hash(password) : user.password,
            nomor_handphone: nomor_handphone ? nomor_handphone : user.nomor_handphone,
            profile_picture: profile_picture,
            profile_picture_filename: profile_picture_filename,
            profile_picture_mimetype: profile_picture_mimetype
        }, {
            where: { uuid: userIdToUpdate }
        });

        res.status(200).json({ msg: "User Updated Successfully" });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: "Email already in use" });
        }
        res.status(500).json({ msg: error.message });
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'uuid', 'name', 'email', 'role', 'nomor_handphone', 'createdAt', 'profile_picture', 'profile_picture_filename', 'profile_picture_mimetype']
        });

        const response = users.map(user => {
            let profile_picture_base64 = null;
            if (user.profile_picture) {
                profile_picture_base64 = user.profile_picture.toString('base64');
            }

            return {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                nomor_handphone: user.nomor_handphone,
                createdAt: user.createdAt,
                profile_picture: profile_picture_base64,
                profile_picture_filename: user.profile_picture_filename
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getUsersTeknis = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'uuid', 'name', 'email', 'role', 'nomor_handphone', 'createdAt', 'profile_picture', 'profile_picture_filename', 'profile_picture_mimetype'],
            where: {
                role: 'teknis'
            }
        });

        const response = users.map(user => {
            let profile_picture_base64 = null;
            if (user.profile_picture) {
                profile_picture_base64 = user.profile_picture.toString('base64');
            }

            return {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                nomor_handphone: user.nomor_handphone,
                createdAt: user.createdAt,
                profile_picture: profile_picture_base64,
                profile_picture_filename: user.profile_picture_filename
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getUsersManager = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'uuid', 'name', 'email', 'role', 'nomor_handphone', 'createdAt', 'profile_picture', 'profile_picture_filename', 'profile_picture_mimetype'],
            where: {
                role: 'manager'
            }
        });

        const response = users.map(user => {
            let profile_picture_base64 = null;
            if (user.profile_picture) {
                profile_picture_base64 = user.profile_picture.toString('base64');
            }

            return {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                nomor_handphone: user.nomor_handphone,
                createdAt: user.createdAt,
                profile_picture: profile_picture_base64,
                profile_picture_filename: user.profile_picture_filename
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        // Mengambil data pengguna dari database
        const user = await User.findOne({
            attributes: ['id', 'uuid', 'name', 'email', 'role', 'nomor_handphone', 'createdAt', 'profile_picture', 'profile_picture_filename', 'profile_picture_mimetype'],
            where: {
                uuid: req.params.id
            }
        });

        if (!user) {
            return res.status(404).json({ msg: "User Not Found" });
        }

        // Jika ada profile_picture, konversi ke base64
        let profile_picture_base64 = null;
        if (user.profile_picture) {
            profile_picture_base64 = user.profile_picture.toString('base64');
        }

        // Kirim respons dengan data pengguna
        res.status(200).json({
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            nomor_handphone: user.nomor_handphone,
            createdAt: user.createdAt,
            profile_picture: profile_picture_base64,
            profile_picture_filename: user.profile_picture_filename
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteUser = async(req, res) =>{
    const user = await User.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if(!user) return res.status(404).json({msg: "User Not Found"});
    try {
        await User.destroy({
            where:{
                id: user.id
            }
        });
        res.status(200).json({msg: "User Deleted Successfully"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
};

export const countUsers = async (req, res) => {
    try {
        // Get total count of Users
        const totalUsers = await User.count();

        res.status(200).json({ totalUsers });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};